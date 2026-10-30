import nodemailer from "nodemailer";

const gmailUser = process.env.GMAIL_USER;
const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

if (!gmailUser || !gmailAppPassword) {
  throw new Error("As variáveis GMAIL_USER e GMAIL_APP_PASSWORD não foram configuradas.");
}

export const emailTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: gmailUser,
    pass: gmailAppPassword,
  },
});

type SendPasswordResetEmailParams = {
  to: string;
  name: string;
  resetUrl: string;
};

export async function sendPasswordResetEmail({
  to,
  name,
  resetUrl,
}: SendPasswordResetEmailParams) {
  await emailTransporter.sendMail({
    from: {
      name: "Helpdesk Contec",
      address: gmailUser!,
    },
    to,
    subject: "Recuperação de senha - Helpdesk Contec",
    text: [
      `Olá, ${name}!`,
      "",
      "Recebemos uma solicitação para redefinir sua senha.",
      `Acesse o link abaixo para cadastrar uma nova senha: ${resetUrl}`,
      "",
      "Este link expira em 30 minutos e só pode ser utilizado uma vez.",
      "Se você não solicitou a recuperação, ignore este e-mail.",
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px; color: #1f2937;">
        <h2 style="margin-bottom: 8px;">Recuperação de senha</h2>
        <p>Olá, <strong>${escapeHtml(name)}</strong>!</p>
        <p>Recebemos uma solicitação para redefinir a senha da sua conta no Helpdesk Contec.</p>
        <p style="margin: 32px 0;">
          <a
            href="${resetUrl}"
            style="background: #0f766e; color: white; padding: 14px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;"
          >
            Redefinir minha senha
          </a>
        </p>
        <p>Este link expira em <strong>30 minutos</strong> e só pode ser utilizado uma vez.</p>
        <p>Se você não solicitou a recuperação, ignore este e-mail. Sua senha permanecerá inalterada.</p>
        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 28px 0;" />
        <small style="color: #6b7280;">Helpdesk Contec — Suporte e atendimento</small>
      </div>
    `,
  });
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };

    return entities[character];
  });
}