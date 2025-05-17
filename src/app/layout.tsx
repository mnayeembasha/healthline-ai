"use client";
import { ToastProvider } from "@/components/ui/toast";
import localFont from "next/font/local";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <div className="flex flex-col min-h-screen font-mona">
              <Navbar />
              <main className="flex-grow">
                <div className="min-h-screen">{children}</div>
              </main>
              <Footer />
            </div>
          </ToastProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
