import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { MCPProvider } from "@/contexts/mcp-context";
import { ChatProvider } from "@/contexts/chat-context";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI 채팅 앱",
  description: "Gemini 2.0 Flash를 활용한 AI 채팅 애플리케이션",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ChatProvider>
          <MCPProvider>
            {children}
          </MCPProvider>
        </ChatProvider>
      </body>
    </html>
  );
}
