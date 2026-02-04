"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowLeftIcon, PaperAirplaneIcon, PhotoIcon } from "@heroicons/react/24/outline";
import { ChatBubbleLeftEllipsisIcon } from "@heroicons/react/24/outline";
import { Message as MessageType } from "@/types";
import { useTranslation } from "@/contexts/LanguageContext";
import { MESSAGE_DIRECTION, MESSAGE_TYPE } from "@/lib/constants";
import { useChatStore } from "@/stores";
import { getAvatarUrl } from "@/lib/utils";
import toast from "react-hot-toast";
import { config } from "@/lib/config";

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
  const messageListRef = useRef<HTMLDivElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const profile = profiles[selectedUser];
  const displayName = profile?.displayName || selectedUser.slice(0, 16);
  const avatarUrl = getAvatarUrl(selectedUser, profile?.pictureUrl);

  useEffect(() => {
    if (selectedUser) {
      fetchUserProfile(selectedUser);
    }
  }, [selectedUser, fetchUserProfile]);

  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [messages]);

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > config.supabase.storage.maxFileSize) {
      toast.error(t('file_too_large', { size: '50MB' }));
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setIsUploading(true);
    const loadingToast = toast.loading(t('upload_loading'));

    try {
      const initRes = await fetch("/api/upload/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type
        }),
      });

      if (!initRes.ok) throw new Error("Failed to initialize upload");
      const { uploadUrl, path } = await initRes.json();

      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type }
      });

      if (!uploadRes.ok) throw new Error("Cloud upload failed");

      const completeRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
      });

      if (!completeRes.ok) throw new Error("Failed to generate access URL");
      const { url } = await completeRes.json();

      onSendImage(url);
      toast.success(t('upload_success'), { id: loadingToast });
    } catch (error: any) {
      console.error("Error uploading file:", error);
      toast.error(t('upload_failed', { error: error.message }), { id: loadingToast });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSend = () => {
    if (inputText.trim() && !isUploading) {
      onSendText(inputText);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-dvh bg-gray-50">
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 shadow-sm">
        <button
          onClick={onBack}
          className="md:hidden p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
        </button>
        <img
          src={avatarUrl}
          alt={displayName}
          className="w-10 h-10 rounded-full object-cover bg-gray-200"
        />
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-gray-900 truncate">{displayName}</h2>
        </div>
      </div>

      <div
        ref={messageListRef}
        className="flex-1 overflow-y-auto min-h-0 px-4 py-4 space-y-3"
        style={{ scrollBehavior: 'smooth' }}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
              <ChatBubbleLeftEllipsisIcon className="w-8 h-8 text-emerald-500" />
            </div>
            <p className="text-gray-600 font-medium">{t('start_conversation')}</p>
            <p className="text-sm text-gray-400 mt-1">{t('send_first_message')}</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.direction === MESSAGE_DIRECTION.OUTGOING ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-2 max-w-[80%] ${msg.direction === MESSAGE_DIRECTION.OUTGOING ? 'flex-row-reverse' : ''}`}>
                {msg.direction === MESSAGE_DIRECTION.INCOMING && (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                  />
                )}
                <div
                  className={`px-4 py-2 rounded-2xl ${msg.direction === MESSAGE_DIRECTION.OUTGOING
                    ? 'bg-emerald-500 text-white rounded-br-md'
                    : 'bg-white text-gray-900 rounded-bl-md shadow-sm border border-gray-100'
                    }`}
                >
                  {msg.type === MESSAGE_TYPE.IMAGE && msg.imageUrl ? (
                    <a href={msg.imageUrl} target="_blank" rel="noopener noreferrer">
                      <img
                        src={msg.imageUrl}
                        alt="sent image"
                        className="max-w-[200px] h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                      />
                    </a>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                  )}
                  <p className={`text-xs mt-1 ${msg.direction === MESSAGE_DIRECTION.OUTGOING ? 'text-emerald-100' : 'text-gray-400'
                    }`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex-shrink-0 px-4 py-3 bg-white border-t border-gray-200"
        style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))' }}>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />
        <div className="flex items-center gap-2">
          <button
            onClick={handleAttachClick}
            disabled={isUploading}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <PhotoIcon className="w-6 h-6 text-gray-500" />
          </button>
          <input
            type="text"
            value={inputText}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isUploading ? t('upload_loading') : t('type_message')}
            disabled={isUploading}
            className="flex-1 px-4 py-2 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400"
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim() || isUploading}
            className="p-2 rounded-full bg-emerald-500 text-white hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
