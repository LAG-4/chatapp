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
  apiKey: process.env.GROQ_API_KEY!,
  modelName: "llama-3.3-70b-versatile", // Using Mixtral for better performance
  temperature: 0.5,
});

// File path for storing vector data
const VECTOR_STORE_PATH = path.join(os.tmpdir(), 'vector_store.json');

export async function POST(req: Request) {
  let tempFilePath = '';
  
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create a temporary file with a unique name in the OS temp directory
    const tempDir = os.tmpdir();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const safeName = file.name.replace(/[^a-zA-Z0-9]/g, '_');
    tempFilePath = path.join(tempDir, `${uniqueSuffix}-${safeName}`);

    // Ensure the temp directory exists and write the file
    fs.writeFileSync(tempFilePath, buffer);

    // Load and process the PDF
    const loader = new PDFLoader(tempFilePath);
    const docs = await loader.load();

    // Split text into chunks
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 4000,
      chunkOverlap: 200,
    });
    const splitDocs = await textSplitter.splitDocuments(docs);

    // Create vector store with HuggingFace embeddings
    const hfEmbeddings = new HuggingFaceInferenceEmbeddings({
      apiKey: process.env.HUGGINGFACE_API_KEY,
      model: "sentence-transformers/all-MiniLM-L6-v2" // Lightweight, fast, and good performance
    });

    // Generate embeddings for all documents
    const embeddings = await Promise.all(
      splitDocs.map(async (doc) => ({
        text: doc.pageContent,
        metadata: doc.metadata,
        embedding: await hfEmbeddings.embedQuery(doc.pageContent),
      }))
    );

    // Save embeddings to file
    fs.writeFileSync(VECTOR_STORE_PATH, JSON.stringify({ embeddings }));

    // Create vector store for immediate use
    const vectorStore = new MemoryVectorStore(hfEmbeddings);
    for (const item of embeddings) {
      await vectorStore.addVectors(
        [item.embedding],
        [{ pageContent: item.text, metadata: item.metadata }]
      );
    }

    // Generate summary using Groq
    const summary = await model.invoke(
      "Generate a concise summary of the following document. Focus on the main points and key takeaways: " + 
      docs.map(doc => doc.pageContent).join("\n")
    );

    return NextResponse.json({
      success: true,
      summary: summary.content,
    });

  } catch (error: any) {
    console.error('Error processing document:', error);
    return NextResponse.json(
      { error: error.message || 'Error processing document' },
      { status: 500 }
    );
  } finally {
    // Clean up: delete the temporary file if it exists
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (e) {
        console.error('Error cleaning up temporary file:', e);
      }
    }
  }
} 