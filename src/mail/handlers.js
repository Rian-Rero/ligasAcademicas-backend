import { html } from 'code-tag';

import sendEmail from '../config/mail/nodemailer.js';
import template from './template.js';

export function confirmEmail({ user, token }) {
  const body = html`
    <p>Olá, ${user.name}!</p>
    <p>
      Para finalizar a criação da sua conta, favor clicar
      <a
        href="${`${
          process.env.FRONTEND_URL
        }/email-confirmado/${encodeURIComponent(token)}`}"
        >aqui.</a
      >
    </p>
  `;

  const mailOptions = {
    to: user.email,
    subject: `[SGLA] - Confirmação de email`,
    text: `
    Olá, ${user.name}! Para finalizar a criação da sua conta, favor clicar aqui.
    `,
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
    subject: `[SGLA] - Confirmação de email`,
    text: `
    Olá, ${user.name}! Para finalizar a criação da sua conta, favor clicar aqui.
    `,
    html: template(body),
  };

  return sendEmail(mailOptions);
}
