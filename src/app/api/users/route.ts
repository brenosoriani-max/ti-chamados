import "reflect-metadata";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Role } from "@/types";
import { initializeDatabase, getRepository } from "@/lib/database";
import { User } from "@/entities/User";
import { requireSession } from "@/lib/auth";
import { userCreateSchema } from "@/lib/validators";
import { messages } from "@/lib/messages";

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
  } catch {
    return NextResponse.json({ error: messages.users.listError }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireSession([Role.ADMIN]);
    await initializeDatabase();

    const body = await request.json();
    const parsed = userCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: messages.users.invalidData, details: parsed.error.flatten() },
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
  } catch {
    return NextResponse.json({ error: messages.users.createError }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireSession([Role.ADMIN]);
    await initializeDatabase();
    const userRepository = getRepository(User);
    const { searchParams } = new URL(request.url);

    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: messages.users.idRequired }, { status: 400 });
    }
    const user = await userRepository.findOne({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: messages.users.notFound }, { status: 404 });
    }

    await userRepository.remove(user);
    return NextResponse.json({ message: "Usuário removido com sucesso." });
  } catch (error: any) {
    if (error.code === "ERR_ROW_IS_REFERENCED_2") {
      return NextResponse.json({ error: messages.users.deleteLinked }, { status: 400 });
    }
    return NextResponse.json({ error: messages.users.deleteError }, { status: 500 });
  }
}
