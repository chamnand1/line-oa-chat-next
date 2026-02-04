"use client";

import { useEffect, useCallback } from "react";
import { useChatStore } from "@/src/stores";
import { messageService } from "@/src/services";
import { config } from "@/src/lib/config";

/**
 * Hook to handle polling of recent messages.
 * Should be used once in a high-level layout.
 */
export function useMessagesPolling() {
  const { loadRecentMessages } = useChatStore();

  useEffect(() => {
    loadRecentMessages();
    const interval = setInterval(loadRecentMessages, config.pollingInterval);
    return () => clearInterval(interval);
  }, [loadRecentMessages]);
}

/**
 * Hook to interact with messages (send, etc.)
 */
export function useMessages() {
  const { recentMessages, addMessage } = useChatStore();

  const sendMessage = useCallback(async (odna: string, text: string, type?: string, imageUrl?: string) => {
    try {
      const newMsg = await messageService.send(odna, text, type, imageUrl);
      addMessage(newMsg);
      return newMsg;
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  }, [addMessage]);

  return { messages: recentMessages, sendMessage };
}
