import { html } from 'code-tag';

import sendEmail from '../config/mail/nodemailer.js';
import template from './template.js';

export function confirmEmail({ user, token, temporaryPassword }) {
  const emailConfirmationLink = `${
    process.env.FRONTEND_URL
  }/email-confirmation/${encodeURIComponent(token)}`;

  const loginLink = `${process.env.FRONTEND_URL}/login`;
  const forgotPasswordLink = `${process.env.FRONTEND_URL}/forgot-password`;

  const temporaryPasswordBlock = temporaryPassword
    ? html`
        <div
          style="
            margin: 16px 0;
            padding: 14px;
            border: 1px solid #dbeafe;
            border-radius: 8px;
            background: #f8fbff;
          "
        >
          <p style="margin: 0 0 8px 0; color: #1e3a8a; font-weight: 700;">
            Senha temporária de acesso
          </p>
          <p
            style="
              margin: 0;
              font-size: 20px;
              font-weight: 700;
              letter-spacing: 1px;
              font-family: 'Courier New', Courier, monospace;
              color: #0f172a;
            "
          >
            ${temporaryPassword}
          </p>
        </div>
      `
    : '';

  const body = html`
    <div
      style="
        max-width: 560px;
        margin: 0 auto;
        padding: 20px;
        color: #0f172a;
        line-height: 1.5;
      "
    >
      <h1 style="margin: 0 0 14px 0; color: #0f172a;">
        Sua conta foi criada no SGLA
      </h1>

      <p>Olá, ${user.name}!</p>
      <p>
        Uma conta foi criada para você no Sistema de Ligas Acadêmicas (SGLA).
      </p>

      ${temporaryPasswordBlock}

      <div style="margin: 18px 0;">
        <a
          href="${emailConfirmationLink}"
          style="
            display: inline-block;
            padding: 12px 18px;
            background: #1d4ed8;
            color: #ffffff;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 700;
          "
        >
          Confirmar e-mail
        </a>
      </div>

      <p style="margin-bottom: 8px;"><strong>Primeiro acesso:</strong></p>
      <ol style="margin: 0 0 16px 18px; padding: 0;">
        <li style="margin-bottom: 6px;">
          Confirme seu e-mail pelo botão acima.
        </li>
        <li style="margin-bottom: 6px;">
          Entre no sistema em <a href="${loginLink}">Login</a> com seu e-mail e
          senha temporária.
        </li>
        <li>
          Troque sua senha em
          <a href="${forgotPasswordLink}">Recuperar senha</a>.
        </li>
      </ol>

      <p style="color: #475569; font-size: 13px;">
        Caso você não reconheça esta solicitação, entre em contato com o gestor
        responsável.
      </p>
    </div>
  `;

  const textBodyLines = [
    `Olá, ${user.name}!`,
    'Sua conta no Sistema de Ligas Acadêmicas (SGLA) foi criada.',
    temporaryPassword ? `Senha temporária: ${temporaryPassword}` : null,
    `Confirme seu e-mail: ${emailConfirmationLink}`,
    'Primeiro acesso:',
    `1) Acesse o login: ${loginLink}`,
    '2) Entre com e-mail e senha temporária.',
    `3) Troque sua senha em: ${forgotPasswordLink}`,
  ];

  const mailOptions = {
    to: user.email,
    subject: `[SGLA] - Confirmação de email`,
    text: textBodyLines.filter(Boolean).join('\n'),
    html: template(body),
  };

  return sendEmail(mailOptions);
}

