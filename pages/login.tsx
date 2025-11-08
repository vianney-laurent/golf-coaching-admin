import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import type { GetServerSideProps } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '../components/ui/Button';

type LoginProps = {
  errorMessage?: string | null;
};

export default function Login({ errorMessage }: LoginProps) {
  const supabase = useSupabaseClient();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(errorMessage ?? null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw authError;
      }

      router.replace('/');
    } catch (authError: any) {
      setError(authError.message ?? 'Connexion impossible. Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Connexion - Admin</title>
      </Head>
        <div className="ms-auth">
          <div className="ms-card ms-auth__panel">
            <div className="ms-section">
              <h1 className="ms-auth__title">Accès administrateur</h1>
              <p className="ms-auth__subtitle">
                Connectez-vous avec votre compte Supabase autorisé.
              </p>
            </div>

            {error && <div className="ms-alert ms-alert--error">{error}</div>}

            <form onSubmit={handleSubmit} className="ms-form">
              <div className="ms-field">
                <label htmlFor="email" className="ms-field__label">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  className="ms-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@exemple.com"
                />
              </div>

              <div className="ms-field">
                <label htmlFor="password" className="ms-field__label">
                  Mot de passe
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  className="ms-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              <Button type="submit" disabled={loading} fullWidth>
                {loading ? 'Connexion...' : 'Se connecter'}
              </Button>
            </form>
          </div>
        </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const supabase = createServerSupabaseClient(context);
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const adminEmailEnv = process.env.ADMIN_EMAIL;
  if (!adminEmailEnv) {
    throw new Error(
      'La variable d’environnement ADMIN_EMAIL est requise pour sécuriser l’accès administrateur.'
    );
  }

  const adminEmail = adminEmailEnv.toLowerCase();
  const sessionEmail = session?.user?.email?.toLowerCase();

  if (sessionEmail && sessionEmail === adminEmail) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  if (sessionEmail && sessionEmail !== adminEmail) {
    await supabase.auth.signOut();
    return {
      props: {
        initialSession: null,
        errorMessage:
          'Cet email ne dispose pas des droits administrateur. Veuillez utiliser le compte autorisé.',
      },
    };
  }

  return {
    props: {
      initialSession: session ?? null,
      errorMessage: null,
    },
  };
};
