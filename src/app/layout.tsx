import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "InfoFlow — Turn Information Into Insight",
  description: "Collect, organize, and synthesize content from across the web with AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex font-sans tracking-[-0.011em]">
        {children}
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
