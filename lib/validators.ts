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

export const equipmentCreateSchema = z.object({
  patrimony: z.string().min(1),
  machineName: z.string().min(1),
  hostname: z.string().min(1),
  ipAddress: z.string().min(1),
  currentUser: z.string().optional(),
  operatingSystem: z.string().min(1),
  windowsVersion: z.string().optional(),
  processor: z.string().optional(),
  ramGb: z.number().int().positive().optional(),
  diskSpaceGb: z.number().int().positive().optional(),
  departmentId: z.string().optional(),
  responsibleUserId: z.string().optional(),
  isOnline: z.boolean().default(false),
  status: z.string().optional()
});

export const equipmentUpdateSchema = equipmentCreateSchema.partial();

export const remoteSessionCreateSchema = z.object({
  equipmentId: z.string().min(1),
  host: z.string().min(1),
  ip: z.string().min(1),
  sessionId: z.number().int().nonnegative(),
  mode: z.enum(["shadow", "view", "control"]).default("shadow"),
  connectionType: z.string().min(1).default("shadow"),
  reason: z.string().max(500).optional()
});

export const userCreateSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["CLIENTE", "TECNICO", "ADMIN"])
});
