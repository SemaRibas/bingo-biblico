import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/contexts/AppContext";
import { Providers } from "@/components/Providers";
import { SidebarProvider } from "@/components/layout/SidebarContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bingo Bíblico - Gerenciamento",
  description: "Sistema de gerenciamento de Bingo Bíblico + Envelope Surpresa",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-background text-foreground">
        <Providers>
          <SidebarProvider>
            <AppProvider>{children}</AppProvider>
          </SidebarProvider>
        </Providers>
      </body>
    </html>
  );
}
