"use client";

import { useState } from "react";
import { BookOpenText, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";

type Article = {
  id: string;
  title: string;
  content: string;
  tags?: string | null;
  category?: { name: string } | null;
};

export function RelatedKnowledge({ articles }: { articles: Article[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (articles.length === 0) return null;

  return (
    <div className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <BookOpenText className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-black">Problemas conhecidos</h3>
            <p className="text-[11px] text-muted-foreground">Artigos relacionados a este chamado</p>
          </div>
        </div>
        <Link href="/admin/conhecimento" className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline">
          Ver base
        </Link>
      </div>

      <div className="space-y-2">
        {articles.map((article) => {
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
                  {article.category && (
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      {article.category.name}
                    </p>
                  )}
                </div>
                {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </button>
              {isExpanded && (
                <p className="whitespace-pre-wrap border-t border-border/40 px-3 py-3 text-sm leading-relaxed text-muted-foreground">
                  {article.content}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
