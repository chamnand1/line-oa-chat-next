"use client";

import { useState, useEffect, useRef } from "react";
import {
  MainContainer,
  ChatContainer,
  MessageList,
  Message,
  MessageInput,
  ConversationHeader,
  Avatar,
} from "@chatscope/chat-ui-kit-react";
import { ChatBubbleLeftEllipsisIcon } from "@heroicons/react/24/outline";
import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import { Message as MessageType } from "@/types";
import { useTranslation } from "@/contexts/LanguageContext";
import { MESSAGE_DIRECTION, MESSAGE_TYPE } from "@/lib/constants";
import { useChatStore } from "@/stores";
import { getAvatarUrl } from "@/lib/utils";

interface Props {
  messages: MessageType[];
  selectedUser: string;
  inputText: string;
  onInputChange: (text: string) => void;
  onSendText: (text: string) => void;
  onSendImage: (url: string) => void;
  onBack?: () => void;
}

export function ChatArea({
  messages,
  selectedUser,
  inputText,
  onInputChange,
  onSendText,
  onSendImage,
  onBack,
}: Props) {
  const { t } = useTranslation();
  const { profiles, fetchUserProfile } = useChatStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const profile = profiles[selectedUser];
  const displayName = profile?.displayName || selectedUser.slice(0, 16);
  const avatarUrl = getAvatarUrl(selectedUser, profile?.pictureUrl);

  useEffect(() => {
    if (selectedUser) {
      fetchUserProfile(selectedUser);
    }
  }, [selectedUser, fetchUserProfile]);

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Upload failed");
      }

      const data = await response.json();
      onSendImage(data.url);
    } catch (error: any) {
      console.error("Error uploading file:", error);
      alert(`Failed to upload image: ${error.message}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      <MainContainer>
        <ChatContainer>
          <ConversationHeader>
            <ConversationHeader.Back onClick={onBack} />
            <Avatar
              src={avatarUrl}
              name={displayName}
              status="available"
            />
            <ConversationHeader.Content
              userName={displayName}
            />
          </ConversationHeader>

          <MessageList>
            {messages.length === 0 ? (
              <MessageList.Content
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100%",
                  textAlign: "center",
                  padding: "20px",
                }}
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
                  <ChatBubbleLeftEllipsisIcon className="w-8 h-8 text-emerald-500" />
                </div>
                <p className="text-slate-600 font-medium">{t('start_conversation')}</p>
                <p className="text-sm text-slate-400 mt-1">{t('send_first_message')}</p>
              </MessageList.Content>
            ) : (
              messages.map((msg) => (
                <Message
                  key={msg.id}
                  model={{
                    ...(msg.type === MESSAGE_TYPE.IMAGE && msg.imageUrl
                      ? {
                        type: "custom",
                      }
                      : {
                        message: msg.text,
                      }),
                    sentTime: new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    }),
                    sender: msg.direction === MESSAGE_DIRECTION.INCOMING ? displayName : t('admin'),
                    direction: msg.direction,
                    position: "single",
                  }}
                >
                  {msg.direction === MESSAGE_DIRECTION.INCOMING && (
                    <Avatar
                      src={avatarUrl}
                      name={displayName}
                    />
                  )}
                  {msg.type === MESSAGE_TYPE.IMAGE && msg.imageUrl && (
                    <Message.CustomContent>
                      <a href={msg.imageUrl} target="_blank" rel="noopener noreferrer">
                        <img
                          src={msg.imageUrl}
                          alt="sent image"
                          className="max-w-[200px] h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                        />
                      </a>
                    </Message.CustomContent>
                  )}
                </Message>
              ))
            )}
          </MessageList>

          <MessageInput
            placeholder={isUploading ? "Uploading image..." : t('type_message')}
            value={inputText}
            onChange={(val) => onInputChange(val)}
            onSend={onSendText}
            onAttachClick={handleAttachClick}
            disabled={isUploading}
          />
        </ChatContainer>
      </MainContainer>
    </div>
  );
}
