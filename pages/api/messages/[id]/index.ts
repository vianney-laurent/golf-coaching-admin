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
    const payload = req.body;

    const updatePayload = {
      title: payload.title,
      content: payload.content,
      content_type: payload.content_type,
      image_url: payload.image_url || null,
      type: payload.type,
      priority: payload.priority,
      target_user_ids:
        Array.isArray(payload.target_user_ids) && payload.target_user_ids.length
          ? payload.target_user_ids
          : null,
      requires_marketing_consent: Boolean(payload.requires_marketing_consent),
      start_date: payload.start_date || null,
      end_date: payload.end_date || null,
      is_active: Boolean(payload.is_active),
      action_url: payload.action_url || null,
      action_label: payload.action_label || null,
    };

    const { error } = await supabaseAdmin
      .from('in_app_messages')
      .update(updatePayload)
      .eq('id', id);

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.status(200).json({ success: true });
    return;
  }

  if (req.method === 'DELETE') {
    const { error } = await supabaseAdmin
      .from('in_app_messages')
      .delete()
      .eq('id', id);

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.status(200).json({ success: true });
    return;
  }

  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('in_app_messages')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      res.status(404).json({ error: error.message });
      return;
    }

    res.status(200).json(data);
    return;
  }

  res.setHeader('Allow', 'GET,PUT,DELETE');
  res.status(405).json({ error: 'Méthode non autorisée' });
}
