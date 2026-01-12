import nodemailer from 'nodemailer';

// Configuração do transporter de email
// Em produção, configure com suas credenciais reais
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false, // true para 465, false para outras portas
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verifica se o email está configurado
const isEmailConfigured = () => {
  return !!(process.env.SMTP_USER && process.env.SMTP_PASS);
};

/**
 * Envia email de recuperação de senha
 * @param {string} email - Email do destinatário
 * @param {string} resetToken - Token de reset de senha
 * @param {string} userName - Nome do usuário
 */
export const sendPasswordResetEmail = async (email, resetToken, userName) => {
  if (!isEmailConfigured()) {
    // Em desenvolvimento, apenas loga o token
    console.log('========================================');
    console.log('📧 EMAIL DE RECUPERAÇÃO DE SENHA (DEV)');
    console.log('========================================');
    console.log(`Para: ${email}`);
    console.log(`Nome: ${userName}`);
    console.log(`Token: ${resetToken}`);
    console.log(`Link: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`);
    console.log('========================================');
    return;
  }

  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: `"Ritmo Constante" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Recuperação de Senha - Ritmo Constante',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background-color: #6366f1;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .content {
              background-color: #f9fafb;
              padding: 30px;
              border-radius: 0 0 8px 8px;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background-color: #6366f1;
              color: white;
              text-decoration: none;
              border-radius: 6px;
              margin: 20px 0;
            }
            .button:hover {
              background-color: #4f46e5;
            }
            .footer {
              margin-top: 20px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              font-size: 12px;
              color: #6b7280;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Ritmo Constante</h1>
            </div>
            <div class="content">
              <h2>Olá, ${userName}!</h2>
              <p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>
              <p>Clique no botão abaixo para criar uma nova senha:</p>
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Redefinir Senha</a>
              </div>
              <p>Ou copie e cole o link abaixo no seu navegador:</p>
              <p style="word-break: break-all; color: #6366f1;">${resetUrl}</p>
              <p><strong>Este link expira em 1 hora.</strong></p>
              <p>Se você não solicitou esta recuperação de senha, ignore este email.</p>
              <div class="footer">
                <p>Este é um email automático, por favor não responda.</p>
                <p>&copy; ${new Date().getFullYear()} Ritmo Constante. Todos os direitos reservados.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      Olá, ${userName}!
      
      Recebemos uma solicitação para redefinir a senha da sua conta.
      
      Acesse o link abaixo para criar uma nova senha:
      ${resetUrl}
      
      Este link expira em 1 hora.
      
      Se você não solicitou esta recuperação de senha, ignore este email.
      
      Este é um email automático, por favor não responda.
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email de recuperação de senha enviado para: ${email}`);
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    throw new Error('Erro ao enviar email de recuperação de senha');
  }
};























