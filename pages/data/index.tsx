import Head from 'next/head';
import type { GetServerSideProps } from 'next';
import { requireAdminSession } from '../../lib/auth';
import { AppShell } from '../../components/layout/AppShell';

const mockPipelines = [
  {
    name: 'Pipeline analytics temps réel',
    status: 'En conception',
    owner: 'Equipe Data',
    nextStep: 'Valider les événements priorisés avec le produit',
  },
  {
    name: 'Dashboard adoption mobile',
    status: 'En cours',
    owner: 'Product Marketing',
    nextStep: 'Connecter la source Supabase',
  },
  {
    name: 'Data warehouse partenaires',
    status: 'Exploration',
    owner: 'Ops',
    nextStep: 'Identifier les tables critiques à exposer',
  },
];

const mockPerformance = [
  { label: 'Taux de complétion parcours data', value: '74%' },
  { label: 'Latence API analytics', value: '420 ms' },
  { label: 'Rapports générés / semaine', value: '58' },
  { label: 'Qualité des données', value: '97%' },
];

export default function DataPage() {
  return (
    <>
      <Head>
        <title>Admin - Data</title>
        <meta
          name="description"
          content="Prévisualisation de la future section Data pour le portail My Swing."
        />
      </Head>
      <AppShell
        title="Data"
        description="Espace de travail fictif pour cadrer les besoins data & analytics de My Swing."
        breadcrumbs={[
          { label: 'Accueil', href: '/' },
          { label: 'Data' },
          ]}
      >
        <div className="ms-card ms-card--neutral">
          <div className="ms-card__header">
            <h2 className="ms-card__title">Performance (mock)</h2>
            <p className="ms-card__meta">
              Quelques indicateurs clés pour préfigurer les dashboards à venir.
            </p>
          </div>
          <div className="ms-metric-grid">
            {mockPerformance.map((metric) => (
              <div key={metric.label} className="ms-metric-card">
                <span className="ms-metric-card__label">{metric.label}</span>
                <span className="ms-metric-card__value">{metric.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="ms-card">
          <div className="ms-card__header">
            <h3 className="ms-card__title">Chantiers data</h3>
            <p className="ms-card__meta">
              Liste fictive pour préparer la structuration de la roadmap.
            </p>
          </div>
          <div className="ms-section">
            {mockPipelines.map((pipeline) => (
              <div key={pipeline.name} className="ms-card ms-card--neutral">
                <div className="ms-card__header">
                  <h4 className="ms-card__title">{pipeline.name}</h4>
                  <p className="ms-card__meta">
                    Statut : {pipeline.status} • Owner : {pipeline.owner}
                  </p>
                </div>
                <p>Prochaine étape : {pipeline.nextStep}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="ms-card">
          <div className="ms-card__header">
            <h3 className="ms-card__title">A faire ensuite</h3>
            <p className="ms-card__meta">
              Points d’action à creuser pour lancer la section Data.
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
            <li>Préparer le modèle de permissions inter-équipes.</li>
            <li>Définir les jeux de données disponibles dans Supabase.</li>
            <li>Prototyper le premier dashboard interactif.</li>
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

