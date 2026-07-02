import "reflect-metadata";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Role } from "@/types";
import { initializeDatabase, getRepository } from "@/lib/database";
import { User } from "@/entities/User";
import { requireSession } from "@/lib/auth";
import { userCreateSchema } from "@/lib/validators";

/**
 * GET /api/users
 * List all users (ADMIN only)
 */
export async function GET() {
  try {
    await requireSession([Role.ADMIN]);
    await initializeDatabase();

    const userRepository = getRepository(User);
    const users = await userRepository
      .createQueryBuilder("user")
      .select([
        "user.id",
        "user.name",
        "user.email",
        "user.role",
        "user.isActive",
        "user.createdAt",
      ])
      .orderBy("user.name", "ASC")
      .getMany();

    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao listar usuários" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users
 * Create a new user (ADMIN only)
 */
export async function POST(request: NextRequest) {
  try {
    await requireSession([Role.ADMIN]);
    await initializeDatabase();

    const body = await request.json();
    const parsed = userCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid user data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 10);
    const userRepository = getRepository(User);
    const user = userRepository.create({
      name: parsed.data.name,
      email: parsed.data.email,
      role: parsed.data.role,
      passwordHash,
    });
    
    await userRepository.save(user);

    return NextResponse.json(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao criar usuário" },
      { status: 500 }
    );
  }
}
