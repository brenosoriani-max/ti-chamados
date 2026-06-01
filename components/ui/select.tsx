"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "flex h-11 w-full rounded-xl border border-input bg-card/40 backdrop-blur-sm px-4 py-2 text-sm outline-none transition-all focus-visible:ring-2 focus-visible:ring-primary/20 focus:border-primary appearance-none cursor-pointer",
        className
      )}
      {...props}
    />
  );
}
