import "reflect-metadata";

import { NextRequest, NextResponse } from "next/server";
import { randomBytes, createHash, randomUUID } from "node:crypto";

import { initializeDatabase, getRepository } from "@/lib/database";
import { User } from "@/entities/User";
import { PasswordResetToken } from "@/entities/PasswordResetToken";
import { sendPasswordResetEmail } from "@/lib/email";
import { IsNull } from "typeorm";
export const runtime = "nodejs";

const TOKEN_EXPIRATION_MINUTES = 30;

const GENERIC_RESPONSE = {
  ok: true,
  message:
    "Se o e-mail estiver cadastrado, você receberá as instruções para redefinir sua senha.",
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email || email.length > 191) {
      return NextResponse.json(
        { error: "Informe um endereço de e-mail válido." },
        { status: 400 }
      );
    }

    await initializeDatabase();

    const userRepository = getRepository(User);
    const tokenRepository = getRepository(PasswordResetToken);

    const user = await userRepository.findOne({
      where: {
        email,
        isActive: true,
      },
    });

    // Não revela se o e-mail existe no sistema.
    if (!user) {
      return NextResponse.json(GENERIC_RESPONSE);
    }

    // Remove tokens anteriores ainda não utilizados.
        await tokenRepository.delete({
        userId: user.id,
        usedAt: IsNull(),
        });

    // Gera um token aleatório de 256 bits.
    const rawToken = randomBytes(32).toString("hex");

    // Apenas o hash do token é armazenado no banco.
    const tokenHash = createHash("sha256")
      .update(rawToken)
      .digest("hex");

    const expiresAt = new Date(
      Date.now() + TOKEN_EXPIRATION_MINUTES * 60 * 1000
    );

    const resetToken = tokenRepository.create({
      id: randomUUID(),
      userId: user.id,
      tokenHash,
      expiresAt,
      usedAt: null,
    });

    await tokenRepository.save(resetToken);

    const appUrl = process.env.APP_URL;

    if (!appUrl) {
      throw new Error("APP_URL não foi configurada.");
    }

    const resetUrl = new URL("/reset-password", appUrl);
    resetUrl.searchParams.set("token", rawToken);

    try {
      await sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        resetUrl: resetUrl.toString(),
      });
    } catch (error) {

      await tokenRepository.delete({
        id: resetToken.id,
      });

      throw error;
    }

    return NextResponse.json(GENERIC_RESPONSE);
  } catch (error) {
    console.error("Erro ao solicitar recuperação de senha:", error);

    return NextResponse.json(
      { error: "Não foi possível processar sua solicitação. Tente novamente." },
      { status: 500 }
    );
  }
}