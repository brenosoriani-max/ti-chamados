import { KnowledgeArticle } from "@/entities/KnowledgeArticle";
import { getRepository } from "@/lib/database";

export type KnowledgeMatch = {
  id: string;
  title: string;
  content: string;
  tags?: string | null;
  categoryId?: string | null;
  attachmentName?: string | null;
  attachmentUrl?: string | null;
  isQuickReply?: boolean;
  category?: { name: string } | null;
  score: number;
};

function tokenize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 3);
}

export function scoreKnowledgeArticle(
  article: KnowledgeArticle,
  query: { title?: string; description?: string; categoryId?: string | null }
) {
  const haystack = tokenize(`${article.title} ${article.content} ${article.tags ?? ""}`);
  const needles = tokenize(`${query.title ?? ""} ${query.description ?? ""}`);
  const uniqueNeedles = Array.from(new Set(needles));
  let score = uniqueNeedles.reduce((total, token) => total + (haystack.includes(token) ? 2 : 0), 0);

  if (query.categoryId && article.categoryId === query.categoryId) {
    score += 6;
  }

  return score;
}

export async function findRelatedKnowledgeArticles(query: {
  title?: string;
  description?: string;
  categoryId?: string | null;
  limit?: number;
}): Promise<KnowledgeMatch[]> {
  const articles = await getRepository(KnowledgeArticle).find({
    relations: ["category"],
    order: { updatedAt: "DESC" },
  });

  return articles
    .map((article) => ({
      id: article.id,
      title: article.title,
      content: article.content,
      tags: article.tags ?? null,
      categoryId: article.categoryId ?? null,
      attachmentName: article.attachmentName ?? null,
      attachmentUrl: article.attachmentUrl ?? null,
      isQuickReply: Boolean(article.isQuickReply),
      category: article.category ? { name: article.category.name } : null,
      score: scoreKnowledgeArticle(article, query),
    }))
    .filter((article) => article.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, query.limit ?? 5);
}
