import { Message } from "@/types";

const API_BASE = "/api";

export const messageService = {
  getAll: async (): Promise<Message[]> => {
    const res = await fetch(`${API_BASE}/messages`);
    if (!res.ok) throw new Error("Failed to fetch messages");
    return res.json();
  },

  send: async (odna: string, text: string): Promise<Message> => {
    const res = await fetch(`${API_BASE}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ odna, text }),
    });
    if (!res.ok) throw new Error("Failed to send message");
    return res.json();
  },
};
