import { useEffect } from "react";
import { useChatStore } from "@/stores";
import { messageService } from "@/services";
import { config } from "@/lib/config";

export function useMessages() {
  const {
    recentMessages,
    loadRecentMessages,
    addMessage
  } = useChatStore();

  useEffect(() => {
    loadRecentMessages();
    const interval = setInterval(loadRecentMessages, config.pollingInterval);
    return () => clearInterval(interval);
  }, []);

  const sendMessage = async (odna: string, text: string, type?: string, imageUrl?: string) => {
    try {
      const newMsg = await messageService.send(odna, text, type, imageUrl);
      addMessage(newMsg);
      return newMsg;
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  };

  return { messages: recentMessages, sendMessage };
}
