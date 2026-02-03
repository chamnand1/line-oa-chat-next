export const MESSAGE_DIRECTION = {
  INCOMING: "incoming",
  OUTGOING: "outgoing",
} as const;

export type MessageDirection = typeof MESSAGE_DIRECTION[keyof typeof MESSAGE_DIRECTION];

export const MESSAGE_TYPE = {
  TEXT: "text",
  IMAGE: "image",
} as const;

export type MessageType = typeof MESSAGE_TYPE[keyof typeof MESSAGE_TYPE];

export const WEBHOOK_EVENT_TYPE = {
  MESSAGE: "message",
} as const;

export type WebhookEventType = typeof WEBHOOK_EVENT_TYPE[keyof typeof WEBHOOK_EVENT_TYPE];

export const LANGUAGE_LABEL = {
  th: "TH",
  en: "EN",
} as const;
