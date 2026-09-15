import nodemailer from 'nodemailer';

const defaultSmtpConfig = {
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  user: '9e7ea8001@smtp-brevo.com',
  pass: 'msbQ3648yv15UaYg',
  from: 'codeflow.auth@gmail.com',
};

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }

    const { email, link, name, inviter = 'VoltxSMS Team' } = body || {};
    if (!email || !link) {
      return res.status(400).json({ success: false, error: 'Recipient email and link are required.' });
    }

    const transporter = nodemailer.createTransport({
      host: defaultSmtpConfig.host,
      port: defaultSmtpConfig.port,
      secure: defaultSmtpConfig.secure,
      auth: {
        user: defaultSmtpConfig.user,
        pass: defaultSmtpConfig.pass,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
    });

    const info = await transporter.sendMail({
      from: `"VoltxSMS" <${defaultSmtpConfig.from}>`,
      to: email,
      subject: 'Your 4-Step Account Setup Invitation (Expires in 5 Minutes)',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 36px 28px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 18px; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
          <div style="text-align: center; margin-bottom: 28px;">
            <div style="display: inline-block; width: 48px; height: 48px; border-radius: 14px; background: linear-gradient(135deg, #0284c7, #0369a1); color: white; line-height: 48px; font-size: 24px; font-weight: 900; margin-bottom: 12px;">
              V
            </div>
            <h2 style="color: #0f172a; margin: 0 0 6px 0; font-size: 22px; font-weight: 800;">VoltxSMS</h2>
            <p style="color: #64748b; font-size: 13px; margin: 0; font-weight: 600; text-transform: uppercase;">Account Onboarding</p>
          </div>
          <div style="color: #334155; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
            <p style="margin: 0 0 12px 0;">Hello <strong>${name || 'User'}</strong>,</p>
            <p style="margin: 0 0 12px 0;">You have been invited by <strong>${inviter}</strong> to set up your account on the <strong>VoltxSMS</strong> platform.</p>
            <p style="margin: 0;">Please click the button below to complete your account setup.</p>
          </div>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${link}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #0284c7, #0369a1); color: #ffffff; text-decoration: none; padding: 15px 36px; border-radius: 12px; font-weight: 800; font-size: 15px;">
              Complete 4-Step Account Setup &rarr;
            </a>
          </div>
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; margin-top: 24px; font-size: 12px; color: #64748b; word-break: break-all;">
            <p style="margin: 0 0 6px 0; font-weight: bold; color: #475569;">Direct Link:</p>
            <a href="${link}" style="color: #0369a1; text-decoration: underline;">${link}</a>
          </div>
        </div>
      `,
    });

    return res.status(200).json({
      success: true,
      message: 'Invitation email successfully sent via Brevo SMTP relay.',
      messageId: info.messageId,
      recipient: email,
    });
  } catch (err: any) {
    const isIpUnauthorized =
      err.message?.includes('403') ||
      err.message?.includes('unauthorized') ||
      err.message?.includes('IP') ||
      err.message?.includes('535') ||
      err.message?.includes('whitelist');

    return res.status(200).json({
      success: false,
      isIpUnauthorized: !!isIpUnauthorized,
      error: err.message,
      message: isIpUnauthorized
        ? 'Brevo SMTP requires Server IP Whitelisting.'
        : 'Failed to send invitation email via Brevo relay: ' + err.message,
    });
  }
}
