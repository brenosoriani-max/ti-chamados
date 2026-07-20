"use client";

import { useState } from "react";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { Input } from "@/components/ui/input";

type AuthPasswordInputProps = {
  placeholder: string;
  autoComplete: "current-password" | "new-password";
};

export function AuthPasswordInput({ placeholder, autoComplete }: AuthPasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input name="password" type={visible ? "text" : "password"} autoComplete={autoComplete} placeholder={placeholder} className="h-12 bg-background pl-11 pr-12" required />
      <button type="button" onClick={() => setVisible((current) => !current)} className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label={visible ? "Ocultar senha" : "Mostrar senha"}>
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
