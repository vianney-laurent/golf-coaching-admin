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
    res.status(405).json({ error: 'Méthode non autorisée' });
    return;
  }

  const { id } = req.query;
  if (typeof id !== 'string') {
    res.status(400).json({ error: 'Paramètre id invalide.' });
    return;
  }

  const { is_active } = req.body;
  if (typeof is_active !== 'boolean') {
    res.status(400).json({ error: 'Champ is_active manquant ou invalide.' });
    return;
  }

  const { error } = await supabaseAdmin
    .from('in_app_messages')
    .update({ is_active })
    .eq('id', id);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.status(200).json({ success: true });
}
