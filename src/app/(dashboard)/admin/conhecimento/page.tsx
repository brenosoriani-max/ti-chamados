import { Suspense } from "react";
import { redirect } from "next/navigation";
import { BookOpenText } from "lucide-react";
import { getSession } from "@/lib/auth";
import { getRepository, initializeDatabase } from "@/lib/database";
import { KnowledgeArticle } from "@/entities/KnowledgeArticle";
import { Category } from "@/entities/Category";
import { Role } from "@/types";
import { KnowledgeBase } from "@/components/knowledge-base";
import { Skeleton } from "@/components/ui/skeleton";

async function KnowledgeContent() {
  await initializeDatabase();

  const [articles, categories] = await Promise.all([
    getRepository(KnowledgeArticle).find({
      relations: ["category"],
      order: { createdAt: "DESC" },
    }),
    getRepository(Category).find({ order: { name: "ASC" } }),
  ]);

  const serializedArticles = articles.map((a) => ({
    id: a.id,
    title: a.title,
    content: a.content,
    tags: a.tags ?? null,
    categoryId: a.categoryId ?? null,
    attachmentName: a.attachmentName ?? null,
    attachmentUrl: a.attachmentUrl ?? null,
    isQuickReply: Boolean(a.isQuickReply),
    category: a.category ? { name: a.category.name } : null,
  }));

  const serializedCategories = categories.map((c) => ({ id: c.id, name: c.name }));

  return (
    <KnowledgeBase
      articles={serializedArticles}
      categories={serializedCategories}
      canEdit={true}
    />
  );
}

export default async function KnowledgePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== Role.ADMIN && session.role !== Role.TECNICO) redirect("/cliente");

  return (
    <div className="flex flex-col gap-8 ">
      <header className="space-y-1">
        <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest leading-none mb-2">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          Gestão de Conteúdo
        </div>
        <h1 className="text-4xl font-black tracking-tight text-foreground">Base de Conhecimento</h1>
        <p className="text-sm text-muted-foreground font-medium">
          Artigos, soluções e procedimentos para acelerar o atendimento técnico.
        </p>
      </header>

      <Suspense
        fallback={
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-2xl" />
            ))}
          </div>
        }
      >
        <KnowledgeContent />
      </Suspense>
    </div>
  );
}
