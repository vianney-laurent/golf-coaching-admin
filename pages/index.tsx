import Head from 'next/head';
import type { GetServerSideProps } from 'next';
import { requireAdminSession } from '../lib/auth';
import { AppShell } from '../components/layout/AppShell';
import { Button } from '../components/ui/Button';

type MessageStats = {
  total: number;
  active: number;
  targeted: number;
  upcoming: number;
  lastMessageTitle: string | null;
  lastMessageUpdatedAt: string | null;
  generatedAt: string;
};

type HomeProps = {
  messageStats: MessageStats;
};

const mockSections = [
  {
    title: 'Gestion utilisateurs',
    description:
      'Données fictives pour tester l’organisation des insights côté utilisateurs.',
    items: [
      { label: 'Utilisateurs actifs (7 jours)', value: '1 240', trend: '+3,1% vs N-1' },
      { label: 'Nouveaux inscrits', value: '82', trend: '+12 cette semaine' },
      { label: 'Segments prioritaires', value: '3', trend: 'Cartes Premium, Pros, Clubs' },
    ],
  },
  {
    title: 'Data & analytics',
    description:
      'Indicateurs mockés inspirés des KPI suivis sur My Swing pour préparer la future vue Data.',
    items: [
      { label: 'Conversion parcours onboarding', value: '68%', trend: '+4 pts' },
      { label: 'Engagement hebdo moyen', value: '5,4 sessions', trend: '+0,6 vs N-1' },
      { label: 'Taux de satisfaction', value: '92%', trend: 'Enquête Oct. 2025' },
    ],
  },
];

export default function Home({ messageStats }: HomeProps) {
  const generatedAt = new Date(messageStats.generatedAt);
  const lastMessageUpdatedAt = messageStats.lastMessageUpdatedAt
    ? new Date(messageStats.lastMessageUpdatedAt)
    : null;

  const messageMetrics = [
    { label: 'Messages actifs', value: messageStats.active },
    { label: 'Messages totaux', value: messageStats.total },
    { label: 'Campagnes ciblées', value: messageStats.targeted },
    { label: 'Débuts à venir', value: messageStats.upcoming },
  ];

  return (
    <>
      <Head>
        <title>Admin - Tableau de bord</title>
        <meta
          name="description"
          content="Aperçu rapide des métriques clés My Swing."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <AppShell
        title="Tableau de bord My Swing"
        description="Préparez la future administration My Swing avec une page d’accueil centrée sur les indicateurs clés."
      >
        <div className="ms-card ms-card--neutral">
          <div className="ms-card__header">
            <h2 className="ms-card__title">Messages in-app</h2>
            <p className="ms-card__meta">
              Données rafraîchies le{' '}
              {generatedAt.toLocaleString('fr-FR', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
          <div className="ms-metric-grid">
            {messageMetrics.map((metric) => (
              <div key={metric.label} className="ms-metric-card">
                <span className="ms-metric-card__label">{metric.label}</span>
                <span className="ms-metric-card__value">{metric.value}</span>
              </div>
            ))}
          </div>
          <div className="ms-footer-note">
            {messageStats.lastMessageTitle ? (
              <>
                Dernier message mis à jour{' '}
                {lastMessageUpdatedAt
                  ? lastMessageUpdatedAt.toLocaleString('fr-FR', {
                      day: '2-digit',
                      month: 'long',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'récemment'}
                {' : '}
                <strong>{messageStats.lastMessageTitle}</strong>
              </>
            ) : (
              'Aucun message disponible pour le moment.'
            )}
          </div>
          <div className="ms-actions">
            <Button variant="secondary" href="/messages">
              Gérer les messages
            </Button>
            <Button href="/messages/new">Créer un message</Button>
          </div>
        </div>

        <div className="ms-section">
          <h2 className="ms-section__title">Moments clés</h2>
          <p className="ms-section__description">
            Ces sections sont mockées pour matérialiser l’organisation future du
            portail d’admin.
          </p>
          {mockSections.map((section) => (
            <div key={section.title} className="ms-card">
              <div className="ms-card__header">
                <h3 className="ms-card__title">{section.title}</h3>
                <p className="ms-card__meta">{section.description}</p>
              </div>
              <div className="ms-metric-grid">
                {section.items.map((item) => (
                  <div key={item.label} className="ms-metric-card">
                    <span className="ms-metric-card__label">{item.label}</span>
                    <span className="ms-metric-card__value">{item.value}</span>
                    <span className="ms-card__meta">{item.trend}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="ms-section">
          <h2 className="ms-section__title">Accès rapides</h2>
          <p className="ms-section__description">
            Naviguez dès maintenant vers les futures sections dédiées.
          </p>
          <div className="ms-card">
            <div className="ms-actions">
              <Button href="/users" variant="secondary">
                Gestion utilisateurs
              </Button>
              <Button href="/data" variant="secondary">
                Data
              </Button>
              <Button href="/messages" variant="secondary">
                Messages in-app
              </Button>
            </div>
          </div>
        </div>
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

  const { supabaseAdmin } = await import('../lib/supabase-admin');
  const { data, error } = await supabaseAdmin
    .from('in_app_messages')
    .select('id, title, is_active, start_date, target_user_ids, updated_at, created_at')
    .order('updated_at', { ascending: false });

  const baseStats: MessageStats = {
    total: 0,
    active: 0,
    targeted: 0,
    upcoming: 0,
    lastMessageTitle: null,
    lastMessageUpdatedAt: null,
    generatedAt: new Date().toISOString(),
  };

  if (error) {
    console.error('Error loading messages:', error);
    return {
      props: {
        initialSession: session,
        messageStats: baseStats,
      },
    };
  }

  const now = new Date();
  const messages = data ?? [];

  const stats: MessageStats = {
    total: messages.length,
    active: messages.filter((message) => message.is_active).length,
    targeted: messages.filter(
      (message) => Array.isArray(message.target_user_ids) && message.target_user_ids.length > 0
    ).length,
    upcoming: messages.filter((message) => {
      if (!message.start_date) return false;
      return new Date(message.start_date) > now;
    }).length,
    lastMessageTitle: messages[0]?.title ?? null,
    lastMessageUpdatedAt: messages[0]?.updated_at ?? messages[0]?.created_at ?? null,
    generatedAt: new Date().toISOString(),
  };

  return {
    props: {
      initialSession: session,
      messageStats: stats,
    },
  };
};

