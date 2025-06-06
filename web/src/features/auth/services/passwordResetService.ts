import { User } from '@/lib/db/models/User';
import { connectDB } from '@/lib/db/connector';
import { sendEmail } from '@/lib/config/email';
import { logger } from '@/lib/logger';
import { getSiteConfig } from '@/lib/config/site';

/**
 * Sendet einen Passwort-Reset-Link per E-Mail
 * @param email - E-Mail-Adresse des Users
 * @returns Erfolgs-Status
 */
export async function sendPasswordResetEmail(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    await connectDB();
    
    // User suchen (inkl. Shadow Users da sie auch Passwort-Reset benötigen können)
    const user = await User.findOne({ 
      email: email.toLowerCase(), 
      isActive: true 
    });
    
    if (!user) {
      // Aus Sicherheitsgründen immer success zurückgeben, auch wenn User nicht existiert
      return { success: true };
    }
    
    if (!user.email) {
      return { success: false, error: 'Dieser Account hat keine E-Mail-Adresse hinterlegt' };
    }
    
    // Reset-Token erstellen
    const resetToken = user.createPasswordResetToken();
    await user.save();
    
    // E-Mail senden
    const { baseUrl } = getSiteConfig();
    const resetUrl = `${baseUrl}/auth/reset-password?token=${resetToken}`;
    
    const emailSent = await sendEmail({
      to: user.email,
      subject: 'Passwort zurücksetzen - Hügelfest',
      html: generatePasswordResetEmail(user.name, resetUrl),
    });
    
    if (!emailSent) {
      return { success: false, error: 'Fehler beim E-Mail-Versand' };
    }
    
    logger.info(`[PasswordReset] Reset-E-Mail gesendet an: ${user.email}`);
    return { success: true };
    
  } catch (error) {
    logger.error('[PasswordReset] Fehler beim Senden der Reset-E-Mail:', error);
    return { success: false, error: 'Ein Fehler ist aufgetreten' };
  }
}

/**
 * Setzt das Passwort mit einem Reset-Token zurück
 * @param token - Reset-Token aus der E-Mail
 * @param newPassword - Neues Passwort
 * @returns Erfolgs-Status
 */
export async function resetPasswordWithToken(token: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
  try {
    await connectDB();
    
    // User mit gültigem Token suchen
    const user = await User.findByPasswordResetToken(token);
    
    if (!user) {
      return { success: false, error: 'Ungültiger oder abgelaufener Reset-Link' };
    }
    
    // Passwort setzen (wird automatisch gehashed durch pre-save Hook)
    user.password = newPassword;
    
    // Reset-Token löschen
    await user.clearPasswordResetToken();
    
    logger.info(`[PasswordReset] Passwort zurückgesetzt für User: ${user.email || user.username}`);
    return { success: true };
    
  } catch (error) {
    logger.error('[PasswordReset] Fehler beim Passwort-Reset:', error);
    return { success: false, error: 'Ein Fehler ist aufgetreten' };
  }
}

/**
 * Prüft ob ein Reset-Token gültig ist
 * @param token - Reset-Token
 * @returns User-Daten wenn Token gültig
 */
export async function validatePasswordResetToken(token: string): Promise<{ valid: boolean; user?: any; error?: string }> {
  try {
    await connectDB();
    
    const user = await User.findByPasswordResetToken(token);
    
    if (!user) {
      return { valid: false, error: 'Ungültiger oder abgelaufener Reset-Link' };
    }
    
    return { 
      valid: true, 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email 
      } 
    };
    
  } catch (error) {
    logger.error('[PasswordReset] Fehler bei Token-Validierung:', error);
    return { valid: false, error: 'Ein Fehler ist aufgetreten' };
  }
}

/**
 * Generiert HTML für die Passwort-Reset-E-Mail
 * @param userName - Name des Users
 * @param resetUrl - Reset-URL
 * @returns HTML-String
 */
