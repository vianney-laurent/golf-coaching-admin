import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { InAppMessage } from '../../types/in-app-messages';
import { requireAdminSession } from '../../lib/auth';
import { AppShell } from '../../components/layout/AppShell';
import { Button } from '../../components/ui/Button';
import { MessageList } from '../../components/messages/MessageList';

type MessagesPageProps = {
  messages: InAppMessage[];
};

export default function MessagesPage({
  messages: initialMessages,
}: MessagesPageProps) {
  const router = useRouter();
  const supabase = useSupabaseClient();
  const [messages, setMessages] = useState<InAppMessage[]>(initialMessages);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    setLastUpdated(new Date());
  }, []);

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
      setLastUpdated(new Date());
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

  const stats = useMemo(() => {
    const now = new Date();
    const total = messages.length;
    const active = messages.filter((message) => message.is_active).length;
    const targeted = messages.filter(
      (message) => message.target_user_ids?.length
    ).length;
    const upcoming = messages.filter((message) => {
      if (!message.start_date) return false;
      return new Date(message.start_date) > now;
    }).length;

    return { total, active, targeted, upcoming };
  }, [messages]);

  const description = `Pilotez ${stats.total} message${
    stats.total > 1 ? 's' : ''
  } in-app pour accompagner les différents usages My Swing.`;

  const metrics = [
    { label: 'Total', value: stats.total },
    { label: 'Actifs', value: stats.active },
    { label: 'Campagnes ciblées', value: stats.targeted },
    { label: 'Débuts à venir', value: stats.upcoming },
  ];

  return (
    <>
      <Head>
        <title>Admin - Messages In-App</title>
        <meta name="description" content="Gestion des messages in-app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <AppShell
        title="Messages In-App"
        description={description}
        breadcrumbs={[
          { label: 'Accueil', href: '/' },
          { label: 'Messages in-app' },
        ]}
        actions={
          <>
            <Button variant="secondary" onClick={fetchAndRefresh} disabled={loading}>
              {loading ? 'Actualisation...' : 'Actualiser'}
            </Button>
            <Button href="/messages/new">Nouveau message</Button>
          </>
        }
        headerActions={
          <Button variant="ghost" onClick={handleSignOut}>
            Déconnexion
          </Button>
        }
      >
        <div className="ms-card ms-card--neutral">
          <div className="ms-metric-grid">
            {metrics.map((metric) => (
              <div key={metric.label} className="ms-metric-card">
                <span className="ms-metric-card__label">{metric.label}</span>
                <span className="ms-metric-card__value">{metric.value}</span>
              </div>
            ))}
          </div>
          <div className="ms-footer-note">
            {lastUpdated
              ? `Dernière mise à jour : ${lastUpdated.toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}`
              : 'Synchronisation initiale en cours'}
            {loading ? ' - Actualisation en cours...' : ''}
          </div>
        </div>

        <MessageList
          messages={messages}
          onToggleActive={toggleActive}
          onDelete={deleteMessage}
        />
      </AppShell>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const adminSession = await requireAdminSession(context);
  if (!('session' in adminSession)) {
    return adminSession;
  }
  const { session } = adminSession;

  const { supabaseAdmin } = await import('../../lib/supabase-admin');
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

