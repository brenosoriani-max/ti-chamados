
import "reflect-metadata";

import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { IsNull, MoreThan } from "typeorm";
import bcrypt from "bcryptjs";

import { initializeDatabase, getRepository } from "@/lib/database";
import { User } from "@/entities/User";
import { PasswordResetToken } from "@/entities/PasswordResetToken";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const token =
      typeof body.token === "string" ? body.token.trim() : "";

    const password =
      typeof body.password === "string" ? body.password : "";

    const confirmPassword =
      typeof body.confirmPassword === "string"
        ? body.confirmPassword
        : "";

    if (!token || !password || !confirmPassword) {
      return NextResponse.json(
        { error: "Preencha todos os campos." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "A senha deve ter pelo menos 8 caracteres." },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "As senhas não coincidem." },
        { status: 400 }
      );
    }

    await initializeDatabase();

    const tokenHash = createHash("sha256")
      .update(token)
      .digest("hex");

    const tokenRepository = getRepository(PasswordResetToken);
    const userRepository = getRepository(User);

    const resetToken = await tokenRepository.findOne({
      where: {
        tokenHash,
        usedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
    });

    if (!resetToken) {
      return NextResponse.json(
        {
          error: "Este link é inválido, expirou ou já foi utilizado. Solicite uma nova recuperação.",
        },
        { status: 400 }
      );
    }

    const user = await userRepository.findOne({
      where: {
        id: resetToken.userId,
        isActive: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado ou inativo." },
        { status: 400 }
      );
    }

    user.passwordHash = await bcrypt.hash(password, 12);

    await userRepository.save(user);

    // Invalida todos os tokens de recuperação pendentes deste usuário.
    await tokenRepository.update(
      {
        userId: user.id,
        usedAt: IsNull(),
      },
      {
        usedAt: new Date(),
      }
    );

    return NextResponse.json({
      ok: true,
      message: "Senha redefinida com sucesso.",
    });
  } catch (error) {
    console.error("Erro ao redefinir senha:", error);

    return NextResponse.json(
      { error: "Não foi possível redefinir sua senha. Tente novamente." },
      { status: 500 }
    );
  }
}