function generatePasswordResetEmail(userName: string, resetUrl: string): string {
  const { baseUrl } = getSiteConfig();
  
  return `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Passwort zurücksetzen - Hügelfest</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          line-height: 1.6;
          color: #333333;
          background-color: #f8f9fa;
        }
        
        .email-container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }
        
        .header {
          background: linear-gradient(135deg, #460b6c 0%, #ff9900 100%);
          padding: 40px 30px;
          text-align: center;
          color: white;
        }
        
        .logo-container {
          margin-bottom: 24px;
        }
        
        .logo-text {
          font-size: 28px;
          font-weight: bold;
          letter-spacing: 1px;
          margin: 16px 0 0 0;
        }
        
        .header-subtitle {
          font-size: 16px;
          font-weight: 300;
          margin: 8px 0 0 0;
          opacity: 0.9;
        }
        
        .content {
          padding: 40px 30px;
          background-color: #ffffff;
        }
        
        .greeting {
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 24px;
          color: #460b6c;
        }
        
        .message {
          font-size: 16px;
          line-height: 1.7;
          margin-bottom: 32px;
          color: #555555;
        }
        
        .button-container {
          text-align: center;
          margin: 40px 0;
        }
        
        .reset-button {
          display: inline-block;
          background: linear-gradient(135deg, #ff9900 0%, #ff7700 100%);
          color: #ffffff;
          text-decoration: none;
          padding: 18px 36px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          letter-spacing: 0.5px;
          box-shadow: 0 4px 20px rgba(255, 153, 0, 0.3);
          transition: all 0.3s ease;
        }
        
        .reset-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 25px rgba(255, 153, 0, 0.4);
        }
        
        .url-fallback {
          background-color: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          padding: 16px;
          margin: 32px 0;
          word-break: break-all;
          font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
          font-size: 13px;
          color: #666666;
        }
        
        .url-label {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 12px;
          color: #460b6c;
        }
        
        .important-info {
          background: linear-gradient(135deg, #fff3cd 0%, #fff8e1 100%);
          border-left: 4px solid #ff9900;
          padding: 24px;
          margin: 32px 0;
          border-radius: 0 8px 8px 0;
        }
        
        .important-info h4 {
          color: #856404;
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 16px;
        }
        
        .important-info ul {
          list-style: none;
          padding: 0;
        }
        
        .important-info li {
          padding: 6px 0;
          color: #856404;
          position: relative;
          padding-left: 24px;
        }
        
        .important-info li:before {
          content: "●";
          color: #ff9900;
          font-size: 16px;
          position: absolute;
          left: 0;
        }
        
        .footer {
          background-color: #f8f9fa;
          padding: 32px;
          text-align: center;
        }
        
        .footer-text {
          font-size: 14px;
          color: #6c757d;
          line-height: 1.6;
        }
        
        .brand-footer {
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid #dee2e6;
          color: #460b6c;
          font-weight: 600;
          font-size: 16px;
        }
        
        @media (max-width: 600px) {
          .email-container {
            margin: 0;
            border-radius: 0;
          }
          
          .header,
          .content,
          .footer {
            padding: 24px 20px;
          }
          
          .logo-text {
            font-size: 24px;
          }
          
          .reset-button {
            padding: 16px 28px;
            font-size: 15px;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <div class="logo-container">
            <h1 class="logo-text">Hügelfest</h1>
          </div>
          <p class="header-subtitle">Passwort zurücksetzen</p>
        </div>
        
        <div class="content">
          <div class="greeting">Hallo ${userName},</div>
          
          <div class="message">
            Du hast eine Anfrage zum Zurücksetzen deines Passworts für dein Hügelfest-Konto gestellt.
            <br><br>
            Um ein neues Passwort zu erstellen, klicke bitte auf die folgende Schaltfläche:
          </div>
          
          <div class="button-container">
            <a href="${resetUrl}" class="reset-button">Passwort zurücksetzen</a>
          </div>
          
          <div class="url-label">Alternativ kannst du diesen Link in deinen Browser kopieren:</div>
          <div class="url-fallback">${resetUrl}</div>
          
          <div class="important-info">
            <h4>Wichtige Hinweise:</h4>
            <ul>
              <li>Dieser Link ist nur 10 Minuten gültig</li>
              <li>Falls du diese Anfrage nicht gestellt hast, ignoriere diese E-Mail</li>
              <li>Dein aktuelles Passwort bleibt unverändert, bis du ein neues festlegst</li>
              <li>Aus Sicherheitsgründen kannst du diesen Link nur einmal verwenden</li>
            </ul>
          </div>
        </div>
        
        <div class="footer">
          <div class="footer-text">
            Diese E-Mail wurde automatisch generiert. Bitte antworte nicht auf diese E-Mail.
            <br>
            Bei Fragen wende dich an das Hügelfest-Team.
          </div>
          <div class="brand-footer">
            Hügelfest ${new Date().getFullYear()}
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
} 