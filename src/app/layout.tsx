import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gestão da Comunicação + Inteligência da Intranet BeeHome",
  description:
    "Plataforma de inteligência de dados para a área de Comunicação — ambiente demonstrativo com dados fictícios.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-bg text-text-primary">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
