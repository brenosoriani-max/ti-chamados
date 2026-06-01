import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TI Chamados",
  description: "Service Desk profissional com SLA, auditoria e dashboards"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
