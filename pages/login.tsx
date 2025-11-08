import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import type { GetServerSideProps } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';

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
      <main
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8fafc',
          padding: '2rem',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '420px',
            backgroundColor: 'white',
            padding: '2.5rem',
            borderRadius: '16px',
            boxShadow: '0 10px 25px rgba(15, 23, 42, 0.12)',
          }}
        >
          <h1
            style={{
              marginBottom: '1.5rem',
              fontSize: '1.75rem',
              fontWeight: 700,
              textAlign: 'center',
              color: '#0f172a',
            }}
          >
            Accès administrateur
          </h1>

          <p
            style={{
              marginBottom: '2rem',
              textAlign: 'center',
              color: '#475569',
            }}
          >
            Connectez-vous avec votre compte Supabase autorisé.
          </p>

          {error && (
            <div
              style={{
                marginBottom: '1.5rem',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                backgroundColor: '#fee2e2',
                color: '#b91c1c',
                fontSize: '0.95rem',
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label
                htmlFor="email"
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: 600,
                  color: '#0f172a',
                }}
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.com"
                style={{
                  width: '100%',
                  padding: '0.85rem 1rem',
                  border: '1px solid #cbd5f5',
                  borderRadius: '10px',
                  backgroundColor: '#f8fafc',
                  fontSize: '1rem',
                }}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: 600,
                  color: '#0f172a',
                }}
              >
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '0.85rem 1rem',
                  border: '1px solid #cbd5f5',
                  borderRadius: '10px',
                  backgroundColor: '#f8fafc',
                  fontSize: '1rem',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '0.95rem 1rem',
                borderRadius: '10px',
                border: 'none',
                backgroundImage: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
                color: 'white',
                fontWeight: 600,
                fontSize: '1.05rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                transition: 'opacity 0.2s ease',
              }}
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        </div>
      </main>
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
