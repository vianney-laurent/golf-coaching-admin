export interface InAppMessage {
  id: string;
  title: string;
  content: string;
  content_type: 'text' | 'html' | 'markdown';
  image_url: string | null;
  type: 'banner' | 'overlay';
  priority: number;
  target_user_ids: string[] | null;
  requires_marketing_consent: boolean;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  action_url: string | null;
  action_label: string | null;
  created_at: string;
  updated_at: string;
}

export interface InAppMessageView {
  id: string;
  message_id: string;
  user_id: string;
  viewed_at: string;
  dismissed: boolean;
  dismissed_at: string | null;
}

export interface InAppMessageFormData {
  title: string;
  content: string;
  content_type: 'text' | 'html' | 'markdown';
  image_url?: string;
  type: 'banner' | 'overlay';
  priority: number;
  target_user_ids?: string[];
  requires_marketing_consent: boolean;
  start_date?: string;
  end_date?: string;
  is_active: boolean;
  action_url?: string;
  action_label?: string;
}

export interface MessageStats {
  message_id: string;
  total_views: number;
  total_dismissed: number;
  unique_users: number;
}

