export interface Automation {
  id: string;
  post_id: string;
  post_caption: string | null;
  post_thumbnail: string | null;
  trigger_keyword: string;
  reply_comment_text: string | null;
  button_text: string;
  resource_url: string;
  require_follow: boolean;
  is_active: boolean;
  created_at: string;
}

export interface AutomationUpsertInput {
  post_id: string;
  post_caption: string | null;
  post_thumbnail: string | null;
  trigger_keyword: string;
  reply_comment_text: string | null;
  button_text: string;
  resource_url: string;
  require_follow: boolean;
  is_active: boolean;
}

export interface InstagramMediaItem {
  id: string;
  caption?: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM" | string;
  media_url?: string;
  thumbnail_url?: string;
  permalink?: string;
}

export interface MetaCommentChangeValue {
  id?: string;
  text?: string;
  from?: {
    id?: string;
    username?: string;
  };
  media?: {
    id?: string;
    media_product_type?: string;
  };
}

export interface MetaWebhookChange {
  field: string;
  value: MetaCommentChangeValue;
}

export interface MetaMessagingEvent {
  sender?: {
    id?: string;
  };
  recipient?: {
    id?: string;
  };
  timestamp?: number;
  postback?: {
    title?: string;
    payload?: string;
    mid?: string;
  };
}

export interface MetaWebhookEntry {
  id?: string;
  time?: number;
  changes?: MetaWebhookChange[];
  messaging?: MetaMessagingEvent[];
}

export interface MetaWebhookPayload {
  object?: string;
  entry?: MetaWebhookEntry[];
}

