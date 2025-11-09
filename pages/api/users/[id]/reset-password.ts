import type { NextApiRequest, NextApiResponse } from 'next';
import { assertApiAdmin } from '../../../../lib/auth';
import { supabaseAdmin } from '../../../../lib/supabase-admin';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    await assertApiAdmin(req, res);
  } catch {
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Méthode non autorisée.' });
    return;
  }

  const { id } = req.query;

  if (typeof id !== 'string') {
    res.status(400).json({ error: 'Paramètre id invalide.' });
    return;
  }

  const { data: userData, error: fetchError } =
    await supabaseAdmin.auth.admin.getUserById(id);

  if (fetchError || !userData?.user) {
    res
      .status(404)
      .json({ error: "Impossible de trouver l'utilisateur associé." });
    return;
  }

  const userEmail = userData.user.email;

  if (!userEmail) {
    res
      .status(400)
      .json({ error: "L'utilisateur n'a pas d'adresse e-mail associée." });
    return;
  }

  const forwardedProto = (req.headers['x-forwarded-proto'] as string) ?? 'https';
  const host = req.headers.host ?? '';
  const fallbackRedirect =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (host ? `${forwardedProto}://${host}` : undefined);

  const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(
    userEmail,
    fallbackRedirect
      ? {
          redirectTo: `${fallbackRedirect}/auth/reset-password`,
        }
      : undefined
  );

  if (resetError) {
    res.status(500).json({ error: resetError.message });
    return;
  }

  res.status(200).json({ success: true });
}

