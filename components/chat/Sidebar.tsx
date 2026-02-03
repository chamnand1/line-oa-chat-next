"use client";

import { useState, useEffect } from "react";
import {
  Sidebar as ChatSidebar,
  ConversationList,
  Conversation,
  Avatar,
} from "@chatscope/chat-ui-kit-react";
import { XMarkIcon, UserIcon } from "@heroicons/react/24/outline";
import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import { Conversation as ConversationType } from "@/types";
import { useTranslation } from "@/contexts/LanguageContext";
import { MESSAGE_DIRECTION, LANGUAGE_LABEL } from "@/lib/constants";
import { useChatStore } from "@/stores";
import { getAvatarUrl } from "@/lib/utils";

interface Props {
  conversations: ConversationType[];
  selectedUser: string | null;
  onSelect: (odna: string) => void;
  onClose?: () => void;
  appName: string;
}

const ConversationItem = ({
  conv,
  active,
  onClick
}: {
  conv: ConversationType;
  active: boolean;
  onClick: () => void;
}) => {
  const { t } = useTranslation();
  const { profiles, fetchUserProfile, isLoadingProfile } = useChatStore();

  const profile = profiles[conv.odna];
  const displayName = profile?.displayName || t('unknown_user');
  const avatarUrl = getAvatarUrl(conv.odna, profile?.pictureUrl);

  useEffect(() => {
    if (conv.odna) {
      fetchUserProfile(conv.odna);
    }
  }, [conv.odna, fetchUserProfile]);

  return (
    <Conversation
      name={displayName}
      info={conv.lastMessage.direction === MESSAGE_DIRECTION.OUTGOING ? `${t('message_sender_you')}: ${conv.lastMessage.text}` : conv.lastMessage.text}
      active={active}
      onClick={onClick}
    >
      <Avatar
        src={avatarUrl}
        status="available"
      />
    </Conversation>
  );
};

export function Sidebar({
  conversations,
  selectedUser,
  onSelect,
  onClose,
  appName: initialAppName,
}: Props) {
  const { t, language, setLanguage } = useTranslation();
  const [displayName, setDisplayName] = useState(initialAppName);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const data = await res.json();
          if (data.displayName) {
            setDisplayName(data.displayName);
          }
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      }
    }
    fetchProfile();
  }, []);

  const toggleLanguage = () => {
    setLanguage(language === 'th' ? 'en' : 'th');
  };

  return (
    <div className="w-full md:w-80 flex flex-col h-screen border-r border-slate-200">
      <div className="p-4 bg-white border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="font-semibold text-slate-800">{displayName}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleLanguage}
            className="px-2 py-1 text-xs font-medium bg-slate-100 text-slate-600 rounded hover:bg-slate-200"
          >
            {language === 'th' ? LANGUAGE_LABEL.en : LANGUAGE_LABEL.th}
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <ChatSidebar position="left">
          <ConversationList>
            {conversations.length === 0 ? (
              <div className="p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center">
                  <UserIcon className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-sm text-slate-500">{t('waiting_for_messages')}</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <ConversationItem
                  key={conv.odna}
                  conv={conv}
                  active={selectedUser === conv.odna}
                  onClick={() => onSelect(conv.odna)}
                />
              ))
            )}
          </ConversationList>
        </ChatSidebar>
      </div>
    </div >
  );
}
