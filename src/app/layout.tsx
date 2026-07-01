import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TI Chamados | Service Desk",
  description: "Portal de suporte técnico e gerenciamento de chamados."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className="dark" style={{ colorScheme: 'dark' }}>
      <body className={`${inter.className} selection:bg-primary/20`}>
        {children}
        <Toaster position="top-right" expand={false} richColors closeButton />
        
      </body>
    </html>
  );
}
