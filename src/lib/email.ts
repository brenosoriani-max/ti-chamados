import nodemailer from "nodemailer";

const gmailUser = process.env.GMAIL_USER?.trim();
const gmailAppPassword = process.env.GMAIL_APP_PASSWORD?.trim();

export const isEmailConfigured = Boolean(gmailUser && gmailAppPassword);

export const emailTransporter = isEmailConfigured
  ? nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailUser,
        pass: gmailAppPassword,
      },
    })
  : null;

type SendPasswordResetEmailParams = {
  to: string;
  name: string;
  resetUrl: string;
};

async function sendEmailIfConfigured({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text: string;
  html: string;
}) {
  if (!emailTransporter || !to) {
    return;
  }

  try {
    await emailTransporter.sendMail({
      from: {
        name: "Helpdesk Contec",
        address: gmailUser!,
      },
      to,
      subject,
      text,
      html,
    });
  } catch (error) {
    console.error("Falha ao enviar e-mail:", error);
  }
}

export async function sendPasswordResetEmail({
  to,
  name,
  resetUrl,
}: SendPasswordResetEmailParams) {
  await sendEmailIfConfigured({
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

type SendTicketAssignmentEmailParams = {
  to: string;
  customerName: string;
  ticketNumber: string;
  ticketTitle: string;
  technicianName: string;
  ticketUrl: string;
};

export async function sendTicketAssignmentEmail({
  to,
  customerName,
  ticketNumber,
  ticketTitle,
  technicianName,
  ticketUrl,
}: SendTicketAssignmentEmailParams) {
  await sendEmailIfConfigured({
    to,
    subject: `Atendimento do chamado ${ticketNumber} foi atribuído`,
    text: [
      `Olá, ${customerName}!`,
      "",
      `O atendimento do chamado ${ticketNumber} foi atribuído para ${technicianName}.`,
      `Título: ${ticketTitle}`,
      `Acompanhe o progresso no link: ${ticketUrl}`,
      "",
      "Em breve o suporte entrará em contato com você.",
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px; color: #1f2937;">
        <h2 style="margin-bottom: 8px;">Chamado em atendimento</h2>
        <p>Olá, <strong>${escapeHtml(customerName)}</strong>!</p>
        <p>O atendimento do chamado <strong>${escapeHtml(ticketNumber)}</strong> foi atribuído para <strong>${escapeHtml(technicianName)}</strong>.</p>
        <p><strong>Título:</strong> ${escapeHtml(ticketTitle)}</p>
        <p style="margin: 24px 0;">
          <a href="${ticketUrl}" style="background: #2563eb; color: white; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: bold;">
            Acompanhar chamado
          </a>
        </p>
        <p>Em breve o suporte entrará em contato com você para continuar o atendimento.</p>
        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 28px 0;" />
        <small style="color: #6b7280;">Helpdesk Contec — Suporte e atendimento</small>
      </div>
    `,
  });
}

type SendTicketResolutionEmailParams = {
  to: string;
  customerName: string;
  ticketNumber: string;
  ticketTitle: string;
  technicianName: string;
  resolution: string;
  ticketUrl: string;
};

export async function sendTicketResolutionEmail({
  to,
  customerName,
  ticketNumber,
  ticketTitle,
  technicianName,
  resolution,
  ticketUrl,
}: SendTicketResolutionEmailParams) {
  await sendEmailIfConfigured({
    to,
    subject: `Atendimento do chamado ${ticketNumber} foi finalizado`,
    text: [
      `Olá, ${customerName}!`,
      "",
      `O atendimento do chamado ${ticketNumber} foi finalizado pelo técnico ${technicianName}.`,
      `Título: ${ticketTitle}`,
      "",
      "Resumo da solução:",
      resolution,
      "",
      `Acompanhe os detalhes do chamado aqui: ${ticketUrl}`,
      "",
      "Caso o problema persista, responda este e-mail ou abra um novo chamado.",
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px; color: #1f2937;">
        <h2 style="margin-bottom: 8px;">Atendimento finalizado</h2>
        <p>Olá, <strong>${escapeHtml(customerName)}</strong>!</p>
        <p>O atendimento do chamado <strong>${escapeHtml(ticketNumber)}</strong> foi finalizado pelo técnico <strong>${escapeHtml(technicianName)}</strong>.</p>
        <p><strong>Título:</strong> ${escapeHtml(ticketTitle)}</p>
        <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <strong>Resumo da solução:</strong>
          <p style="margin: 8px 0 0; white-space: pre-line;">${escapeHtml(resolution)}</p>
        </div>
        <p style="margin: 24px 0;">
          <a href="${ticketUrl}" style="background: #0f766e; color: white; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: bold;">
            Ver detalhes do chamado
          </a>
        </p>
        <p>Caso o problema persista, responda este e-mail ou abra um novo chamado.</p>
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