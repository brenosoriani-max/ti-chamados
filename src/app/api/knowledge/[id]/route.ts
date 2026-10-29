import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
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

    const contentType = request.headers.get("content-type") || "";
    const isMultipart = contentType.includes("multipart/form-data");

    let title: string | undefined;
    let content: string | undefined;
    let tags: string | undefined;
    let categoryId: string | undefined;
    let attachmentName: string | undefined;
    let attachmentUrl: string | undefined;
    let file: File | null = null;
    let isQuickReply: boolean | undefined;

    if (isMultipart) {
      const formData = await request.formData();
      title = formData.get("title") ? String(formData.get("title")).trim() : undefined;
      content = formData.get("content") ? String(formData.get("content")).trim() : undefined;
      tags = formData.get("tags") ? String(formData.get("tags")).trim() : undefined;
      categoryId = formData.get("categoryId") ? String(formData.get("categoryId")) : undefined;
      attachmentName = formData.get("attachmentName") ? String(formData.get("attachmentName")).trim() : undefined;
      attachmentUrl = formData.get("attachmentUrl") ? String(formData.get("attachmentUrl")).trim() : undefined;
      isQuickReply = formData.get("isQuickReply") === "true";
      const uploaded = formData.get("attachment");
      if (uploaded instanceof File && uploaded.size > 0) {
        file = uploaded;
      }
    } else {
      const body = await request.json();
      title = body.title !== undefined ? String(body.title).trim() : undefined;
      content = body.content !== undefined ? String(body.content).trim() : undefined;
      tags = body.tags !== undefined ? String(body.tags).trim() : undefined;
      categoryId = body.categoryId !== undefined ? body.categoryId || undefined : undefined;
      attachmentName = body.attachmentName !== undefined ? String(body.attachmentName).trim() || undefined : undefined;
      attachmentUrl = body.attachmentUrl !== undefined ? String(body.attachmentUrl).trim() || undefined : undefined;
      isQuickReply = body.isQuickReply !== undefined ? Boolean(body.isQuickReply) : undefined;
    }

    if (title !== undefined) article.title = title;
    if (content !== undefined) article.content = content;
    if (tags !== undefined) article.tags = tags;
    if (categoryId !== undefined) article.categoryId = categoryId || undefined;
    if (isQuickReply !== undefined) article.isQuickReply = isQuickReply;

    if (file) {
      const uploadDirectory = path.join(process.cwd(), "public", "uploads", "knowledge");
      await mkdir(uploadDirectory, { recursive: true });
      const safeName = `${randomUUID()}-${(file.name || "arquivo").replace(/[^a-zA-Z0-9._-]/g, "-")}`;
      const filePath = path.join(uploadDirectory, safeName);
      await writeFile(filePath, Buffer.from(await file.arrayBuffer()));
      article.attachmentName = attachmentName || file.name;
      article.attachmentUrl = `/uploads/knowledge/${safeName}`;
    } else {
      if (attachmentName !== undefined) article.attachmentName = attachmentName || undefined;
      if (attachmentUrl !== undefined) article.attachmentUrl = attachmentUrl || undefined;
    }

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
