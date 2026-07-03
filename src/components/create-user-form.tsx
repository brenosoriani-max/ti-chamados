"use client";

import { useRef, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { UserPlus } from "lucide-react";
import { createUserAction } from "@/app/actions";

export function CreateUserForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      const result = await createUserAction(formData);

      if (result.success) {
        toast.success(result.message);
        formRef.current?.reset();
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Nome Completo</label>
        <Input name="name" placeholder="Ex: João Silva" className="h-11 bg-background border-border/40 focus:border-primary/40 rounded-xl text-xs" required />
      </div>
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">E-mail Corporativo</label>
        <Input name="email" type="email" placeholder="joao@empresa.com" className="h-11 bg-background border-border/40 focus:border-primary/40 rounded-xl text-xs" required />
      </div>
      <div className="grid grid-cols-1 gap-5">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Perfil de Acesso</label>
          <Select name="role" defaultValue="CLIENTE" required className="h-11 bg-background border-border/40 focus:border-primary/40 rounded-xl text-xs">
            <option value="CLIENTE">Colaborador</option>
            <option value="TECNICO">Técnico</option>
            <option value="ADMIN">Administrador</option>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Senha (Padrão: ti123456)</label>
          <Input name="password" type="password" placeholder="••••••••" className="h-11 bg-background border-border/40 focus:border-primary/40 rounded-xl text-xs" />
        </div>
      </div>
      <Button type="submit" disabled={isPending} className="w-full h-12 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] mt-2 shadow-lg shadow-primary/10">
        <UserPlus className="h-3.5 w-3.5 mr-2" />
        {isPending ? "Cadastrando..." : "Cadastrar Usuário"}
      </Button>
    </form>
  );
}