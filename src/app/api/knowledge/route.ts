import { NextRequest, NextResponse } from "next/server";
import { getRepository, initializeDatabase } from "@/lib/database";
import { KnowledgeArticle } from "@/entities/KnowledgeArticle";
import { requireSession } from "@/lib/auth";
import { Role } from "@/types";

export async function GET() {
  try {
    await initializeDatabase();
    const articles = await getRepository(KnowledgeArticle).find({
      relations: ["category"],
      order: { createdAt: "DESC" },
    });

    return NextResponse.json({ articles });
  } catch {
    return NextResponse.json({ error: "Não foi possível carregar a base de conhecimento." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession([Role.ADMIN, Role.TECNICO]);
    await initializeDatabase();

    const body = await request.json();
    const title = String(body.title ?? "").trim();
    const content = String(body.content ?? "").trim();
    const tags = String(body.tags ?? "").trim();
    const categoryId = body.categoryId ? String(body.categoryId) : undefined;

    if (!title || !content) {
      return NextResponse.json({ error: "Título e conteúdo são obrigatórios." }, { status: 400 });
    }

    const article = getRepository(KnowledgeArticle).create({
      title,
      content,
      tags,
      categoryId,
    });

    await getRepository(KnowledgeArticle).save(article);

    return NextResponse.json({ success: true, article });
  } catch {
    return NextResponse.json({ error: "Não foi possível salvar o artigo." }, { status: 500 });
  }
}
