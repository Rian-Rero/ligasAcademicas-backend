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
  const body = html`
    <p>Olá, ${user.name}!</p>
    <p>
      Para alterar sua senha, favor clicar
      <a
        href="${`${
          process.env.FRONTEND_URL
        }/redefinir-senha/${encodeURIComponent(passwordToken)}`}"
        >aqui.</a
      >
    </p>
  `;

  const mailOptions = {
    to: user.email,
    subject: `[SGLA] - Redefinição de senha`,
    text: `
    Olá, ${user.name}! Para redefinir sua senha, favor acessar o link abaixo:
    ${`${process.env.FRONTEND_URL}/redefinir-senha/${encodeURIComponent(passwordToken)}`}
    `,
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