export function redefinePasswordEmail({ user, passwordToken }) {
  const resetLink = `${process.env.FRONTEND_URL}/redefinir-senha/${encodeURIComponent(passwordToken)}`;

  const body = html`
    <div
      style="
        max-width: 560px;
        margin: 0 auto;
        padding: 20px;
        color: #0f172a;
        line-height: 1.5;
      "
    >
      <h1 style="margin: 0 0 14px 0; color: #0f172a;">
        Redefinição de senha solicitada
      </h1>

      <p>Olá, ${user.name}!</p>
      <p>
        Recebemos uma solicitação para redefinir sua senha no Sistema de Ligas
        Acadêmicas (SGLA).
      </p>

      <div
        style="
          margin: 20px 0;
          padding: 16px;
          border: 2px solid #1d4ed8;
          border-radius: 8px;
          background: #eff6ff;
        "
      >
        <p style="margin: 0 0 12px 0; color: #1e3a8a; font-weight: 700;">
          ⏰ Este link expira em 1 hora
        </p>
        <a
          href="${resetLink}"
          style="
            display: inline-block;
            padding: 12px 24px;
            background: #1d4ed8;
            color: #ffffff;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 700;
            font-size: 16px;
          "
        >
          Redefinir senha
        </a>
      </div>

      <p style="margin-bottom: 8px; margin-top: 20px;">
        <strong>O que fazer agora:</strong>
      </p>
      <ol style="margin: 0 0 16px 18px; padding: 0;">
        <li style="margin-bottom: 8px;">
          Clique no botão acima ou copie o link para seu navegador.
        </li>
        <li style="margin-bottom: 8px;">
          Escolha uma nova senha segura (mínimo 6 caracteres).
        </li>
        <li>Confirme sua nova senha.</li>
      </ol>

      <div
        style="
          margin: 16px 0;
          padding: 12px;
          border-left: 4px solid #ef4444;
          background: #fef2f2;
        "
      >
        <p style="margin: 0; color: #7f1d1d; font-size: 14px;">
          <strong>⚠️ Importante:</strong> Se você não solicitou esta
          redefinição, ignore este e-mail. O link acima é único e expira em 1
          hora.
        </p>
      </div>
    </div>
  `;

  const mailOptions = {
    to: user.email,
    subject: `[SGLA] - Redefinição de senha`,
    text: [
      `Olá, ${user.name}!`,
      'Redefinição de senha solicitada no Sistema de Ligas Acadêmicas (SGLA).',
      `Link para redefinir: ${resetLink}`,
      'Este link expira em 1 hora.',
      '',
      'O que fazer:',
      '1) Clique no link acima',
      '2) Digite uma nova senha segura',
      '3) Confirme sua nova senha',
      '',
      'Se você não solicitou isso, ignore este e-mail.',
    ].join('\n'),
    html: template(body),
  };

  return sendEmail(mailOptions);
}

export function managementPasswordResetEmail({ user, temporaryPassword }) {
  const loginLink = `${process.env.FRONTEND_URL}/login`;
  const forgotPasswordLink = `${process.env.FRONTEND_URL}/forgot-password`;

  const body = html`
    <div
      style="
        max-width: 560px;
        margin: 0 auto;
        padding: 20px;
        color: #0f172a;
        line-height: 1.5;
      "
    >
      <h1 style="margin: 0 0 14px 0; color: #0f172a;">
        Sua senha foi redefinida
      </h1>

      <p>Olá, ${user.name}!</p>
      <p>
        Um gestor redefiniu seu acesso no Sistema de Ligas Acadêmicas (SGLA).
      </p>

      <div
        style="
          margin: 16px 0;
          padding: 14px;
          border: 1px solid #dbeafe;
          border-radius: 8px;
          background: #f8fbff;
        "
      >
        <p style="margin: 0 0 8px 0; color: #1e3a8a; font-weight: 700;">
          Nova senha temporária
        </p>
        <p
          style="
            margin: 0;
            font-size: 20px;
            font-weight: 700;
            letter-spacing: 1px;
            font-family: 'Courier New', Courier, monospace;
            color: #0f172a;
          "
        >
          ${temporaryPassword}
        </p>
      </div>

      <div style="margin: 18px 0;">
        <a
          href="${loginLink}"
          style="
            display: inline-block;
            padding: 12px 18px;
            background: #1d4ed8;
            color: #ffffff;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 700;
          "
        >
          Acessar sistema
        </a>
      </div>

      <p style="margin-bottom: 8px;"><strong>Próximos passos:</strong></p>
      <ol style="margin: 0 0 16px 18px; padding: 0;">
        <li style="margin-bottom: 6px;">
          Faça login com seu e-mail e a senha temporária acima.
        </li>
        <li>
          Troque sua senha em
          <a href="${forgotPasswordLink}">Recuperar senha</a>.
        </li>
      </ol>
    </div>
  `;

  const mailOptions = {
    to: user.email,
    subject: `[SGLA] - Senha redefinida pela gestão`,
    text: [
      `Olá, ${user.name}!`,
      'Seu acesso no Sistema de Ligas Acadêmicas (SGLA) foi redefinido.',
      `Nova senha temporária: ${temporaryPassword}`,
      `Acesse: ${loginLink}`,
      `Troque sua senha em: ${forgotPasswordLink}`,
    ].join('\n'),
    html: template(body),
  };

  return sendEmail(mailOptions);
}

