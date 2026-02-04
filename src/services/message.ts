import { Message } from "@/src/types";
import { config } from "@/src/lib/config";

const API_BASE = "/api";

interface PaginatedMessages {
  messages: Message[];
  hasMore: boolean;
}

export const messageService = {
  getByUser: async (
    odna: string,
    limit: number = config.pagination.messagesPerPage,
    before?: number
  ): Promise<PaginatedMessages> => {
    const params = new URLSearchParams({ odna, limit: limit.toString() });
    if (before) params.append('before', before.toString());

    const res = await fetch(`${API_BASE}/messages?${params}`);
    if (!res.ok) throw new Error("Failed to fetch messages");
    return res.json();
  },

  getRecent: async (limit: number = config.pagination.messagesPerPage): Promise<PaginatedMessages> => {
    const params = new URLSearchParams({ limit: limit.toString() });
    const res = await fetch(`${API_BASE}/messages?${params}`);
    if (!res.ok) throw new Error("Failed to fetch messages");
    return res.json();
  },

  send: async (odna: string, text: string, type: string = "text", imageUrl?: string): Promise<Message> => {
    const res = await fetch(`${API_BASE}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ odna, text, type, imageUrl }),
    });
    if (!res.ok) throw new Error("Failed to send message");
    return res.json();
  },
};
