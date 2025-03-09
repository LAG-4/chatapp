import { NextResponse } from 'next/server';
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { ChatGroq } from "@langchain/groq";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';


// Initialize the Groq model
const model = new ChatGroq({
  apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY!,
  modelName: "llama-3.3-70b-versatile", // Using Mixtral for better performance
  temperature: 0.5,
});

// File path for storing vector data
const VECTOR_STORE_PATH = path.join(os.tmpdir(), 'document_vectors.json');

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const chunkSize = parseInt(formData.get("chunkSize") as string) || 2000;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Create a unique temporary file path
    const tempFilePath = path.join(
      os.tmpdir(),
      `upload_${Date.now()}_${Math.random().toString(36).slice(2)}.pdf`
    );

    try {
      // Write the uploaded file to the temporary location
      const bytes = await file.arrayBuffer();
      fs.writeFileSync(tempFilePath, Buffer.from(bytes));

      // Load the PDF
      const loader = new PDFLoader(tempFilePath);
      const docs = await loader.load();

      // Split text into chunks
      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: chunkSize,
        chunkOverlap: 200,
      });

      const splitDocs = await textSplitter.splitDocuments(docs);

      // Initialize HuggingFace embeddings
      const embeddings = new HuggingFaceInferenceEmbeddings({
        apiKey: process.env.HUGGINGFACE_API_KEY,
      });

      // Create and save the vector store
      const vectorStore = await MemoryVectorStore.fromDocuments(
        splitDocs,
        embeddings
      );

      // Save vector store data
      const vectorData = {
        docs: splitDocs.map(doc => ({
          pageContent: doc.pageContent,
          metadata: doc.metadata,
        })),
        fileName: file.name,
      };
      fs.writeFileSync(VECTOR_STORE_PATH, JSON.stringify(vectorData));

      // Generate a summary using the first chunk to avoid token limits
      const model = new ChatGroq({
        apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY,
        temperature: 0.3,
        modelName: "llama-3.3-70b-versatile",
      });

      const firstChunk = splitDocs[0].pageContent;
      const summaryPrompt = `Please provide a brief summary of the following text. Focus on the main points and keep it concise: ${firstChunk}`;

      const summary = await model.invoke(summaryPrompt);

      return NextResponse.json({ summary: summary.content });

    } finally {
      // Clean up: delete the temporary file
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }

  } catch (error: any) {
    console.error("Error processing document:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process document" },
      { status: 500 }
    );
  }
} 