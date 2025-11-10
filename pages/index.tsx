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

type MetricData = {
  current: number;
  previous: number | null;
  delta: number;
  deltaPercentage: number | null;
};

type RateMetricData = {
  optedIn: number;
  total: number;
  rate: number;
};

type DashboardMetrics = {
  generatedAt: string;
  totalUsers: MetricData;
  weeklySignups: MetricData;
  analyses: MetricData;
  waitlist: MetricData;
  consent: {
    marketing: RateMetricData;
    improvement: RateMetricData;
  };
};

type HomeProps = {
  messageStats: MessageStats;
  dashboardMetrics: DashboardMetrics;
};

const numberFormatter = new Intl.NumberFormat('fr-FR');
const percentFormatter = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const formatTrend = (metric: MetricData, comparisonLabel: string) => {
  const { delta, deltaPercentage, previous } = metric;

  if (previous === null) {
    return { text: `— ${comparisonLabel}`, variant: 'neutral' as const };
  }

  const variant = delta === 0 ? 'neutral' : delta > 0 ? 'positive' : 'negative';

  if (deltaPercentage !== null && Number.isFinite(deltaPercentage)) {
    const absValue = Math.abs(deltaPercentage);
    const formatted = `${percentFormatter.format(absValue)} %`;
    const prefix = delta > 0 ? '+' : delta < 0 ? '-' : '';
    return {
      text: `${prefix}${formatted} ${comparisonLabel}`,
      variant,
    };
  }

  const absDelta = Math.abs(delta);
  const prefix = delta > 0 ? '+' : delta < 0 ? '-' : '';
  return {
    text: `${prefix}${numberFormatter.format(absDelta)} ${comparisonLabel}`,
    variant,
  };
};

