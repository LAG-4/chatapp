import type { Metadata } from "next";
import "./globals.css";
import { Fira_Code, Geist, Geist_Mono } from "next/font/google";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs'
const firaCode = Fira_Code({
  variable: "--font-fira-code",
  subsets: ["latin"],
  weight: ['400', '500', '600', '700'],
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
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
    <html lang="en">
     <body
  className={`${geistSans.variable} ${geistMono.variable} ${firaCode.variable} font-sans`}>
        {children}
      </body>
    </html>
    </ClerkProvider>
  );
}
