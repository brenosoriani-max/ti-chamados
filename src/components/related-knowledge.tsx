"use client";

import { useMemo, useState } from "react";
import { BookOpenText, ChevronDown, ChevronUp, Copy, FileText, Search, Sparkles } from "lucide-react";
import Link from "next/link";

type Article = {
  id: string;
  title: string;
  content: string;
  tags?: string | null;
  category?: { name: string } | null;
  attachmentName?: string | null;
  attachmentUrl?: string | null;
  isQuickReply?: boolean;
};

export function RelatedKnowledge({ articles, compact = false }: { articles: Article[]; compact?: boolean }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  if (articles.length === 0) return null;

  const filteredArticles = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return articles;

    return articles.filter((article) => {
      const haystack = `${article.title} ${article.content} ${article.tags ?? ""} ${article.category?.name ?? ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [articles, query]);

  async function copyArticle(article: Article) {
    try {
      await navigator.clipboard.writeText(article.content);
      setCopiedId(article.id);
      window.setTimeout(() => setCopiedId((current) => (current === article.id ? null : current)), 1400);
    } catch {
      setCopiedId(null);
    }
  }

  function useArticle(article: Article) {
    if (typeof window === "undefined") return;

    window.dispatchEvent(
      new CustomEvent("ti:insert-knowledge", {
        detail: {
          title: article.title,
          content: article.content,
          isQuickReply: Boolean(article.isQuickReply),
        },
      })
    );
  }

  return (
    <div className={`rounded-3xl border border-border/60 bg-card shadow-sm ${compact ? "p-4" : "p-5"} space-y-3`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <BookOpenText className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-black">Respostas rápidas</h3>
            <p className="text-[11px] text-muted-foreground">
              {compact ? "Soluções sugeridas" : "Artigos relacionados a este chamado"}
            </p>
          </div>
        </div>
        <Link href="/admin/conhecimento" className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline">
          Ver base
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar resposta rápida..."
          className="h-9 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-xs outline-none focus:border-primary transition-colors"
        />
      </div>

      <div className="space-y-2">
        {filteredArticles.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-4 text-center text-[11px] text-muted-foreground">
            Nenhuma resposta encontrada para esta busca.
          </div>
        ) : (
          filteredArticles.map((article) => {
            const isExpanded = expandedId === article.id;
            return (
              <div key={article.id} className="rounded-2xl border border-border/60 bg-muted/20">
                <button
                  type="button"
                  className="flex w-full items-start justify-between gap-3 p-3 text-left"
                  onClick={() => setExpandedId(isExpanded ? null : article.id)}
                >
                  <div>
                    <p className="text-sm font-semibold">{article.title}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      {article.category && (
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          {article.category.name}
                        </p>
                      )}
                      {article.isQuickReply && (
                        <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-emerald-600">
                          Automática
                        </span>
                      )}
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </button>
                {isExpanded && (
                  <div className="space-y-3 border-t border-border/40 px-3 py-3">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                      {article.content}
                    </p>

                    {article.attachmentUrl && (
                      <a
                        href={article.attachmentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-primary"
                      >
                        <FileText className="h-3 w-3" />
                        {article.attachmentName || "Abrir documento"}
                      </a>
                    )}

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => useArticle(article)}
                        className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em]"
                      >
                        <Sparkles className="h-3 w-3" />
                        Usar resposta
                      </button>
                      <button
                        type="button"
                        onClick={() => void copyArticle(article)}
                        className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-foreground"
                      >
                        <Copy className="h-3 w-3" />
                        {copiedId === article.id ? "Copiado" : "Copiar"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
