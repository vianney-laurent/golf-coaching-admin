import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { supabaseAdmin } from '../../lib/supabase-admin';
import { InAppMessageFormData } from '../../types/in-app-messages';
import Link from 'next/link';

export default function NewMessage() {
  const router = useRouter();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabaseAdmin.from('in_app_messages').insert({
        ...formData,
        target_user_ids: formData.target_user_ids?.length ? formData.target_user_ids : null,
        image_url: formData.image_url || null,
        action_url: formData.action_url || null,
        action_label: formData.action_label || null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
      });

      if (error) throw error;
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

        setFormData({ ...formData, target_user_ids: userIds });
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
      <main style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem' }}>
          <Link href="/" style={{ color: '#3b82f6', textDecoration: 'none' }}>
            ← Retour à la liste
          </Link>
        </div>

        <h1>Nouveau Message</h1>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
              Titre *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '6px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
              Contenu *
            </label>
            <textarea
              required
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={6}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '6px', fontFamily: 'inherit' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
              Type de contenu
            </label>
            <select
              value={formData.content_type}
              onChange={(e) => setFormData({ ...formData, content_type: e.target.value as any })}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '6px' }}
            >
              <option value="text">Texte</option>
              <option value="html">HTML</option>
              <option value="markdown">Markdown</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
              Type d'affichage
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '6px' }}
            >
              <option value="banner">Bannière</option>
              <option value="overlay">Overlay</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
              URL de l'image (optionnel)
            </label>
            <input
              type="url"
              value={formData.image_url || ''}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '6px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
              Priorité
            </label>
            <input
              type="number"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '6px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
              Ciblage par userIds (CSV/JSON)
            </label>
            <input
              type="file"
              accept=".csv,.json"
              onChange={handleFileUpload}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '6px' }}
            />
            {formData.target_user_ids && formData.target_user_ids.length > 0 && (
              <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#64748b' }}>
                {formData.target_user_ids.length} userIds chargés
              </p>
            )}
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.requires_marketing_consent}
                onChange={(e) => setFormData({ ...formData, requires_marketing_consent: e.target.checked })}
              />
              <span>Nécessite le consentement marketing</span>
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                Date de début (optionnel)
              </label>
              <input
                type="datetime-local"
                value={formData.start_date ? formData.start_date.slice(0, 16) : ''}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '6px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                Date de fin (optionnel)
              </label>
              <input
                type="datetime-local"
                value={formData.end_date ? formData.end_date.slice(0, 16) : ''}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '6px' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
              URL d'action (optionnel)
            </label>
            <input
              type="url"
              value={formData.action_url || ''}
              onChange={(e) => setFormData({ ...formData, action_url: e.target.value })}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '6px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
              Label du bouton d'action (optionnel)
            </label>
            <input
              type="text"
              value={formData.action_label || ''}
              onChange={(e) => setFormData({ ...formData, action_label: e.target.value })}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '6px' }}
            />
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              />
              <span>Message actif</span>
            </label>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#10b981',
                color: 'white',
                borderRadius: '8px',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? 'Création...' : 'Créer le message'}
            </button>
            <Link
              href="/"
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#94a3b8',
                color: 'white',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: '600',
                display: 'inline-block',
              }}
            >
              Annuler
            </Link>
          </div>
        </form>
      </main>
    </>
  );
}

