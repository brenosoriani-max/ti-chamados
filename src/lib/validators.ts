import { z } from "zod";
import { Priority, TicketStatus, TerminalStatus, Role } from "@/types";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export const registerSchema = z.object({
  name: z.string().min(3).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(100),
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
  conclusion: z.string().min(10).max(2000).optional(),
  transferReason: z.string().min(3).max(255).optional(),
  transferToUserId: z.string().min(1).optional(),
  tags: z.array(z.string().min(1).max(32)).optional()
});

export const ticketFinishSchema = z.object({
  conclusion: z.string().min(10).max(2000),
  status: z.nativeEnum(TicketStatus).default(TicketStatus.RESOLVIDO),
});

export const ticketTransferSchema = z.object({
  transferToUserId: z.string().min(1),
  transferReason: z.string().min(3).max(255),
});

export const messageCreateSchema = z.object({
  body: z.string().default(""),
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

export const terminalCreateSchema = z.object({
  nome: z.string().min(1).max(120),
  descricao: z.string().max(1000).optional().nullable(),
  identificador: z.string().min(3).max(160),
  token: z.string().min(16).optional(),
  empresaId: z.string().optional().nullable(),
  status: z.nativeEnum(TerminalStatus).optional(),
  ultimaConexao: z.coerce.date().optional().nullable(),
  sistemaOperacional: z.string().max(120).optional().nullable(),
  ip: z.string().max(80).optional().nullable(),
  versaoAgente: z.string().max(40).optional().nullable()
});

export const terminalUpdateSchema = terminalCreateSchema.partial();

export const remoteStartSchema = z.object({
  terminalId: z.string().min(1),
  monitorIndex: z.number().int().min(0).default(0),
});

export const remoteEndSchema = z.object({
  sessaoId: z.string().min(1)
});

export const userCreateSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.nativeEnum(Role)
});
