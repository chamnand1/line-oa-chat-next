import { useEffect } from "react";
import { useChatStore } from "@/stores";
import { messageService } from "@/services";
import { config } from "@/lib/config";

export function useMessages() {
  const { messages, setMessages, addMessage } = useChatStore();

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const data = await messageService.getAll();
        setMessages(data);
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, config.pollingInterval);
    return () => clearInterval(interval);
  }, [setMessages]);

  const sendMessage = async (odna: string, text: string) => {
    try {
      const newMsg = await messageService.send(odna, text);
      addMessage(newMsg);
      return newMsg;
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  };

  return { messages, sendMessage };
}
