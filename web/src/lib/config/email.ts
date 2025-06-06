import nodemailer from 'nodemailer';

interface EmailConfig {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  fromEmail: string;
  fromName: string;
}

export function getEmailConfig(): EmailConfig {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
  const smtpUser = process.env.SMTP_USER;
  const smtpPassword = process.env.SMTP_PASSWORD;
  const fromEmail = process.env.FROM_EMAIL;
  const fromName = process.env.FROM_NAME || 'Huegelfest';

  if (!smtpHost || !smtpUser || !smtpPassword || !fromEmail) {
    throw new Error('[Email] Fehlende E-Mail-Konfiguration: SMTP_HOST, SMTP_USER, SMTP_PASSWORD, FROM_EMAIL erforderlich');
  }

  return {
    smtpHost,
    smtpPort,
    smtpUser,
    smtpPassword,
    fromEmail,
    fromName
  };
}

let transporter: nodemailer.Transporter | null = null;

export function getEmailTransporter(): nodemailer.Transporter {
  if (!transporter) {
    const config = getEmailConfig();
    
    transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpPort === 465, // true für Port 465, false für andere Ports
      auth: {
        user: config.smtpUser,
        pass: config.smtpPassword,
      },
    });
  }
  
  return transporter!;
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const config = getEmailConfig();
    const transporter = getEmailTransporter();
    
    const mailOptions = {
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''), // Fallback: HTML zu Text
    };

    console.log('[Email] Attempting to send email:', {
      to: options.to,
      subject: options.subject,
      from: `"${config.fromName}" <${config.fromEmail}>`,
      host: config.smtpHost,
      port: config.smtpPort
    });

    const result = await transporter.sendMail(mailOptions);
    console.log('[Email] E-Mail erfolgreich gesendet:', result.messageId);
    return true;
  } catch (error) {
    console.error('[Email] Detaillierter E-Mail-Fehler:');
    console.error('Error type:', typeof error);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    console.error('Full error object:', error);
    
    // Spezifische SMTP-Fehler behandeln
    if (error && typeof error === 'object') {
      const smtpError = error as any;
      if (smtpError.code) {
        console.error('SMTP Error Code:', smtpError.code);
      }
      if (smtpError.response) {
        console.error('SMTP Response:', smtpError.response);
      }
      if (smtpError.command) {
        console.error('SMTP Command:', smtpError.command);
      }
    }
    
    return false;
  }
} 

export function debugEmailConfig(): void {
  console.log('[Email Debug] Checking environment variables:');
  console.log('SMTP_HOST:', process.env.SMTP_HOST);
  console.log('SMTP_PORT:', process.env.SMTP_PORT);
  console.log('SMTP_USER:', process.env.SMTP_USER);
  console.log('SMTP_PASSWORD:', process.env.SMTP_PASSWORD ? '***hidden***' : 'undefined');
  console.log('FROM_EMAIL:', process.env.FROM_EMAIL);
  console.log('FROM_NAME:', process.env.FROM_NAME);
  
  try {
    const config = getEmailConfig();
    console.log('[Email Debug] Configuration loaded successfully:', {
      smtpHost: config.smtpHost,
      smtpPort: config.smtpPort,
      smtpUser: config.smtpUser,
      fromEmail: config.fromEmail,
      fromName: config.fromName
    });
  } catch (error) {
    console.error('[Email Debug] Error loading configuration:', error);
  }
}