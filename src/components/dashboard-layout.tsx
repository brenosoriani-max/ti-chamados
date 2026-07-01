"use client";

import { Sidebar } from "@/components/sidebar";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
  user: any;
}

export function DashboardLayout({ children, user }: DashboardLayoutProps) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login" || pathname === "/register";

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar user={user} />
      <main className="flex-1 overflow-auto lg:pl-72 focus:outline-none">
        <div className="h-full w-full max-w-[1600px] mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
