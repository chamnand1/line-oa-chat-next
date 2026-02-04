"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useChatStore } from "@/src/stores";
import { useShallow } from "zustand/shallow";
import { useMessages } from "@/src/hooks";
import { ChatArea } from "@/src/components";
import { MESSAGE_TYPE } from "@/src/lib/constants";

export default function ChatDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const inputText = useChatStore((state) => state.inputText);
  const setSelectedUser = useChatStore((state) => state.setSelectedUser);
  const setInputText = useChatStore((state) => state.setInputText);
  const loadMessages = useChatStore((state) => state.loadMessages);
  const loadMoreMessages = useChatStore((state) => state.loadMoreMessages);

  const hasMore = useChatStore((state) => state.hasMoreByUser[id]);
  const isLoading = useChatStore((state) => state.loadingByUser[id]);

  const selectedConversation = useChatStore(useShallow((state) => {
    const messages = state.messagesByUser[id] || [];
    if (!id || messages.length === 0) return undefined;

    return {
      odna: id,
      messages,
      lastMessage: messages[messages.length - 1]
    };
  }));

  const { sendMessage } = useMessages();

  useEffect(() => {
    if (id) {
      setSelectedUser(id);
      loadMessages(id);
    }
  }, [id, setSelectedUser, loadMessages]);

  const handleSendText = async (text: string) => {
    if (!id || !text.trim()) return;
    setInputText("");
    try {
      await sendMessage(id, text);
    } catch (error) {
      console.error("Error sending text message:", error);
    }
  };

  const handleSendImage = async (url: string) => {
    if (!id || !url) return;
    try {
      await sendMessage(id, "", MESSAGE_TYPE.IMAGE, url);
    } catch (error) {
      console.error("Error sending image message:", error);
    }
  };

  const handleBack = () => {
    router.push('/chat');
    setSelectedUser(null);
  };

  return (
    <ChatArea
      messages={selectedConversation?.messages || []}
      selectedUser={id}
      inputText={inputText}
      onInputChange={setInputText}
      onSendText={handleSendText}
      onSendImage={handleSendImage}
      onBack={handleBack}
      hasMore={hasMore}
      isLoadingMore={isLoading && (selectedConversation?.messages.length || 0) > 0}
      isLoadingInitial={isLoading && (!selectedConversation || selectedConversation.messages.length === 0)}
      onLoadMore={() => loadMoreMessages(id)}
    />
  );
}
