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
  getDoc,
} from "firebase/firestore";
import app from "@/lib/firebaseClient";

const db = getFirestore(app);

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
  return snapshot.docs.map(doc => ({
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
    text,
    sender,
    timestamp: serverTimestamp(),
  });
}

export async function fetchMessagesForChat(userId: string, chatId: string) {
  const messagesRef = collection(db, `users/${userId}/chats/${chatId}/messages`);
  const q = query(messagesRef, orderBy("timestamp", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
}
