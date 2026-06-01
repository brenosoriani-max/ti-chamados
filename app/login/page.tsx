import { LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <LockKeyhole className="h-5 w-5" />
          </div>
          <CardTitle>Entrar no Service Desk</CardTitle>
          <p className="text-sm text-muted-foreground">Use admin@empresa.com, tecnico@empresa.com ou cliente@empresa.com com senha 123456 apos rodar o seed.</p>
        </CardHeader>
        <CardContent>
          <form action="/api/auth/login" method="post" className="space-y-3">
            <Input name="email" type="email" placeholder="email@empresa.com" required />
            <Input name="password" type="password" placeholder="Senha" required />
            <Button className="w-full">Acessar</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
