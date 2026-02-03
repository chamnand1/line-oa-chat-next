"use client";

import { useState, useEffect } from "react";
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
  onBack?: () => void;
}

export function ChatArea({
  messages,
  selectedUser,
  inputText,
  onInputChange,
  onSendText,
  onBack,
}: Props) {
  const { t } = useTranslation();
  const { profiles, fetchUserProfile } = useChatStore();

  const profile = profiles[selectedUser];
  const displayName = profile?.displayName || selectedUser.slice(0, 16);
  const avatarUrl = getAvatarUrl(selectedUser, profile?.pictureUrl);

  useEffect(() => {
    if (selectedUser) {
      fetchUserProfile(selectedUser);
    }
  }, [selectedUser, fetchUserProfile]);

  return (
    <div className="flex-1 flex flex-col h-screen">

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
                        type: "image",
                        payload: { src: msg.imageUrl },
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
                </Message>
              ))
            )}
          </MessageList>

          <MessageInput
            placeholder={t('type_message')}
            value={inputText}
            onChange={(val) => onInputChange(val)}
            onSend={onSendText}
            attachButton={false}
          />
        </ChatContainer>
      </MainContainer>
    </div>
  );
}
