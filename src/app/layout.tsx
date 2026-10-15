import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { ThemeProvider } from "next-themes";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TI Chamados | Service Desk",
  description: "Portal de suporte técnico e gerenciamento de chamados.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.className} selection:bg-primary/20`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          storageKey="ti-chamados-theme"
        >
          {children}
          <Toaster position="top-right" expand={false} richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
