"use client";

import { useState } from "react";
import { useChatStore } from "@/stores";
import { useMessages } from "@/hooks";
import { config } from "@/lib/config";
import { Sidebar, ChatArea, EmptyState } from "@/components";
import { MESSAGE_TYPE } from "@/lib/constants";

export default function AdminDashboard() {
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');

  const {
    selectedUser,
    inputText,
    setSelectedUser,
    setInputText,
    getConversations,
    getSelectedConversation,
    loadMessages,
    loadMoreMessages,
    hasMoreByUser,
    loadingByUser,
  } = useChatStore();

  const { sendMessage } = useMessages();
  const conversations = getConversations();
  const selectedConversation = getSelectedConversation();

  const handleSendText = async (text: string) => {
    if (!selectedUser || !text.trim()) return;

    setInputText("");

    try {
      await sendMessage(selectedUser, text);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleSendImage = async (url: string) => {
    if (!selectedUser || !url) return;

    try {
      await sendMessage(selectedUser, "", MESSAGE_TYPE.IMAGE, url);
    } catch (error) {
      console.error("Error sending image message:", error);
    }
  };

  const handleSelectUser = (odna: string) => {
    setSelectedUser(odna);
    loadMessages(odna);
    setMobileView('chat');
  };

  const handleBack = () => {
    setMobileView('list');
    setSelectedUser("");
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <div className={`${mobileView === 'list' ? 'flex' : 'hidden'
        } md:flex flex-col w-full md:w-auto`}>
        <Sidebar
          conversations={conversations}
          selectedUser={selectedUser}
          onSelect={handleSelectUser}
          appName={config.appName}
        />
      </div>

      <div className={`${mobileView === 'chat' ? 'flex' : 'hidden'
        } md:flex flex-1 flex-col min-w-0`}>
        {selectedUser ? (
          <ChatArea
            messages={selectedConversation?.messages || []}
            selectedUser={selectedUser}
            inputText={inputText}
            onInputChange={setInputText}
            onSendText={handleSendText}
            onSendImage={handleSendImage}
            onBack={handleBack}
            hasMore={hasMoreByUser[selectedUser]}
            isLoadingMore={loadingByUser[selectedUser] && (selectedConversation?.messages.length || 0) > 0}
            isLoadingInitial={loadingByUser[selectedUser] && (!selectedConversation || selectedConversation.messages.length === 0)}
            onLoadMore={() => loadMoreMessages(selectedUser)}
          />
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}
