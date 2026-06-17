export interface WebhookProcessedResult {
  plugin: string;
  action: string;
  responseHeaders?: Record<string, string>;
  body?: {
    message?: {
      messageId?: string;
    };
  };
  response?: unknown;
}

export interface CorsairGmailMessageRow {
  data: {
    id?: string;
    labelIds?: string[];
    from?: string;
    subject?: string;
    snippet?: string;
    body?: string;
    internalDate?: string;
  };
}
