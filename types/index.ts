import { MessageDirection, MessageType } from "@/lib/constants";

export interface Message {
  id: string;
  odna: string;
  direction: MessageDirection;
  type: MessageType;
  text: string;
  imageUrl?: string;
  timestamp: number;
  webhookEventId?: string;
}

export interface Conversation {
  odna: string;
  lastMessage: Message;
  messages: Message[];
}

export interface UserProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}
