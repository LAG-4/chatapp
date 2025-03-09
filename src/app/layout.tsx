import type { Metadata } from "next";
import "./globals.css";
import { Fira_Code, Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import UserSync from "@/components/UserSync";
import { PostHogProvider } from "./providers";
import 'highlight.js/styles/github-dark.css';
import { Toaster } from 'react-hot-toast';

const firaCode = Fira_Code({
  variable: "--font-fira-code",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LAG AI | Access multiple chatbots in one place",
  description: "AI Chatbot app created by Aryan",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${firaCode.variable} ${geistSans.variable} ${geistMono.variable}`}
    >
      <body>
        <ClerkProvider>
          <PostHogProvider>
            <UserSync />
            {children}
            <Toaster position="top-center" />
          </PostHogProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
