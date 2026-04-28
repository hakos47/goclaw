export interface PendingMessageGroup {
  channel_name: string;
  history_key: string;
  group_title?: string;
  message_count: number;
  last_activity: string;
  has_summary: boolean;
}

export interface PendingMessage {
  id: string;
  sender_id: string;
  sender_name?: string;
  content: string;
  timestamp: string;
  metadata?: Record<string, any>;
}
