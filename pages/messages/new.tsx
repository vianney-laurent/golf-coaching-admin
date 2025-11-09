import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import type { GetServerSideProps } from 'next';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { InAppMessageFormData } from '../../types/in-app-messages';
import { requireAdminSession } from '../../lib/auth';
import { AppShell } from '../../components/layout/AppShell';
import { Button } from '../../components/ui/Button';

export default function NewMessage() {
  const router = useRouter();
  const supabase = useSupabaseClient();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<InAppMessageFormData>({
    title: '',
    content: '',
    content_type: 'text',
    type: 'banner',
    priority: 0,
    requires_marketing_consent: false,
    is_active: true,
  });

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.status === 401 || response.status === 403) {
        await handleSignOut();
        return;
      }

      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error ?? 'Erreur inconnue');
      }

      router.push('/');
    } catch (error) {
      console.error('Error creating message:', error);
      alert('Erreur lors de la création du message');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        let userIds: string[] = [];

        if (file.name.endsWith('.json')) {
          const data = JSON.parse(text);
          userIds = Array.isArray(data) ? data : data.userIds || [];
        } else if (file.name.endsWith('.csv')) {
          const lines = text.split('\n');
          userIds = lines
            .map((line) => line.trim())
            .filter((line) => line.length > 0);
        }

        setFormData((previous) => ({
          ...previous,
          target_user_ids: userIds,
        }));
        alert(`${userIds.length} userIds chargés`);
      } catch (error) {
        alert('Erreur lors du chargement du fichier');
      }
    };
    reader.readAsText(file);
  };

  return (
    <>
      <Head>
        <title>Nouveau Message - Admin</title>
      </Head>
      <AppShell
        title="Nouveau message"
        description="Diffusez un message ciblé sur l’application My Swing avec une structure prête à dupliquer."
        breadcrumbs={[
          { label: 'Messages', href: '/' },
          { label: 'Nouveau message' },
        ]}
        actions={
          <Button href="/" variant="secondary">
            Retour à la liste
          </Button>
        }
        headerActions={
          <Button variant="ghost" onClick={handleSignOut}>
            Déconnexion
          </Button>
        }
      >
        <div className="ms-card">
          <form onSubmit={handleSubmit} className="ms-form">
            <section className="ms-section">
              <h2 className="ms-section__title">Contenu du message</h2>
              <p className="ms-section__description">
                Rédigez les informations qui seront affichées dans l’application mobile.
              </p>

              <div className="ms-field">
                <label htmlFor="title" className="ms-field__label">
                  Titre *
                </label>
                <input
                  id="title"
                  type="text"
                  required
                  className="ms-input"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                />
              </div>

              <div className="ms-field">
                <label htmlFor="content" className="ms-field__label">
                  Contenu *
                </label>
                <textarea
                  id="content"
                  required
                  rows={6}
                  className="ms-textarea"
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                />
                <span className="ms-field__hint">
                  Support {formData.content_type === 'markdown' ? 'Markdown' : formData.content_type.toUpperCase()} disponible.
                </span>
              </div>

              <div className="ms-form__grid ms-form__grid--two">
                <div className="ms-field">
                  <label htmlFor="contentType" className="ms-field__label">
                    Type de contenu
                  </label>
                  <select
                    id="contentType"
                    className="ms-select"
                    value={formData.content_type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        content_type: e.target.value as InAppMessageFormData['content_type'],
                      })
                    }
                  >
                    <option value="text">Texte</option>
                    <option value="html">HTML</option>
                    <option value="markdown">Markdown</option>
                  </select>
                </div>

                <div className="ms-field">
                  <label htmlFor="displayType" className="ms-field__label">
                    Type d&apos;affichage
                  </label>
                  <select
                    id="displayType"
                    className="ms-select"
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        type: e.target.value as InAppMessageFormData['type'],
                      })
                    }
                  >
                    <option value="banner">Bannière</option>
                    <option value="overlay">Overlay</option>
                  </select>
                </div>
              </div>

              <div className="ms-field">
                <label htmlFor="imageUrl" className="ms-field__label">
                  URL de l&apos;image (optionnel)
                </label>
                <input
                  id="imageUrl"
                  type="url"
                  className="ms-input"
                  placeholder="https://..."
                  value={formData.image_url || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, image_url: e.target.value })
                  }
                />
              </div>
            </section>

            <section className="ms-section">
              <h2 className="ms-section__title">Diffusion & ciblage</h2>
              <p className="ms-section__description">
                Paramétrez l’ordre d’affichage et les audiences ciblées pour la campagne.
              </p>

              <div className="ms-form__grid ms-form__grid--two">
                <div className="ms-field">
                  <label htmlFor="priority" className="ms-field__label">
                    Priorité
                  </label>
                  <input
                    id="priority"
                    type="number"
                    className="ms-input"
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        priority: Number.isNaN(parseInt(e.target.value, 10))
                          ? 0
                          : parseInt(e.target.value, 10),
                      })
                    }
                  />
                  <span className="ms-field__hint">
                    Plus la valeur est élevée, plus le message sera mis en avant.
                  </span>
                </div>

                <div className="ms-field">
                  <label htmlFor="targetFile" className="ms-field__label">
                    Ciblage (CSV ou JSON)
                  </label>
                  <input
                    id="targetFile"
                    type="file"
                    className="ms-input"
                    accept=".csv,.json"
                    onChange={handleFileUpload}
                  />
                  <span className="ms-field__hint">
                    {formData.target_user_ids && formData.target_user_ids.length > 0
                      ? `${formData.target_user_ids.length} userIds chargés`
                      : 'Laissez vide pour s’adresser à tous les joueurs.'}
                  </span>
                </div>
              </div>

              <label className="ms-checkbox">
                <input
                  type="checkbox"
                  checked={formData.requires_marketing_consent}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      requires_marketing_consent: e.target.checked,
                    })
                  }
                />
                <span>Requiert le consentement marketing</span>
              </label>

              <div className="ms-form__grid ms-form__grid--two">
                <div className="ms-field">
                  <label htmlFor="startDate" className="ms-field__label">
                    Date de début (optionnel)
                  </label>
                  <input
                    id="startDate"
                    type="datetime-local"
                    className="ms-input"
                    value={formData.start_date ? formData.start_date.slice(0, 16) : ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        start_date: e.target.value
                          ? new Date(e.target.value).toISOString()
                          : undefined,
                      })
                    }
                  />
                </div>
                <div className="ms-field">
                  <label htmlFor="endDate" className="ms-field__label">
                    Date de fin (optionnel)
                  </label>
                  <input
                    id="endDate"
                    type="datetime-local"
                    className="ms-input"
                    value={formData.end_date ? formData.end_date.slice(0, 16) : ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        end_date: e.target.value
                          ? new Date(e.target.value).toISOString()
                          : undefined,
                      })
                    }
                  />
                </div>
              </div>

              <label className="ms-checkbox">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData({ ...formData, is_active: e.target.checked })
                  }
                />
                <span>Activer le message dès sa création</span>
              </label>
            </section>

            <section className="ms-section">
              <h2 className="ms-section__title">Action optionnelle</h2>
              <p className="ms-section__description">
                Ajoutez un bouton pour rediriger vos utilisateurs vers une page précise.
              </p>

              <div className="ms-form__grid ms-form__grid--two">
                <div className="ms-field">
                  <label htmlFor="actionUrl" className="ms-field__label">
                    URL d&apos;action
                  </label>
                  <input
                    id="actionUrl"
                    type="url"
                    className="ms-input"
                    placeholder="https://myswing.app/..."
                    value={formData.action_url || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, action_url: e.target.value })
                    }
                  />
                </div>
                <div className="ms-field">
                  <label htmlFor="actionLabel" className="ms-field__label">
                    Label du bouton
                  </label>
                  <input
                    id="actionLabel"
                    type="text"
                    className="ms-input"
                    placeholder="Découvrir"
                    value={formData.action_label || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, action_label: e.target.value })
                    }
                  />
                </div>
              </div>
            </section>

            <div className="ms-actions">
              <Button type="submit" disabled={loading}>
                {loading ? 'Création...' : 'Créer le message'}
              </Button>
              <Button href="/" variant="ghost">
                Annuler
              </Button>
            </div>
          </form>
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

