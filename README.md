# TI Chamados

Sistema de help desk/service desk em Next.js 15, TypeScript, TailwindCSS, componentes no estilo Shadcn/UI, API Routes, Prisma e PostgreSQL.

## Rodando localmente

1. Instale as dependencias:

```bash
npm install
```

2. Configure o banco:

```bash
cp .env.example .env
```

Edite `DATABASE_URL` e `JWT_SECRET`.

3. Aplique migrations e dados iniciais:

```bash
npm run db:deploy
npm run db:seed
```

4. Inicie a aplicacao:

```bash
npm run dev
```

## Acessos de seed

- `admin@empresa.com` / `123456`
- `tecnico@empresa.com` / `123456`
- `cliente@empresa.com` / `123456`

## Modulos implementados

- Autenticacao JWT via cookie HTTP-only.
- Roles `CLIENTE`, `TECNICO` e `ADMIN`.
- Chamados com status, prioridade, categoria, tags, SLA, responsavel, mensagens, anexos, historico e avaliacao.
- APIs com Zod, paginacao, busca e validacao de permissao.
- Dashboard do cliente, fila Kanban de suporte e painel administrativo.
- Prisma schema completo e migration inicial para PostgreSQL.
