import { Priority, TicketStatus } from "@prisma/client";
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export const ticketCreateSchema = z.object({
  title: z.string().min(5).max(140),
  description: z.string().min(10),
  categoryId: z.string().min(1),
  subCategoryId: z.string().optional().nullable(),
  priority: z.nativeEnum(Priority).default(Priority.MEDIA),
  tags: z.array(z.string().min(1).max(32)).default([])
});

export const ticketUpdateSchema = z.object({
  title: z.string().min(5).max(140).optional(),
  description: z.string().min(10).optional(),
  status: z.nativeEnum(TicketStatus).optional(),
  priority: z.nativeEnum(Priority).optional(),
  assigneeId: z.string().nullable().optional(),
  tags: z.array(z.string().min(1).max(32)).optional()
});

export const messageCreateSchema = z.object({
  body: z.string().min(1),
  isInternal: z.boolean().default(false)
});

export const ratingSchema = z.object({
  score: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional()
});

export const userCreateSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["CLIENTE", "TECNICO", "ADMIN"])
});