export function taskDelegated({ assignee, task }) {
  const tasksLink = `${process.env.FRONTEND_URL}/tasks`;

  const body = html`
    <div
      style="
        max-width: 560px;
        margin: 0 auto;
        padding: 20px;
        color: #0f172a;
        line-height: 1.5;
      "
    >
      <h1 style="margin: 0 0 14px 0; color: #0f172a;">
        📋 Nova tarefa delegada
      </h1>

      <p>Olá, ${assignee.name}!</p>
      <p>Você recebeu uma nova tarefa que precisa ser concluída.</p>

      <div
        style="
          margin: 20px 0;
          padding: 16px;
          border: 2px solid #3b82f6;
          border-radius: 8px;
          background: #eff6ff;
        "
      >
        <h2 style="margin: 0 0 12px 0; color: #1e3a8a; font-size: 18px;">
          ${task.title}
        </h2>
        <p style="margin: 0 0 8px 0; color: #0f172a;">${task.description}</p>
        <p style="margin: 8px 0; color: #475569;">
          <strong>Prazo:</strong>
          ${new Date(task.dueDate).toLocaleDateString('pt-BR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
        <p style="margin: 8px 0; color: #475569;">
          <strong>Prioridade:</strong>
          ${task.priority === 'HIGH'
            ? '🔴 Alta'
            : task.priority === 'MEDIUM'
              ? '🟡 Média'
              : '🟢 Baixa'}
        </p>
      </div>

      <div style="margin: 20px 0; text-align: center;">
        <a
          href="${tasksLink}"
          style="
            display: inline-block;
            padding: 12px 24px;
            background: #3b82f6;
            color: #ffffff;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 700;
            font-size: 16px;
          "
        >
          Ver tarefa
        </a>
      </div>

      <p style="margin-top: 20px; color: #64748b; font-size: 14px;">
        Você também receberá um lembrete no seu Google Calendar no dia da
        entrega.
      </p>
    </div>
  `;

  const textBodyLines = [
    `Olá, ${assignee.name}!`,
    'Você recebeu uma nova tarefa.',
    `Título: ${task.title}`,
    `Descrição: ${task.description}`,
    `Prazo: ${new Date(task.dueDate).toLocaleDateString('pt-BR')}`,
    `Prioridade: ${task.priority}`,
    `Acesse suas tarefas em: ${tasksLink}`,
  ];

  const mailOptions = {
    to: assignee.email,
    subject: `[SGLA] - Nova tarefa delegada: ${task.title}`,
    text: textBodyLines.join('\n'),
    html: template(body),
  };

  return sendEmail(mailOptions);
}

export function taskCompleted({ assigner, assignee, task }) {
  const body = html`
    <div
      style="
        max-width: 560px;
        margin: 0 auto;
        padding: 20px;
        color: #0f172a;
        line-height: 1.5;
      "
    >
      <h1 style="margin: 0 0 14px 0; color: #0f172a;">✅ Tarefa concluída</h1>

      <p>Olá, ${assigner.name}!</p>
      <p>
        A tarefa que você delegou para ${assignee.name} foi concluída com
        sucesso.
      </p>

      <div
        style="
          margin: 20px 0;
          padding: 16px;
          border: 2px solid #10b981;
          border-radius: 8px;
          background: #f0fdf4;
        "
      >
        <h2 style="margin: 0 0 12px 0; color: #065f46; font-size: 18px;">
          ${task.title}
        </h2>
        <p style="margin: 0 0 8px 0; color: #0f172a;">${task.description}</p>
        <p style="margin: 8px 0; color: #475569;">
          <strong>Concluída em:</strong>
          ${new Date(task.completedAt).toLocaleDateString('pt-BR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
        <p style="margin: 8px 0; color: #475569;">
          <strong>Responsável:</strong> ${assignee.name}
        </p>
      </div>
    </div>
  `;

  const textBodyLines = [
    `Olá, ${assigner.name}!`,
    `A tarefa "${task.title}" foi concluída.`,
    `Responsável: ${assignee.name}`,
    `Concluída em: ${new Date(task.completedAt).toLocaleDateString('pt-BR')}`,
  ];

  const mailOptions = {
    to: assigner.email,
    subject: `[SGLA] - Tarefa concluída: ${task.title} ✅`,
    text: textBodyLines.join('\n'),
    html: template(body),
  };

  return sendEmail(mailOptions);
}
