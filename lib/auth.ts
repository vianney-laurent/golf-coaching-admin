import type {
  GetServerSidePropsContext,
  GetServerSidePropsResult,
  NextApiRequest,
  NextApiResponse,
} from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import type { Session } from '@supabase/supabase-js';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

if (!ADMIN_EMAIL) {
  throw new Error(
    'La variable d’environnement ADMIN_EMAIL est requise pour sécuriser l’accès administrateur.'
  );
}

type RedirectResult = GetServerSidePropsResult<never>;

export async function requireAdminSession(
  context: GetServerSidePropsContext
): Promise<{ session: Session } | RedirectResult> {
  const supabase = createServerSupabaseClient(context);
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.email) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  if (session.user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  return { session };
}

export async function assertApiAdmin(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<Session> {
  const supabase = createServerSupabaseClient({ req, res });
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    res.status(500).json({ error: 'Erreur serveur lors de la vérification.' });
    throw error;
  }

  if (!session?.user?.email) {
    res.status(401).json({ error: 'Authentification requise.' });
    throw new Error('Unauthenticated request');
  }

  if (session.user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    res.status(403).json({ error: 'Accès refusé.' });
    throw new Error('Forbidden request');
  }

  return session;
}
