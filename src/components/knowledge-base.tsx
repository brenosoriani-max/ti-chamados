"use client";

import { useState, useTransition, useMemo } from "react";
import {
  Search,
  BookOpenText,
  Plus,
  ChevronRight,
  X,
  Pencil,
  Trash2,
  Save,
  CheckCircle2,
  Tag,
  FolderOpen,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Article = {
  id: string;
  title: string;
  content: string;
  tags?: string | null;
  categoryId?: string | null;
  category?: { name: string } | null;
};

type Category = { id: string; name: string };

interface KnowledgeBaseProps {
  articles: Article[];
  categories?: Category[];
  canEdit?: boolean;
}

function ArticleModal({
  article,
  categories,
  onClose,
  onSave,
}: {
  article: Partial<Article> | null;
  categories: Category[];
  onClose: () => void;
  onSave: (data: Partial<Article>) => Promise<void>;
}) {
  const [title, setTitle] = useState(article?.title ?? "");
  const [content, setContent] = useState(article?.content ?? "");
  const [tags, setTags] = useState(article?.tags ?? "");
  const [categoryId, setCategoryId] = useState(article?.categoryId ?? "");
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    if (!title.trim() || !content.trim()) {
      toast.error("Título e conteúdo são obrigatórios.");
      return;
    }
    startTransition(async () => {
      await onSave({ title: title.trim(), content: content.trim(), tags: tags.trim(), categoryId: categoryId || null });
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-3xl border border-border bg-card shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 pb-4 border-b border-border/60">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
              {article?.id ? "Editar artigo" : "Novo artigo"}
            </p>
            <h3 className="mt-1 text-xl font-black">Base de Conhecimento</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border p-2 hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Título *
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Como redefinir senha do Active Directory"
              className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Conteúdo / Solução *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              placeholder="Descreva o passo a passo, causa raiz e solução..."
              className="w-full resize-none rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-primary transition-colors"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                Categoria
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary transition-colors"
              >
                <option value="">Sem categoria</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                Tags (separadas por vírgula)
              </label>
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Ex.: senha, ad, reset"
                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 p-6 pt-4 border-t border-border/60">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isPending} className="gap-2">
            {isPending ? (
              <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {article?.id ? "Salvar alterações" : "Criar artigo"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirmModal({
  title,
  onClose,
  onConfirm,
}: {
  title: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center text-destructive">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
              Remover artigo
            </p>
            <h4 className="font-black text-foreground">Confirmar exclusão</h4>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Deseja remover permanentemente o artigo <strong>&ldquo;{title}&rdquo;</strong>? Esta ação não pode ser desfeita.
        </p>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Remover
          </Button>
        </div>
      </div>
    </div>
  );
}

export function KnowledgeBase({ articles: initialArticles, categories = [], canEdit = false }: KnowledgeBaseProps) {
  const [articles, setArticles] = useState<Article[]>(initialArticles);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingArticle, setEditingArticle] = useState<Partial<Article> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Article | null>(null);

  const filtered = useMemo(() => {
    return articles.filter((article) => {
      const haystack = `${article.title} ${article.content} ${article.tags ?? ""} ${article.category?.name ?? ""}`.toLowerCase();
      const matchesQuery = !query || haystack.includes(query.toLowerCase());
      const matchesCategory = !categoryFilter || article.categoryId === categoryFilter;
      return matchesQuery && matchesCategory;
    });
  }, [articles, query, categoryFilter]);

  function openCreate() {
    setEditingArticle({});
    setIsModalOpen(true);
  }

  function openEdit(article: Article) {
    setEditingArticle(article);
    setIsModalOpen(true);
  }

  async function handleSave(data: Partial<Article>) {
    try {
      const isEdit = Boolean(editingArticle?.id);
      const url = isEdit ? `/api/knowledge/${editingArticle!.id}` : "/api/knowledge";
      const method = isEdit ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const json = await response.json().catch(() => ({}));
        throw new Error(json.error ?? "Erro ao salvar.");
      }

      const { article: saved } = await response.json();
      // Find category name from categories list
      const cat = categories.find((c) => c.id === saved.categoryId);
      const enriched: Article = { ...saved, category: cat ? { name: cat.name } : null };

      if (isEdit) {
        setArticles((prev) => prev.map((a) => (a.id === enriched.id ? enriched : a)));
        toast.success("Artigo atualizado com sucesso.");
      } else {
        setArticles((prev) => [enriched, ...prev]);
        toast.success("Artigo criado com sucesso.");
      }

      setIsModalOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar o artigo.");
      throw error;
    }
  }

  async function handleDelete(article: Article) {
    try {
      const response = await fetch(`/api/knowledge/${article.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error();
      setArticles((prev) => prev.filter((a) => a.id !== article.id));
      setDeleteTarget(null);
      toast.success("Artigo removido com sucesso.");
    } catch {
      toast.error("Não foi possível remover o artigo.");
    }
  }

  return (
    <div className="space-y-4 rounded-3xl border border-border/60 bg-card p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <BookOpenText className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-black uppercase tracking-[0.18em] text-foreground">
            Base de conhecimento
          </h3>
          <span className="h-5 min-w-[1.25rem] rounded-full bg-muted/70 border border-border/50 px-1.5 text-[10px] font-bold text-muted-foreground flex items-center justify-center">
            {articles.length}
          </span>
        </div>
        {canEdit && (
          <Button variant="outline" size="sm" className="gap-2 rounded-xl" onClick={openCreate}>
            <Plus className="h-3.5 w-3.5" />
            Novo artigo
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por título, conteúdo ou tag..."
            className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary transition-colors"
          />
        </div>
        {categories.length > 0 && (
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-10 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary transition-colors min-w-[160px]"
          >
            <option value="">Todas as categorias</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Article list */}
      <div className="space-y-2.5">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center">
            <BookOpenText className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm font-semibold text-muted-foreground">
              {query || categoryFilter ? "Nenhum artigo encontrado para este filtro." : "Nenhum artigo cadastrado ainda."}
            </p>
            {canEdit && !query && !categoryFilter && (
              <Button variant="outline" size="sm" className="mt-4 gap-2 rounded-xl" onClick={openCreate}>
                <Plus className="h-3.5 w-3.5" />
                Criar primeiro artigo
              </Button>
            )}
          </div>
        ) : (
          filtered.map((article) => {
            const isExpanded = expandedId === article.id;
            const tagList = article.tags
              ? article.tags.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 5)
              : [];

            return (
              <div
                key={article.id}
                className="rounded-2xl border border-border/60 bg-muted/20 transition-all hover:border-border hover:bg-muted/30"
              >
                {/* Article header */}
                <div className="flex items-start justify-between gap-3 p-4">
                  <button
                    type="button"
                    className="flex-1 text-left"
                    onClick={() => setExpandedId(isExpanded ? null : article.id)}
                  >
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5 flex-1">
                        <p className="text-sm font-bold text-foreground leading-snug">{article.title}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          {article.category && (
                            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.16em] text-primary/70">
                              <FolderOpen className="h-2.5 w-2.5" />
                              {article.category.name}
                            </span>
                          )}
                          {tagList.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {tagList.map((tag) => (
                                <span
                                  key={tag}
                                  className="flex items-center gap-1 rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-primary"
                                >
                                  <Tag className="h-2 w-2" />
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      )}
                    </div>
                  </button>

                  {canEdit && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEdit(article)}
                        className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                        title="Editar artigo"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(article)}
                        className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                        title="Remover artigo"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="border-t border-border/40 px-4 py-4">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                      {article.content}
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-600">
                        Solução verificada
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modals */}
      {isModalOpen && (
        <ArticleModal
          article={editingArticle}
          categories={categories}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          title={deleteTarget.title}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => handleDelete(deleteTarget)}
        />
      )}
    </div>
  );
}
