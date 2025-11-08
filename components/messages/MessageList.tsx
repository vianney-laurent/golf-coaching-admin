import { useMemo } from 'react';
import { classNames } from '../../lib/classNames';
import type { InAppMessage } from '../../types/in-app-messages';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { TagPill } from '../ui/TagPill';

type MessageListProps = {
  messages: InAppMessage[];
  onToggleActive: (id: string, currentStatus: boolean) => void;
  onDelete: (id: string) => void;
};

const formatDate = (value: string | null) => {
  if (!value) {
    return 'Sans date';
  }

  try {
    return new Date(value).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return 'Date invalide';
  }
};

const formatMessageType = (type: InAppMessage['type']) => {
  switch (type) {
    case 'banner':
      return 'Bannière';
    case 'overlay':
      return 'Overlay';
    default:
      return type;
  }
};

export function MessageList({
  messages,
  onToggleActive,
  onDelete,
}: MessageListProps) {
  const hasTargeting = useMemo(
    () => messages.some((message) => message.target_user_ids?.length),
    [messages]
  );

  if (messages.length === 0) {
    return (
      <div className="ms-empty-state">
        <div>
          <h2 className="ms-card__title">Aucun message pour le moment</h2>
          <p>
            Lancez votre première campagne in-app pour informer vos joueurs des
            nouveautés My Swing.
          </p>
        </div>
        <div className="ms-actions">
          <Button href="/messages/new">Créer un message</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="ms-table-wrapper" role="region" aria-live="polite">
        <table className="ms-table">
          <thead>
            <tr>
              <th>Message</th>
              <th>Type</th>
              <th>Priorité</th>
              <th>Statut</th>
              <th>Fenêtre</th>
              {hasTargeting ? <th>Ciblage</th> : null}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {messages.map((message) => (
              <tr key={message.id}>
                <td>
                  <div className="ms-section">
                    <div className="ms-card__title">{message.title}</div>
                    <div className="ms-meta">#{message.id.slice(0, 8)}</div>
                  </div>
                </td>
                <td>
                  <TagPill variant={message.type}>
                    {formatMessageType(message.type)}
                  </TagPill>
                </td>
                <td>
                  <Badge tone="neutral">{message.priority}</Badge>
                </td>
                <td>
                  <button
                    type="button"
                    onClick={() => onToggleActive(message.id, message.is_active)}
                    className={classNames(
                      'ms-status-toggle',
                      message.is_active
                        ? 'ms-status-toggle--active'
                        : 'ms-status-toggle--inactive'
                    )}
                    aria-pressed={message.is_active}
                  >
                    {message.is_active ? 'Actif' : 'Inactif'}
                  </button>
                </td>
                <td>
                  <div className="ms-section">
                    <span>{formatDate(message.start_date)}</span>
                    <span className="ms-meta">→ {formatDate(message.end_date)}</span>
                  </div>
                </td>
                {hasTargeting ? (
                  <td>
                    {message.target_user_ids?.length ? (
                      <Badge tone="success">
                        {message.target_user_ids.length} joueurs
                      </Badge>
                    ) : (
                      <Badge tone="neutral">Tous les joueurs</Badge>
                    )}
                  </td>
                ) : null}
                <td>
                  <div className="ms-actions">
                    <Button
                      href={`/messages/${message.id}/edit`}
                      variant="secondary"
                      size="sm"
                    >
                      Éditer
                    </Button>
                    <Button
                      onClick={() => onDelete(message.id)}
                      variant="danger"
                      size="sm"
                    >
                      Supprimer
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="ms-mobile-list">
        {messages.map((message) => (
          <article key={message.id} className="ms-mobile-card">
            <div className="ms-mobile-card__row">
              <div>
                <h3 className="ms-card__title">{message.title}</h3>
                <TagPill variant={message.type}>
                  {formatMessageType(message.type)}
                </TagPill>
              </div>
              <button
                type="button"
                onClick={() => onToggleActive(message.id, message.is_active)}
                className={classNames(
                  'ms-status-toggle',
                  message.is_active
                    ? 'ms-status-toggle--active'
                    : 'ms-status-toggle--inactive'
                )}
                aria-pressed={message.is_active}
              >
                {message.is_active ? 'Actif' : 'Inactif'}
              </button>
            </div>

            <div className="ms-mobile-card__row">
              <span className="ms-mobile-card__label">Priorité</span>
              <Badge tone="neutral">{message.priority}</Badge>
            </div>

            <div className="ms-mobile-card__row">
              <span className="ms-mobile-card__label">Fenêtre</span>
              <span className="ms-mobile-card__value">
                {formatDate(message.start_date)} → {formatDate(message.end_date)}
              </span>
            </div>

            {hasTargeting ? (
              <div className="ms-mobile-card__row">
                <span className="ms-mobile-card__label">Ciblage</span>
                {message.target_user_ids?.length ? (
                  <Badge tone="success">
                    {message.target_user_ids.length} joueurs ciblés
                  </Badge>
                ) : (
                  <Badge tone="neutral">Tous les joueurs</Badge>
                )}
              </div>
            ) : null}

            {message.requires_marketing_consent ? (
              <Badge tone="danger">Consentement requis</Badge>
            ) : null}

            <div className="ms-mobile-card__actions">
              <Button
                href={`/messages/${message.id}/edit`}
                variant="secondary"
                fullWidth
              >
                Éditer
              </Button>
              <Button
                onClick={() => onDelete(message.id)}
                variant="danger"
                fullWidth
              >
                Supprimer
              </Button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

