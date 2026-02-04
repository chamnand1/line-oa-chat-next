"use client";

import { useEffect, useCallback } from "react";
import { useChatStore } from "@/src/stores";
import { messageService } from "@/src/services";
import { config } from "@/src/lib/config";

export function useMessagesPolling() {
  const loadRecentMessages = useChatStore((state) => state.loadRecentMessages);

  useEffect(() => {
    loadRecentMessages();
    const interval = setInterval(loadRecentMessages, config.pollingInterval);
    return () => clearInterval(interval);
  }, [loadRecentMessages]);
}

export function useMessages() {
  const recentMessages = useChatStore((state) => state.recentMessages);
  const addMessage = useChatStore((state) => state.addMessage);

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
