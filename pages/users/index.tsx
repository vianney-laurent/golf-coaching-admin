import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import Head from 'next/head';
import type { GetServerSideProps } from 'next';
import { requireAdminSession } from '../../lib/auth';
import { supabaseAdmin } from '../../lib/supabase-admin';
import { AppShell } from '../../components/layout/AppShell';
import { Button } from '../../components/ui/Button';

type UserProfile = Record<string, any> & { id: string };

type UsersPageProps = {
  initialProfiles: UserProfile[];
  initialError?: string | null;
};

type Feedback = {
  type: 'success' | 'error';
  message: string;
};

type EditableField = {
  key: string;
  label: string;
  type: 'text' | 'number' | 'boolean';
};

const NON_EDITABLE_FIELDS = new Set(['id', 'created_at', 'updated_at']);

const humanizeKey = (key: string) =>
  key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

const formatDate = (value: unknown) => {
  if (!value) {
    return '—';
  }
  try {
    const date = new Date(value as string);
    if (Number.isNaN(date.getTime())) {
      return '—';
    }
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  } catch {
    return '—';
  }
};

const getProfileEmail = (profile: UserProfile) => {
  if (typeof profile.email === 'string' && profile.email.length > 0) {
    return profile.email;
  }
  if (typeof profile.username === 'string' && profile.username.includes('@')) {
    return profile.username;
  }
  if (
    typeof profile.raw_user_meta_data === 'object' &&
    profile.raw_user_meta_data &&
    'email' in profile.raw_user_meta_data
  ) {
    return (profile.raw_user_meta_data as Record<string, unknown>).email as string;
  }
  return '—';
};

const getProfileName = (profile: UserProfile) => {
  const extractString = (value: unknown) =>
    typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;

  const pickFromSources = (keys: string[]) => {
    for (const key of keys) {
      const direct = extractString(profile[key]);
      if (direct) {
        return direct;
      }
      if (
        typeof profile.raw_user_meta_data === 'object' &&
        profile.raw_user_meta_data !== null
      ) {
        const metaValue = extractString(
          (profile.raw_user_meta_data as Record<string, unknown>)[key]
        );
        if (metaValue) {
          return metaValue;
        }
      }
    }
    return null;
  };

  const fullName = pickFromSources(['full_name', 'fullName', 'name', 'display_name']);
  if (fullName) {
    return fullName;
  }

  const firstName = pickFromSources([
    'first_name',
    'firstName',
    'prenom',
    'given_name',
    'givenName',
  ]);
  const lastName = pickFromSources([
    'last_name',
    'lastName',
    'nom',
    'family_name',
    'familyName',
  ]);

  if (firstName && lastName) {
    return `${firstName} ${lastName}`.trim();
  }
  if (firstName) {
    return firstName;
  }
  if (lastName) {
    return lastName;
  }

  return 'Nom non renseigné';
};

const getProfileStatus = (profile: UserProfile) => {
  if (typeof profile.status === 'string') {
    return humanizeKey(profile.status);
  }
  if (typeof profile.is_active === 'boolean') {
    return profile.is_active ? 'Actif' : 'Inactif';
  }
  return '—';
};

const buildEditableFields = (profile: UserProfile): EditableField[] =>
  Object.entries(profile)
    .filter(([key, value]) => {
      if (NON_EDITABLE_FIELDS.has(key)) {
        return false;
      }
      if (value === null || value === undefined) {
        return true;
      }
      const valueType = typeof value;
      return valueType === 'string' || valueType === 'number' || valueType === 'boolean';
    })
    .map(([key, value]) => {
      let type: EditableField['type'] = 'text';
      if (typeof value === 'number') {
        type = 'number';
      } else if (typeof value === 'boolean') {
        type = 'boolean';
      }
      return {
        key,
        label: humanizeKey(key),
        type,
      };
    });

const buildFormValues = (
  profile: UserProfile,
  fields: EditableField[]
): Record<string, string | boolean> =>
  fields.reduce<Record<string, string | boolean>>((acc, field) => {
    const rawValue = profile[field.key];
    if (field.type === 'boolean') {
      acc[field.key] = Boolean(rawValue);
    } else if (rawValue === null || rawValue === undefined) {
      acc[field.key] = '';
    } else {
      acc[field.key] = String(rawValue);
    }
    return acc;
  }, {});

