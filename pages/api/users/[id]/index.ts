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

  const { id } = req.query;

  if (typeof id !== 'string') {
    res.status(400).json({ error: 'Paramètre id invalide.' });
    return;
  }

  if (req.method === 'PUT') {
    const { updates } = req.body ?? {};

    if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
      res.status(400).json({ error: 'Le payload de mise à jour est invalide.' });
      return;
    }

    const sanitizedUpdates = Object.fromEntries(
      Object.entries(updates).filter(([key, value]) => {
        if (['id', 'created_at', 'updated_at'].includes(key)) {
          return false;
        }
        return value !== undefined;
      })
    );

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(sanitizedUpdates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.status(200).json({ profile: data });
    return;
  }

  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      res.status(404).json({ error: error.message });
      return;
    }

    res.status(200).json({ profile: data });
    return;
  }

  res.setHeader('Allow', 'GET,PUT');
  res.status(405).json({ error: 'Méthode non autorisée.' });
}

