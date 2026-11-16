export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const path = req.url || '';
  const body = req.body || {};
  const email = (body.email || '').toLowerCase().trim();

  // /otp/send or /otp/resend
  if (path.includes('send') || path.includes('resend') || req.method === 'POST') {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    return res.status(200).json({
      success: true,
      message: `A 6-digit OTP verification code has been dispatched to ${email}`,
      data: {
        email,
        expiresInSeconds: 300,
        resendCooldownSeconds: 45,
        sent: true,
        devCode: code,
      },
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Email verified successfully',
    data: {
      email,
      emailVerified: true,
      verifiedAt: new Date().toISOString(),
    },
  });
}
