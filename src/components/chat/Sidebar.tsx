"use client";

import { useState, useEffect } from "react";
import { XMarkIcon, UserIcon } from "@heroicons/react/24/outline";
import { Conversation as ConversationType } from "@/src/types";
import { useTranslation } from "@/src/contexts/LanguageContext";
import { MESSAGE_DIRECTION, LANGUAGE_LABEL } from "@/src/lib/constants";
import { useChatStore } from "@/src/stores";
import { getAvatarUrl } from "@/src/lib/utils";

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
  const { profiles, fetchUserProfile } = useChatStore();

  const profile = profiles[conv.odna];
  const displayName = profile?.displayName || t('unknown_user');
  const avatarUrl = getAvatarUrl(conv.odna, profile?.pictureUrl);

  useEffect(() => {
    if (conv.odna) {
      fetchUserProfile(conv.odna);
    }
  }, [conv.odna, fetchUserProfile]);

  const lastMessageText = conv.lastMessage.direction === MESSAGE_DIRECTION.OUTGOING
    ? `${t('message_sender_you')}: ${conv.lastMessage.text}`
    : conv.lastMessage.text;

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 ${active ? 'bg-emerald-50 border-l-4 border-emerald-500' : 'border-l-4 border-transparent'
        }`}
    >
      <img
        src={avatarUrl}
        alt={displayName}
        className="w-12 h-12 rounded-full object-cover bg-gray-200 flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <h3 className={`font-medium truncate ${active ? 'text-emerald-700' : 'text-gray-900'}`}>
          {displayName}
        </h3>
        <p className="text-sm text-gray-500 truncate">{lastMessageText}</p>
      </div>
    </button>
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
    <div className="w-full md:w-80 flex flex-col h-screen border-r border-gray-200 bg-white">
      <div className="flex-shrink-0 p-4 bg-white border-b border-gray-200 flex items-center justify-between">
        <h1 className="font-semibold text-gray-800">{displayName}</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleLanguage}
            className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
          >
            {language === 'th' ? LANGUAGE_LABEL.en : LANGUAGE_LABEL.th}
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
              <UserIcon className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">{t('waiting_for_messages')}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {conversations.map((conv) => (
              <ConversationItem
                key={conv.odna}
                conv={conv}
                active={selectedUser === conv.odna}
                onClick={() => onSelect(conv.odna)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