const serialiseProfiles = (profiles: any[] | null | undefined): UserProfile[] =>
  profiles
    ? profiles.map((profile) => JSON.parse(JSON.stringify(profile)))
    : [];

export default function UsersPage({ initialProfiles, initialError }: UsersPageProps) {
  const [profiles, setProfiles] = useState<UserProfile[]>(initialProfiles);
  const [editingProfile, setEditingProfile] = useState<UserProfile | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string | boolean>>({});
  const [feedback, setFeedback] = useState<Feedback | null>(
    initialError ? { type: 'error', message: initialError } : null
  );
  const [saving, setSaving] = useState(false);
  const [resettingId, setResettingId] = useState<string | null>(null);

  const editableFields = useMemo(
    () => (editingProfile ? buildEditableFields(editingProfile) : []),
    [editingProfile]
  );

  const editingDisplayName = useMemo(
    () => (editingProfile ? getProfileName(editingProfile) : ''),
    [editingProfile]
  );

  const editingSummary = useMemo(() => {
    if (!editingProfile) {
      return '';
    }
    return `ID ${editingProfile.id} • Dernière mise à jour ${formatDate(
      editingProfile.updated_at ?? editingProfile.created_at
    )}`;
  }, [editingProfile]);

  const closeModal = useCallback(() => {
    setEditingProfile(null);
    setFormValues({});
    setSaving(false);
  }, []);

  useEffect(() => {
    if (!editingProfile) {
      setFormValues({});
      return;
    }
    setFormValues(buildFormValues(editingProfile, editableFields));
  }, [editingProfile, editableFields]);

  useEffect(() => {
    if (!editingProfile) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeModal();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [editingProfile, closeModal]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    if (!editingProfile) {
      return;
    }
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [editingProfile]);

  const handleOpenEdit = (profile: UserProfile) => {
    setEditingProfile(profile);
    setFeedback(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingProfile) {
      return;
    }

    setSaving(true);
    setFeedback(null);

    try {
      const updates = editableFields.reduce<Record<string, unknown>>((acc, field) => {
        const formValue = formValues[field.key];

        if (field.type === 'boolean') {
          acc[field.key] = Boolean(formValue);
        } else if (field.type === 'number') {
          const stringValue = typeof formValue === 'string' ? formValue : '';
          acc[field.key] =
            stringValue.trim().length === 0 ? null : Number.parseFloat(stringValue);
        } else {
          const stringValue = typeof formValue === 'string' ? formValue.trim() : '';
          acc[field.key] = stringValue.length === 0 ? null : stringValue;
        }

        return acc;
      }, {});

      const response = await fetch(`/api/users/${editingProfile.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ updates }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        const message =
          (errorBody && typeof errorBody.error === 'string'
            ? errorBody.error
            : null) ?? 'Impossible de mettre à jour le profil.';
        throw new Error(message);
      }

      const payload = await response.json();
      const updatedProfile: UserProfile =
        payload?.profile && typeof payload.profile === 'object'
          ? payload.profile
          : null;

      if (!updatedProfile) {
        throw new Error('La réponse du serveur est invalide.');
      }

      setProfiles((current) =>
        current.map((profile) =>
          profile.id === updatedProfile.id ? updatedProfile : profile
        )
      );
      setFeedback({
        type: 'success',
        message: 'Profil mis à jour avec succès.',
      });
      closeModal();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Une erreur inconnue est survenue.';
      setFeedback({
        type: 'error',
        message,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResetForm = () => {
    if (!editingProfile) {
      return;
    }
    setFormValues(buildFormValues(editingProfile, editableFields));
  };

  const handleResetPassword = async (profile: UserProfile) => {
    const profileName = getProfileName(profile);
    const fallbackEmail = getProfileEmail(profile);
    const label =
      profileName !== 'Nom non renseigné'
        ? profileName
        : fallbackEmail !== '—'
        ? fallbackEmail
        : profile.id;

    if (typeof window !== 'undefined') {
      const confirmed = window.confirm(
        `Voulez-vous vraiment réinitialiser le mot de passe de ${label} ?`
      );
      if (!confirmed) {
        return;
      }
    }

    setResettingId(profile.id);
    setFeedback(null);

    try {
      const response = await fetch(`/api/users/${profile.id}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        const message =
          (errorBody && typeof errorBody.error === 'string'
            ? errorBody.error
            : null) ?? 'Impossible de réinitialiser le mot de passe.';
        throw new Error(message);
      }

      setFeedback({
        type: 'success',
        message: 'Un e-mail de réinitialisation a été envoyé à l’utilisateur.',
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Une erreur inconnue est survenue.';
      setFeedback({
        type: 'error',
        message,
      });
    } finally {
      setResettingId(null);
    }
  };

  return (
    <>
      <Head>
        <title>Admin - Gestion utilisateurs</title>
        <meta
          name="description"
          content="Gérez les profils Supabase, modifiez leurs informations et lancez une réinitialisation de mot de passe."
        />
      </Head>

      <AppShell
        title="Gestion des utilisateurs"
        description="Supervisez la table `profiles`, mettez à jour les informations clés et gérez les accès en un clin d’œil."
        breadcrumbs={[
          { label: 'Accueil', href: '/' },
          { label: 'Gestion utilisateurs' },
          ]}
      >
        {feedback ? (
          <div
            className={`ms-alert ${
              feedback.type === 'error' ? 'ms-alert--error' : 'ms-alert--success'
            }`}
          >
            {feedback.message}
          </div>
        ) : null}

        <div className="ms-card">
            <div className="ms-card__header">
              <h2 className="ms-card__title">Profils Supabase</h2>
              <p className="ms-card__meta">
                Liste des comptes présents dans la table <code>profiles</code>. Utilisez le bouton
                « Modifier » pour ouvrir une modale d’édition rapide ou réinitialisez un mot de passe
                en un clic.
              </p>
            </div>

          {profiles.length === 0 ? (
            <div className="ms-empty-state">
              <p>Aucun utilisateur enregistré pour le moment.</p>
              <p>
                Vérifiez votre base Supabase ou créez un nouvel utilisateur pour le voir apparaître ici.
              </p>
            </div>
          ) : (
            <>
              <div
                className="ms-table-wrapper ms-users-table-wrapper"
                role="region"
                aria-live="polite"
              >
                <table className="ms-table">
                  <thead>
                    <tr>
                      <th>Utilisateur</th>
                      <th>Email</th>
                      <th>Statut</th>
                      <th>Mise à jour</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                    <tbody>
                      {profiles.map((profile) => {
                        const displayName = getProfileName(profile);

                        return (
                          <tr key={profile.id} className="ms-users-table-row">
                            <td>
                              <div
                                style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}
                              >
                                <span style={{ fontWeight: 600 }}>{displayName}</span>
                                <span className="ms-meta">{profile.id}</span>
                              </div>
                            </td>
                            <td>{getProfileEmail(profile)}</td>
                            <td>{getProfileStatus(profile)}</td>
                            <td>{formatDate(profile.updated_at ?? profile.created_at)}</td>
                            <td>
                              <div className="ms-actions">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => handleOpenEdit(profile)}
                                >
                                  Modifier
                                </Button>
                                <Button
                                  size="sm"
                                  variant="danger"
                                  disabled={resettingId === profile.id}
                                  onClick={() => handleResetPassword(profile)}
                                >
                                  {resettingId === profile.id
                                    ? 'Réinitialisation...'
                                    : 'Reset mot de passe'}
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                </table>
              </div>
              <div className="ms-users-mobile-list" aria-live="polite">
                  {profiles.map((profile) => {
                    const displayName = getProfileName(profile);

                    return (
                      <div key={`${profile.id}-mobile`} className="ms-mobile-card">
                        <div className="ms-mobile-card__row">
                          <div>
                            <div
                              className="ms-mobile-card__value"
                              style={{ marginBottom: '0.35rem' }}
                            >
                              {displayName}
                            </div>
                            <div className="ms-meta">{profile.id}</div>
                          </div>
                          <span className="ms-badge ms-badge--neutral">Profil</span>
                        </div>

                        <div className="ms-mobile-card__row">
                          <div>
                            <div className="ms-mobile-card__label">Email</div>
                            <div className="ms-mobile-card__value">{getProfileEmail(profile)}</div>
                          </div>
                        </div>

                        <div className="ms-mobile-card__row">
                          <div>
                            <div className="ms-mobile-card__label">Statut</div>
                            <div className="ms-mobile-card__value">{getProfileStatus(profile)}</div>
                          </div>
                          <div>
                            <div className="ms-mobile-card__label">Mis à jour</div>
                            <div className="ms-mobile-card__value">
                              {formatDate(profile.updated_at ?? profile.created_at)}
                            </div>
                          </div>
                        </div>

                        <div className="ms-mobile-card__actions">
                          <Button size="sm" variant="secondary" onClick={() => handleOpenEdit(profile)}>
                            Modifier
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            disabled={resettingId === profile.id}
                            onClick={() => handleResetPassword(profile)}
                          >
                            {resettingId === profile.id
                              ? 'Réinitialisation...'
                              : 'Reset mot de passe'}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </>
          )}
        </div>
          {editingProfile ? (
            <div
              className="ms-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="edit-user-modal-title"
            >
              <div
                className="ms-modal__backdrop"
                onClick={closeModal}
                aria-hidden="true"
              />
              <div className="ms-modal__dialog">
                <div className="ms-modal__header">
                  <div>
                    <h2 className="ms-modal__title" id="edit-user-modal-title">
                      Modifier {editingDisplayName}
                    </h2>
                    <p className="ms-modal__subtitle">{editingSummary}</p>
                  </div>
                  <button
                    type="button"
                    className="ms-modal__close"
                    onClick={closeModal}
                    aria-label="Fermer la modale d’édition"
                  >
                    <span aria-hidden="true">&times;</span>
                  </button>
                </div>

                {editableFields.length === 0 ? (
                  <div className="ms-empty-state">
                    <p>Aucun champ modifiable détecté pour ce profil.</p>
                    <p>Vous pouvez néanmoins réinitialiser son mot de passe.</p>
                    <div
                      className="ms-actions"
                      style={{ justifyContent: 'flex-end', marginTop: '1rem' }}
                    >
                      <Button
                        type="button"
                        variant="danger"
                        disabled={resettingId === editingProfile.id}
                        onClick={() => handleResetPassword(editingProfile)}
                      >
                        {resettingId === editingProfile.id
                          ? 'Réinitialisation...'
                          : 'Reset mot de passe'}
                      </Button>
                      <Button type="button" variant="ghost" onClick={closeModal}>
                        Fermer
                      </Button>
                    </div>
                  </div>
                ) : (
                  <form className="ms-form" onSubmit={handleSubmit}>
                    <div className="ms-form__grid ms-form__grid--two">
                      {editableFields.map((field) => (
                        <label key={field.key} className="ms-field">
                          <span className="ms-field__label">{field.label}</span>

                          {field.type === 'boolean' ? (
                            <label className="ms-checkbox">
                              <input
                                type="checkbox"
                                checked={Boolean(formValues[field.key])}
                                onChange={(event) =>
                                  setFormValues((current) => ({
                                    ...current,
                                    [field.key]: event.target.checked,
                                  }))
                                }
                              />
                              <span>Activer</span>
                            </label>
                          ) : (
                            <input
                              className="ms-input"
                              type={field.type === 'number' ? 'number' : 'text'}
                              value={
                                typeof formValues[field.key] === 'string'
                                  ? (formValues[field.key] as string)
                                  : ''
                              }
                              onChange={(event) =>
                                setFormValues((current) => ({
                                  ...current,
                                  [field.key]: event.target.value,
                                }))
                              }
                            />
                          )}
                        </label>
                      ))}
                    </div>

                    <div className="ms-actions">
                      <Button type="submit" disabled={saving}>
                        {saving ? 'Enregistrement...' : 'Enregistrer'}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={handleResetForm}
                        disabled={saving}
                      >
                        Réinitialiser
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        disabled={resettingId === editingProfile.id}
                        onClick={() => handleResetPassword(editingProfile)}
                      >
                        {resettingId === editingProfile.id
                          ? 'Réinitialisation...'
                          : 'Reset mot de passe'}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          ) : null}
        </AppShell>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<UsersPageProps> = async (context) => {
  const adminSession = await requireAdminSession(context);
  if (!('session' in adminSession)) {
    return adminSession;
  }

  const { session } = adminSession;
  let initialError: string | null = null;
  let initialProfiles: UserProfile[] = [];

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    initialError =
      "Impossible de charger les utilisateurs depuis Supabase. Réessayez plus tard ou vérifiez les logs serveur.";
    console.error('Erreur Supabase (profiles):', error);
  } else {
    initialProfiles = serialiseProfiles(data);
  }

  return {
    props: {
      initialSession: session,
      initialProfiles,
      initialError,
    },
  };
};

