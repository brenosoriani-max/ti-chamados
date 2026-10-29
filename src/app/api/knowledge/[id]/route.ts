import { NextRequest, NextResponse } from "next/server";
import { getRepository, initializeDatabase } from "@/lib/database";
import { KnowledgeArticle } from "@/entities/KnowledgeArticle";
import { requireSession } from "@/lib/auth";
import { Role } from "@/types";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initializeDatabase();
    const { id } = await params;
    const article = await getRepository(KnowledgeArticle).findOne({
      where: { id },
      relations: ["category"],
    });

    if (!article) {
      return NextResponse.json({ error: "Artigo não encontrado." }, { status: 404 });
    }

    return NextResponse.json({ article });
  } catch {
    return NextResponse.json({ error: "Não foi possível carregar o artigo." }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSession([Role.ADMIN, Role.TECNICO]);
    await initializeDatabase();
    const { id } = await params;

    const article = await getRepository(KnowledgeArticle).findOne({ where: { id } });
    if (!article) {
      return NextResponse.json({ error: "Artigo não encontrado." }, { status: 404 });
    }

    const body = await request.json();
    if (body.title !== undefined) article.title = String(body.title).trim();
    if (body.content !== undefined) article.content = String(body.content).trim();
    if (body.tags !== undefined) article.tags = String(body.tags).trim();
    if (body.categoryId !== undefined) article.categoryId = body.categoryId || undefined;

    if (!article.title || !article.content) {
      return NextResponse.json({ error: "Título e conteúdo são obrigatórios." }, { status: 400 });
    }

    await getRepository(KnowledgeArticle).save(article);
    return NextResponse.json({ success: true, article });
  } catch {
    return NextResponse.json({ error: "Não foi possível atualizar o artigo." }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSession([Role.ADMIN, Role.TECNICO]);
    await initializeDatabase();
    const { id } = await params;

    const article = await getRepository(KnowledgeArticle).findOne({ where: { id } });
    if (!article) {
      return NextResponse.json({ error: "Artigo não encontrado." }, { status: 404 });
    }

    await getRepository(KnowledgeArticle).remove(article);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Não foi possível remover o artigo." }, { status: 500 });
  }
}
