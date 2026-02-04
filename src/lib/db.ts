import { supabase } from "@/src/lib/supabase";
import { Message } from "@/src/types";
import { config } from "@/src/lib/config";

export const db = {
  getMessages: async (
    odna?: string,
    limit: number = config.pagination.messagesPerPage,
    beforeTimestamp?: number
  ): Promise<{ messages: Message[]; hasMore: boolean }> => {
    let query = supabase
      .from(config.supabase.tableName)
      .select('*');

    if (odna) {
      query = query.eq('odna', odna);
    }

    if (beforeTimestamp) {
      query = query.lt('timestamp', beforeTimestamp);
    }

    query = query
      .order('timestamp', { ascending: false })
      .limit(limit + 1);

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching messages:", error);
      return { messages: [], hasMore: false };
    }

    const hasMore = data.length > limit;
    const messages = data.slice(0, limit).map((row: any) => ({
      id: row.id,
      odna: row.odna,
      direction: row.direction,
      type: row.type,
      text: row.text,
      imageUrl: row.image_url,
      timestamp: Number(row.timestamp),
      webhookEventId: row.webhook_event_id,
    }));

    return { messages: messages.reverse(), hasMore };
  },

  addMessage: async (message: Message): Promise<Message> => {

    const { error } = await supabase
      .from(config.supabase.tableName)
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
