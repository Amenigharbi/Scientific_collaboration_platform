import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailParams {
  to: string;
  projectTitle: string;
  inviterName: string;
  inviterEmail: string;
}

export async function sendCollaborationEmail({
  to,
  projectTitle,
  inviterName,
  inviterEmail
}: SendEmailParams): Promise<boolean> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.log('❌ RESEND_API_KEY non configurée - Email simulé');
      return false;
    }

    const { data, error } = await resend.emails.send({
      from: 'gharbiameni17@gmail.com', 
      to: [to],
      subject: `Invitation à collaborer sur "${projectTitle}"`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Invitation à collaborer</h2>
          <p>Bonjour,</p>
          <p>
            <strong>${inviterName}</strong> (${inviterEmail}) vous invite à collaborer 
            sur le projet de recherche : <strong>"${projectTitle}"</strong>.
          </p>
          <p>
            Pour accepter cette invitation, connectez-vous à la plateforme :
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXTAUTH_URL}/dashboard" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; display: inline-block;">
              Accéder à la plateforme
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px;">
            Si vous n'avez pas de compte, vous pouvez en créer un avec cette adresse email.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('❌ Erreur envoi email:', error);
      return false;
    }

    console.log('✅ Email envoyé avec succès:', data?.id);
    return true;
  } catch (error) {
    console.error('❌ Erreur envoi email:', error);
    return false;
  }
}