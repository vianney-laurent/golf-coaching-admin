import Head from 'next/head';
import type { AppProps } from 'next/app';
import type { Session } from '@supabase/supabase-js';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { useState } from 'react';
import '../styles/globals.css';

type AppPropsWithSession = AppProps<{
  initialSession: Session | null;
}>;

export default function App({ Component, pageProps }: AppPropsWithSession) {
  const [supabaseClient] = useState(() => createBrowserSupabaseClient());

  return (
    <>
      <Head>
        <meta name="robots" content="noindex, nofollow, noarchive" />
        <meta name="googlebot" content="noindex, nofollow, noarchive" />
      </Head>
      <SessionContextProvider
        supabaseClient={supabaseClient}
        initialSession={pageProps.initialSession}
      >
        <Component {...pageProps} />
      </SessionContextProvider>
    </>
  );
}

