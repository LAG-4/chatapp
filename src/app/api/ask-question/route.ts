import { NextResponse } from 'next/server';
import { ChatGroq } from "@langchain/groq";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Initialize the Groq model
const model = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY!,
  modelName: "llama-3.3-70b-versatile",
  temperature: 0.5,
});

// File path for storing vector data
const VECTOR_STORE_PATH = path.join(os.tmpdir(), 'document_vectors.json');

export async function POST(req: Request) {
  try {
    const { question, fileName, maxTokens = 4000 } = await req.json();

    if (!question) {
      return NextResponse.json(
        { error: "No question provided" },
        { status: 400 }
      );
    }

    if (!fs.existsSync(VECTOR_STORE_PATH)) {
      return NextResponse.json(
        { error: "No document data found" },
        { status: 404 }
      );
    }

    // Read the stored vector data
    const vectorData = JSON.parse(fs.readFileSync(VECTOR_STORE_PATH, 'utf-8'));
    
    if (vectorData.fileName !== fileName) {
      return NextResponse.json(
        { error: "Document not found, Please upload it again" },
        { status: 404 }
      );
    }

    // Initialize embeddings and vector store
    const embeddings = new HuggingFaceInferenceEmbeddings({
      apiKey: process.env.HUGGINGFACE_API_KEY,
    });

    // Create a new vector store with the stored documents
    const vectorStore = await MemoryVectorStore.fromDocuments(
      vectorData.docs.map((doc: any) => ({
        pageContent: doc.pageContent,
        metadata: doc.metadata,
      })),
      embeddings
    );

    // Perform similarity search
    const similarDocs = await vectorStore.similaritySearch(question, 3);

    // Combine relevant chunks while respecting token limit
    let contextText = "";
    for (const doc of similarDocs) {
      if ((contextText + doc.pageContent).length * 1.5 < maxTokens) { // Rough estimate of tokens
        contextText += doc.pageContent + "\n\n";
      } else {
        break;
      }
    }

    // Initialize the chat model
    const model = new ChatGroq({
      apiKey: process.env.GROQ_API_KEY,
      temperature: 0.3,
      modelName: "llama-3.3-70b-versatile",
    });

    // Generate answer
    const prompt = `Context: ${contextText}\n\nQuestion: ${question}\n\nPlease answer the question based on the context provided. If the answer cannot be found in the context, say so.`;
    const response = await model.invoke(prompt);

    return NextResponse.json({ answer: response.content });

  } catch (error: any) {
    console.error("Error processing question:", error);
    
    if (error.message.includes("rate_limit_exceeded")) {
      return NextResponse.json(
        { error: "The document is too large to process. Please try a more specific question." },
        { status: 413 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to process question" },
      { status: 500 }
    );
  }
} 