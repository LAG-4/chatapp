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
const VECTOR_STORE_PATH = path.join(os.tmpdir(), 'vector_store.json');

export async function POST(req: Request) {
  try {
    const { question } = await req.json();

    // Check if vector store data exists
    if (!fs.existsSync(VECTOR_STORE_PATH)) {
      return NextResponse.json(
        { error: 'No document has been processed yet' },
        { status: 400 }
      );
    }

    // Read vector store data
    const { embeddings } = JSON.parse(fs.readFileSync(VECTOR_STORE_PATH, 'utf-8'));

    // Initialize HuggingFace embeddings
    const hfEmbeddings = new HuggingFaceInferenceEmbeddings({
      apiKey: process.env.HUGGINGFACE_API_KEY,
      model: "sentence-transformers/all-MiniLM-L6-v2"
    });

    // Create a new vector store with the stored embeddings
    const vectorStore = new MemoryVectorStore(hfEmbeddings);
    
    // Add the stored documents and embeddings back to the vector store
    for (const item of embeddings) {
      await vectorStore.addVectors(
        [item.embedding],
        [{ pageContent: item.text, metadata: item.metadata }]
      );
    }

    // Search for relevant document chunks
    const relevantDocs = await vectorStore.similaritySearch(question, 3);

    // Construct the prompt with context
    const context = relevantDocs.map(doc => doc.pageContent).join("\n\n");
    const prompt = `Based on the following context, please answer the question. If the answer cannot be found in the context, say "I cannot find the answer in the document."

Context:
${context}

Question: ${question}

Answer:`;

    // Generate answer using Groq
    const response = await model.invoke(prompt);

    return NextResponse.json({
      success: true,
      answer: response.content,
    });

  } catch (error: any) {
    console.error('Error processing question:', error);
    return NextResponse.json(
      { error: error.message || 'Error processing question' },
      { status: 500 }
    );
  }
} 