const startOfUtcDay = (date: Date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

export default function Home({ messageStats, dashboardMetrics }: HomeProps) {
  const generatedAt = new Date(messageStats.generatedAt);
  const metricsGeneratedAt = new Date(dashboardMetrics.generatedAt);

  const messageMetrics = [
    { label: 'Messages actifs', value: messageStats.active },
    { label: 'Messages totaux', value: messageStats.total },
    { label: 'Campagnes ciblées', value: messageStats.targeted },
    { label: 'Débuts à venir', value: messageStats.upcoming },
  ];

  const metricCards = [
    {
      label: 'Utilisateurs totaux',
      value: numberFormatter.format(dashboardMetrics.totalUsers.current),
      trend: formatTrend(dashboardMetrics.totalUsers, 'vs fin M-1'),
    },
    {
      label: 'Comptes créés (semaine en cours)',
      value: numberFormatter.format(dashboardMetrics.weeklySignups.current),
      trend: formatTrend(dashboardMetrics.weeklySignups, 'vs semaine précédente'),
    },
    {
      label: 'Analyses effectuées (mois en cours)',
      value: numberFormatter.format(dashboardMetrics.analyses.current),
      trend: formatTrend(dashboardMetrics.analyses, 'vs M-1'),
    },
    {
      label: 'Inscriptions waitlist (semaine en cours)',
      value: numberFormatter.format(dashboardMetrics.waitlist.current),
      trend: formatTrend(dashboardMetrics.waitlist, 'vs semaine précédente'),
    },
  ];

  const consentCards = [
    {
      label: 'Opt-in marketing',
      description: 'Communications marketing',
      metric: dashboardMetrics.consent.marketing,
      variant: 'marketing' as const,
    },
    {
      label: 'Opt-in amélioration produit',
      description: 'Partage pour améliorer My Swing',
      metric: dashboardMetrics.consent.improvement,
      variant: 'improvement' as const,
    },
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
        description="Visualisez les indicateurs clés actualisés pour piloter My Swing."
      >
        <div className="ms-card">
          <div className="ms-card__header">
            <h2 className="ms-card__title">Indicateurs clés</h2>
            <p className="ms-card__meta">
              Données synchronisées le{' '}
              {metricsGeneratedAt.toLocaleString('fr-FR', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
          <div className="ms-metric-grid">
            {metricCards.map((metric) => (
              <div key={metric.label} className="ms-metric-card">
                <span className="ms-metric-card__label">{metric.label}</span>
                <span className="ms-metric-card__value">{metric.value}</span>
                <span className={`ms-trend ms-trend--${metric.trend.variant}`}>
                  {metric.trend.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="ms-card">
          <div className="ms-card__header">
            <h2 className="ms-card__title">Consentements utilisateurs</h2>
            <p className="ms-card__meta">
              Taux d’opt-in par rapport à l’ensemble des consentements enregistrés.
            </p>
          </div>
          <div className="ms-consent-grid">
            {consentCards.map((card) => {
              const rateValue = percentFormatter.format(card.metric.rate);
              const clampedRate = Math.max(0, Math.min(card.metric.rate, 100));
              return (
                <div
                  key={card.label}
                  className={`ms-consent-item ms-consent-item--${card.variant}`}
                >
                  <div className="ms-consent-item__header">
                    <div className="ms-consent-item__titles">
                      <span className="ms-consent-item__label">{card.label}</span>
                      <p className="ms-consent-item__description">{card.description}</p>
                    </div>
                    <span className="ms-consent-item__rate">{rateValue} %</span>
                  </div>
                  <div className="ms-progress">
                    <div className="ms-progress__track">
                      <div
                        className="ms-progress__bar"
                        style={{ width: `${clampedRate}%` }}
                      />
                    </div>
                    <span className="ms-progress__value">
                      {numberFormatter.format(card.metric.optedIn)} /{' '}
                      {numberFormatter.format(card.metric.total)} utilisateurs
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

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
          <div className="ms-actions">
            <Button variant="secondary" href="/messages">
              Gérer les messages
            </Button>
            <Button href="/messages/new">Créer un message</Button>
          </div>
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

  const now = new Date();
  const nowIso = now.toISOString();

  const startOfCurrentMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
  );
  const startOfPreviousMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)
  );

  const startOfTodayUtc = startOfUtcDay(now);
  const currentWeekDay = startOfTodayUtc.getUTCDay();
  const offsetToMonday = (currentWeekDay + 6) % 7;
  const startOfCurrentWeek = new Date(startOfTodayUtc);
  startOfCurrentWeek.setUTCDate(startOfCurrentWeek.getUTCDate() - offsetToMonday);
  const startOfPreviousWeek = new Date(startOfCurrentWeek);
  startOfPreviousWeek.setUTCDate(startOfPreviousWeek.getUTCDate() - 7);

  const weekElapsedMs = Math.min(
    Math.max(now.getTime() - startOfCurrentWeek.getTime(), 0),
    7 * 24 * 60 * 60 * 1000
  );
  const endOfPreviousWeekComparable = new Date(
    startOfPreviousWeek.getTime() + weekElapsedMs
  );

  const [
    totalUsersResponse,
    currentMonthUsersResponse,
    currentWeekUsersResponse,
    previousWeekUsersResponse,
    currentMonthAnalysesResponse,
    previousMonthAnalysesResponse,
    consentTotalResponse,
    consentMarketingResponse,
    consentImprovementResponse,
    waitlistCurrentWeekResponse,
    waitlistPreviousWeekResponse,
  ] = await Promise.all([
    supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }),
    supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfCurrentMonth.toISOString())
      .lt('created_at', nowIso),
    supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfCurrentWeek.toISOString())
      .lt('created_at', nowIso),
    supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfPreviousWeek.toISOString())
      .lt('created_at', endOfPreviousWeekComparable.toISOString()),
    supabaseAdmin
      .from('analyses')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfCurrentMonth.toISOString())
      .lt('created_at', nowIso),
    supabaseAdmin
      .from('analyses')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfPreviousMonth.toISOString())
      .lt('created_at', startOfCurrentMonth.toISOString()),
    supabaseAdmin.from('consent').select('*', { count: 'exact', head: true }),
    supabaseAdmin
      .from('consent')
      .select('*', { count: 'exact', head: true })
      .eq('marketing', true),
    supabaseAdmin
      .from('consent')
      .select('*', { count: 'exact', head: true })
      .eq('improvement', true),
    supabaseAdmin
      .from('waitlist')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfCurrentWeek.toISOString())
      .lt('created_at', nowIso),
    supabaseAdmin
      .from('waitlist')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfPreviousWeek.toISOString())
      .lt('created_at', endOfPreviousWeekComparable.toISOString()),
  ]);

  const getCountOrZero = (
    response: Awaited<typeof totalUsersResponse>,
    label: string
  ) => {
    if (response.error) {
      console.error(`Erreur lors du chargement de ${label}:`, response.error);
      return 0;
    }
    return response.count ?? 0;
  };

  const totalUsersCount = getCountOrZero(totalUsersResponse, 'profiles (total)');
  const currentMonthUsersCount = getCountOrZero(
    currentMonthUsersResponse,
    'profiles (mois en cours)'
  );
  const currentWeekUsersCount = getCountOrZero(
    currentWeekUsersResponse,
    'profiles (semaine en cours)'
  );
  const previousWeekUsersCount = getCountOrZero(
    previousWeekUsersResponse,
    'profiles (semaine précédente comparable)'
  );
  const currentMonthAnalysesCount = getCountOrZero(
    currentMonthAnalysesResponse,
    'analyses (mois en cours)'
  );
  const previousMonthAnalysesCount = getCountOrZero(
    previousMonthAnalysesResponse,
    'analyses (mois précédent)'
  );
  const consentTotalCount = getCountOrZero(
    consentTotalResponse,
    'consent (total)'
  );
  const marketingOptInCount = getCountOrZero(
    consentMarketingResponse,
    'consent (marketing true)'
  );
  const improvementOptInCount = getCountOrZero(
    consentImprovementResponse,
    'consent (improvement true)'
  );
  const waitlistCurrentWeekCount = getCountOrZero(
    waitlistCurrentWeekResponse,
    'waitlist (semaine en cours)'
  );
  const waitlistPreviousWeekCount = getCountOrZero(
    waitlistPreviousWeekResponse,
    'waitlist (semaine précédente comparable)'
  );

  const previousMonthUsersTotal = Math.max(
    totalUsersCount - currentMonthUsersCount,
    0
  );
  const totalUsersDelta = totalUsersCount - previousMonthUsersTotal;
  const totalUsersDeltaPercent =
    previousMonthUsersTotal > 0
      ? (totalUsersDelta / previousMonthUsersTotal) * 100
      : null;

  const weeklyDelta = currentWeekUsersCount - previousWeekUsersCount;
  const weeklyDeltaPercent =
    previousWeekUsersCount > 0
      ? (weeklyDelta / previousWeekUsersCount) * 100
      : null;

  const analysesDelta = currentMonthAnalysesCount - previousMonthAnalysesCount;
  const analysesDeltaPercent =
    previousMonthAnalysesCount > 0
      ? (analysesDelta / previousMonthAnalysesCount) * 100
      : null;
  const waitlistDelta = waitlistCurrentWeekCount - waitlistPreviousWeekCount;
  const waitlistDeltaPercent =
    waitlistPreviousWeekCount > 0
      ? (waitlistDelta / waitlistPreviousWeekCount) * 100
      : null;

  const marketingRate =
    consentTotalCount > 0 ? (marketingOptInCount / consentTotalCount) * 100 : 0;
  const improvementRate =
    consentTotalCount > 0 ? (improvementOptInCount / consentTotalCount) * 100 : 0;

  const dashboardMetrics: DashboardMetrics = {
    generatedAt: nowIso,
    totalUsers: {
      current: totalUsersCount,
      previous: previousMonthUsersTotal,
      delta: totalUsersDelta,
      deltaPercentage: totalUsersDeltaPercent,
    },
    weeklySignups: {
      current: currentWeekUsersCount,
      previous: previousWeekUsersCount,
      delta: weeklyDelta,
      deltaPercentage: weeklyDeltaPercent,
    },
    analyses: {
      current: currentMonthAnalysesCount,
      previous: previousMonthAnalysesCount,
      delta: analysesDelta,
      deltaPercentage: analysesDeltaPercent,
    },
    waitlist: {
      current: waitlistCurrentWeekCount,
      previous: waitlistPreviousWeekCount,
      delta: waitlistDelta,
      deltaPercentage: waitlistDeltaPercent,
    },
    consent: {
      marketing: {
        optedIn: marketingOptInCount,
        total: consentTotalCount,
        rate: marketingRate,
      },
      improvement: {
        optedIn: improvementOptInCount,
        total: consentTotalCount,
        rate: improvementRate,
      },
    },
  };

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
    generatedAt: nowIso,
  };

  if (error) {
    console.error('Erreur lors du chargement des messages:', error);
    return {
      props: {
        initialSession: session,
        messageStats: baseStats,
        dashboardMetrics,
      },
    };
  }

  const messages = data ?? [];
  const nowForMessages = new Date();

  const stats: MessageStats = {
    total: messages.length,
    active: messages.filter((message) => message.is_active).length,
    targeted: messages.filter(
      (message) =>
        Array.isArray(message.target_user_ids) && message.target_user_ids.length > 0
    ).length,
    upcoming: messages.filter((message) => {
      if (!message.start_date) return false;
      return new Date(message.start_date) > nowForMessages;
    }).length,
    lastMessageTitle: messages[0]?.title ?? null,
    lastMessageUpdatedAt: messages[0]?.updated_at ?? messages[0]?.created_at ?? null,
    generatedAt: nowIso,
  };

  return {
    props: {
      initialSession: session,
      messageStats: stats,
      dashboardMetrics,
    },
  };
};
