import Head from 'next/head';
import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { requireAdminSession } from '../../lib/auth';
import { AppShell } from '../../components/layout/AppShell';
import { Button } from '../../components/ui/Button';

const mockUserMetrics = [
  { label: 'Utilisateurs actifs (30 jours)', value: '3 420' },
  { label: 'Taux de rétention', value: '81%' },
  { label: 'Résiliations', value: '37' },
  { label: 'Promoteurs NPS', value: '62%' },
];

const mockSegments = [
  {
    name: 'Cartes Premium',
    population: '1 120 membres',
    focus: 'Priorité onboarding produit pro',
  },
  {
    name: 'Prospection B2B',
    population: '540 comptes',
    focus: 'Campagnes ciblées sur les clubs',
  },
  {
    name: 'Engagés 90+',
    population: '860 utilisateurs',
    focus: 'Ambassadeurs potentiels',
  },
];

export default function UsersPage() {
  const router = useRouter();
  const supabase = useSupabaseClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  return (
    <>
      <Head>
        <title>Admin - Gestion utilisateurs</title>
        <meta
          name="description"
          content="Suivez l’activité des utilisateurs My Swing et préparez les futures actions."
        />
      </Head>
      <AppShell
        title="Gestion utilisateurs"
        description="Page de démonstration pour structurer la future section dédiée aux utilisateurs My Swing."
        breadcrumbs={[
          { label: 'Accueil', href: '/' },
          { label: 'Gestion utilisateurs' },
        ]}
        headerActions={
          <Button variant="ghost" onClick={handleSignOut}>
            Déconnexion
          </Button>
        }
      >
        <div className="ms-card ms-card--neutral">
          <div className="ms-card__header">
            <h2 className="ms-card__title">Vue d’ensemble</h2>
            <p className="ms-card__meta">
              Chiffres mockés pour projeter la future vue analytique.
            </p>
          </div>
          <div className="ms-metric-grid">
            {mockUserMetrics.map((metric) => (
              <div key={metric.label} className="ms-metric-card">
                <span className="ms-metric-card__label">{metric.label}</span>
                <span className="ms-metric-card__value">{metric.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="ms-card">
          <div className="ms-card__header">
            <h3 className="ms-card__title">Segments prioritaires</h3>
            <p className="ms-card__meta">
              Définis pour l’instant à la main afin de cadrer la future logique
              de segmentation.
            </p>
          </div>
          <div className="ms-section">
            {mockSegments.map((segment) => (
              <div key={segment.name} className="ms-card ms-card--neutral">
                <div className="ms-card__header">
                  <h4 className="ms-card__title">{segment.name}</h4>
                  <p className="ms-card__meta">{segment.population}</p>
                </div>
                <p>{segment.focus}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="ms-card">
          <div className="ms-card__header">
            <h3 className="ms-card__title">Prochaines étapes</h3>
            <p className="ms-card__meta">
              Checklist fictive pour anticiper les développements.
            </p>
          </div>
          <ul
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              paddingLeft: '1.25rem',
              listStyleType: 'disc',
            }}
          >
            <li>Indexer les événements clefs utilisateurs dans la base analytics.</li>
            <li>Ajouter les filtres combinés (segment, produit, statut).</li>
            <li>Préparer l’export CSV et les alertes hebdomadaires.</li>
          </ul>
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

  return {
    props: {
      initialSession: session,
    },
  };
};

