import React from 'react';
import type { Metadata } from 'next';
import '../globals.css';
import { Fira_Code, Geist, Geist_Mono } from "next/font/google";

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
  title: 'Blog | Aryan',
  description: 'Welcome to my personal blog',
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html 
      lang="en"
      className={`${firaCode.variable} ${geistSans.variable} ${geistMono.variable}`}
    >
      <body>
        <main>{children}</main>
      </body>
    </html>
  );
} 