import { nanoid } from "nanoid";
import {
  getFirestore,
  doc,
  collection,
  setDoc,
  getDocs,
  addDoc,
  query,
  orderBy,
  serverTimestamp,
  deleteDoc,
  writeBatch,
  updateDoc,
  limit,
} from "firebase/firestore";
import app from "./firebaseClient";
import { encryptMessage, decryptMessage, generateUserKey } from "../utils/encryption";

const db = getFirestore(app);

export async function deleteChat(userId: string, chatId: string) {
  const chatRef = doc(db, `users/${userId}/chats/${chatId}`);
  await deleteDoc(chatRef);
}

export async function deleteChatWithMessages(userId: string, chatId: string) {
  const chatRef = doc(db, `users/${userId}/chats/${chatId}`);
  const messagesRef = collection(db, `users/${userId}/chats/${chatId}/messages`);

  const batch = writeBatch(db);
  const snapshot = await getDocs(messagesRef);
  snapshot.forEach((msgDoc) => {
    batch.delete(msgDoc.ref);
  });
  batch.delete(chatRef);
  await batch.commit();
}

export async function createChat(userId: string) {
  const chatId = nanoid(10);
  const chatRef = doc(db, `users/${userId}/chats/${chatId}`);
  await setDoc(chatRef, {
    title: "New Chat",
    createdAt: serverTimestamp(),
  });
  return chatId;
}

export async function fetchChats(userId: string) {
  const chatsRef = collection(db, `users/${userId}/chats`);
  const q = query(chatsRef, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

// Helper function to generate a chat title from the first message
function generateChatTitle(text: string): string {
  // Remove any markdown formatting
  const cleanText = text.replace(/[#*`]/g, '');
  
  // Get the first sentence or first 50 characters
  const firstSentence = cleanText.split(/[.!?]/, 1)[0].trim();
  if (firstSentence.length <= 50) return firstSentence;
  
  // If longer than 50 chars, truncate and add ellipsis
  return firstSentence.substring(0, 47) + "...";
}

export async function addMessageToChat(
  userId: string,
  chatId: string,
  text: string,
  sender: "user" | "bot"
) {
  const messagesRef = collection(db, `users/${userId}/chats/${chatId}/messages`);
  
  // Get existing messages to check if this is the first one
  const q = query(messagesRef, orderBy("timestamp", "asc"), limit(1));
  const snapshot = await getDocs(q);
  const isFirstMessage = snapshot.empty;

  // Generate encryption key for the user
  const userKey = generateUserKey(userId);

  // Encrypt the message text
  const encryptedText = encryptMessage(text, userKey);

  // Add the encrypted message
  await addDoc(messagesRef, {
    text: encryptedText,
    sender,
    timestamp: serverTimestamp(),
    isEncrypted: true // Flag to indicate the message is encrypted
  });

  // If this is the first user message, update the chat title
  // Note: We store the title in plain text for searchability
  if (isFirstMessage && sender === "user") {
    const chatRef = doc(db, `users/${userId}/chats/${chatId}`);
    const title = generateChatTitle(text);
    await updateDoc(chatRef, { title });
  }
}

export async function fetchMessagesForChat(userId: string, chatId: string) {
  const messagesRef = collection(db, `users/${userId}/chats/${chatId}/messages`);
  const q = query(messagesRef, orderBy("timestamp", "asc"));
  const snapshot = await getDocs(q);
  
  // Generate encryption key for the user
  const userKey = generateUserKey(userId);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    // Decrypt the message if it's encrypted
    const text = data.isEncrypted 
      ? decryptMessage(data.text, userKey)
      : data.text;

    return {
      id: doc.id,
      ...data,
      text // Replace encrypted text with decrypted text
    };
  });
} 