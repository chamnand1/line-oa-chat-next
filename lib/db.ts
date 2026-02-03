import { supabase } from "@/lib/supabase";
import { Message } from "@/types";

export const db = {
  getMessages: async (): Promise<Message[]> => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('timestamp', { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
      return [];
    }

    return data.map((row: any) => ({
      id: row.id,
      odna: row.odna,
      direction: row.direction,
      type: row.type,
      text: row.text,
      imageUrl: row.image_url,
      timestamp: Number(row.timestamp),
      webhookEventId: row.webhook_event_id,
    }));
  },

  addMessage: async (message: Message): Promise<Message> => {

    const { error } = await supabase
      .from('messages')
      .upsert({
        id: message.id,
        odna: message.odna,
        direction: message.direction,
        type: message.type,
        text: message.text,
        image_url: message.imageUrl,
        webhook_event_id: message.webhookEventId,
        timestamp: message.timestamp,
      });

    if (error) {
      console.error("Error adding message:", error);
      throw error;
    }

    return message;
  },
};
