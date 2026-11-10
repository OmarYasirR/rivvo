const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: process.env.SMTP_USER
    ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    : undefined,
});

async function sendMail({ to, subject, html }) {
  return transporter.sendMail({
    from: process.env.EMAIL_FROM || 'Rivvo <no-reply@rivvo.app>',
    to,
    subject,
    html,
  });
}

module.exports = { sendMail };
