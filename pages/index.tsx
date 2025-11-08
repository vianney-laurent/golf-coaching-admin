import { useState } from 'react';
import Head from 'next/head';
import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { InAppMessage } from '../types/in-app-messages';
import { requireAdminSession } from '../lib/auth';

type HomeProps = {
  messages: InAppMessage[];
};

export default function Home({ messages: initialMessages }: HomeProps) {
  const router = useRouter();
  const supabase = useSupabaseClient();
  const [messages, setMessages] = useState<InAppMessage[]>(initialMessages);
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  const fetchAndRefresh = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/messages');
      if (response.status === 401 || response.status === 403) {
        await handleSignOut();
        return;
      }

      if (!response.ok) {
        throw new Error('Erreur lors du rechargement des messages');
      }
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error(error);
      alert('Impossible de recharger les messages');
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/messages/${id}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      if (response.status === 401 || response.status === 403) {
        await handleSignOut();
        return;
      }

      if (!response.ok) throw new Error('toggle failed');
      await fetchAndRefresh();
    } catch (error) {
      console.error('Error toggling message:', error);
      alert('Erreur lors de la mise à jour');
    }
  };

  const deleteMessage = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) return;

    try {
      const response = await fetch(`/api/messages/${id}`, {
        method: 'DELETE',
      });
      if (response.status === 401 || response.status === 403) {
        await handleSignOut();
        return;
      }
      if (!response.ok) throw new Error('delete failed');
      await fetchAndRefresh();
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Erreur lors de la suppression');
    }
  };

  return (
    <>
      <Head>
        <title>Admin - Messages In-App</title>
        <meta name="description" content="Gestion des messages in-app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
        <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', gap: '1rem' }}>
          <h1>Messages In-App</h1>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <Link
                href="/messages/new"
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#10b981',
                  color: 'white',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontWeight: '600',
                }}
              >
                + Nouveau Message
              </Link>
              <button
                onClick={handleSignOut}
                style={{
                  padding: '0.75rem 1.25rem',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '600',
                }}
              >
                Déconnexion
              </button>
            </div>
        </div>

          {loading ? (
            <p>Chargement...</p>
          ) : messages.length === 0 ? (
          <p>Aucun message pour le moment.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9' }}>
                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>Titre</th>
                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>Type</th>
                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>Priorité</th>
                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>Statut</th>
                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>Dates</th>
                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {messages.map((message) => (
                <tr key={message.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '1rem' }}>{message.title}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ padding: '0.25rem 0.75rem', borderRadius: '4px', fontSize: '0.875rem', fontWeight: '600', backgroundColor: message.type === 'banner' ? '#dbeafe' : '#fce7f3', color: message.type === 'banner' ? '#1e40af' : '#9f1239' }}>
                      {message.type}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>{message.priority}</td>
                  <td style={{ padding: '1rem' }}>
                    <button
                      onClick={() => toggleActive(message.id, message.is_active)}
                      style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: '600',
                        backgroundColor: message.is_active ? '#10b981' : '#94a3b8',
                        color: 'white',
                      }}
                    >
                      {message.is_active ? 'Actif' : 'Inactif'}
                    </button>
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#64748b' }}>
                    {message.start_date ? new Date(message.start_date).toLocaleDateString('fr-FR') : 'Sans début'}
                    {' - '}
                    {message.end_date ? new Date(message.end_date).toLocaleDateString('fr-FR') : 'Sans fin'}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Link href={`/messages/${message.id}/edit`} style={{ padding: '0.5rem 1rem', backgroundColor: '#3b82f6', color: 'white', borderRadius: '6px', textDecoration: 'none', fontSize: '0.875rem' }}>
                        Éditer
                      </Link>
                      <button
                        onClick={() => deleteMessage(message.id)}
                        style={{ padding: '0.5rem 1rem', backgroundColor: '#ef4444', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.875rem' }}
                      >
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const adminSession = await requireAdminSession(context);
  if (!('session' in adminSession)) {
    return adminSession;
  }
  const { session } = adminSession;

  const { supabaseAdmin } = await import('../lib/supabase-admin');
  const { data, error } = await supabaseAdmin
    .from('in_app_messages')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error loading messages:', error);
    return {
      props: {
        initialSession: session,
        messages: [],
      },
    };
  }

  return {
    props: {
      initialSession: session,
      messages: data ?? [],
    },
  };
};

