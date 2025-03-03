// lib/chatService.ts
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
} from "firebase/firestore";
import app from "./firebaseClient";

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

export async function addMessageToChat(
  userId: string,
  chatId: string,
  text: string,
  sender: "user" | "bot"
) {
  const messagesRef = collection(db, `users/${userId}/chats/${chatId}/messages`);
  await addDoc(messagesRef, {
    text: text ?? "",  // Use an empty string if text is undefined
    sender,
    timestamp: serverTimestamp(),
  });
}


export async function fetchMessagesForChat(userId: string, chatId: string) {
  const messagesRef = collection(db, `users/${userId}/chats/${chatId}/messages`);
  const q = query(messagesRef, orderBy("timestamp", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}
