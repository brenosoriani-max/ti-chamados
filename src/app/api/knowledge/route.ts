import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { getRepository, initializeDatabase } from "@/lib/database";
import { KnowledgeArticle } from "@/entities/KnowledgeArticle";
import { requireSession } from "@/lib/auth";
import { Role } from "@/types";

export async function GET(request: NextRequest) {
  try {
    await requireSession();
    await initializeDatabase();

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId") || undefined;
    const q = searchParams.get("q") || undefined;

    const repo = getRepository(KnowledgeArticle);
    const qb = repo
      .createQueryBuilder("article")
      .leftJoinAndSelect("article.category", "category")
      .orderBy("article.updatedAt", "DESC");

    if (categoryId) {
      qb.andWhere("article.categoryId = :categoryId", { categoryId });
    }

    if (q) {
      qb.andWhere(
        "(article.title LIKE :q OR article.content LIKE :q OR article.tags LIKE :q)",
        { q: `%${q}%` }
      );
    }

    const articles = await qb.getMany();
    return NextResponse.json({ articles });
  } catch {
    return NextResponse.json({ error: "Não foi possível carregar a base de conhecimento." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession([Role.ADMIN, Role.TECNICO]);
    await initializeDatabase();

    const contentType = request.headers.get("content-type") || "";
    const isMultipart = contentType.includes("multipart/form-data");

    let title = "";
    let content = "";
    let tags = "";
    let categoryId: string | undefined;
    let attachmentName: string | undefined;
    let attachmentUrl: string | undefined;
    let file: File | null = null;
    let formData: FormData | null = null;
    let isQuickReply = false;

    if (isMultipart) {
      formData = await request.formData();
      title = String(formData.get("title") ?? "").trim();
      content = String(formData.get("content") ?? "").trim();
      tags = String(formData.get("tags") ?? "").trim();
      categoryId = formData.get("categoryId") ? String(formData.get("categoryId")) : undefined;
      attachmentName = formData.get("attachmentName") ? String(formData.get("attachmentName")).trim() : undefined;
      attachmentUrl = formData.get("attachmentUrl") ? String(formData.get("attachmentUrl")).trim() : undefined;
      isQuickReply = formData.get("isQuickReply") === "true";
      const attachment = formData.get("attachment");
      if (attachment instanceof File && attachment.size > 0) {
        file = attachment;
      }
    } else {
      const body = await request.json();
      title = String(body.title ?? "").trim();
      content = String(body.content ?? "").trim();
      tags = String(body.tags ?? "").trim();
      categoryId = body.categoryId ? String(body.categoryId) : undefined;
      attachmentName = body.attachmentName ? String(body.attachmentName).trim() : undefined;
      attachmentUrl = body.attachmentUrl ? String(body.attachmentUrl).trim() : undefined;
      isQuickReply = Boolean(body.isQuickReply);
    }

    if (!title || !content) {
      return NextResponse.json({ error: "Título e conteúdo são obrigatórios." }, { status: 400 });
    }

    let finalAttachmentName = attachmentName || file?.name || undefined;
    let finalAttachmentUrl = attachmentUrl;

    if (file) {
      const uploadDirectory = path.join(process.cwd(), "public", "uploads", "knowledge");
      await mkdir(uploadDirectory, { recursive: true });

      const safeName = `${randomUUID()}-${(file.name || "arquivo").replace(/[^a-zA-Z0-9._-]/g, "-")}`;
      const filePath = path.join(uploadDirectory, safeName);
      await writeFile(filePath, Buffer.from(await file.arrayBuffer()));
      finalAttachmentName = finalAttachmentName || file.name;
      finalAttachmentUrl = `/uploads/knowledge/${safeName}`;
    }

    const article = getRepository(KnowledgeArticle).create({
      title,
      content,
      tags,
      categoryId,
      attachmentName: finalAttachmentName || undefined,
      attachmentUrl: finalAttachmentUrl || undefined,
      isQuickReply,
    });

    await getRepository(KnowledgeArticle).save(article);

    return NextResponse.json({ success: true, article });
  } catch {
    return NextResponse.json({ error: "Não foi possível salvar o artigo." }, { status: 500 });
  }
}
