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

  const body = req.body || {};
  const role = (body.role || 'PATIENT').toUpperCase();
  const uid = `usr_${Date.now().toString(36)}`;
  const user = {
    userId: uid,
    uid,
    fullName: body.fullName || 'Registered User',
    email: body.email,
    role,
    phone: body.phone || '',
    gender: body.gender || 'Male',
    dateOfBirth: body.dateOfBirth || '',
    address: body.address || '',
    specialization: body.specialization || '',
    medicalRegistrationNumber: body.medicalRegistrationNumber || '',
    hospitalAffiliation: body.hospitalAffiliation || '',
    consultationFee: body.consultationFee || 800,
    verificationStatus: role === 'DOCTOR' ? 'PENDING' : 'VERIFIED',
    isRecentlyAdded: true,
  };
  const token = `resilient-token-${uid}`;

  return res.status(200).json({
    success: true,
    message: 'Account registered successfully',
    data: {
      token,
      user,
      role,
      profileId: uid,
    },
  });
}
