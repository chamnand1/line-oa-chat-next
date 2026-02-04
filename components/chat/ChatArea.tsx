"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowLeftIcon, PaperAirplaneIcon, PhotoIcon, ArrowUpIcon } from "@heroicons/react/24/outline";
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
  hasMore?: boolean;
  isLoadingMore?: boolean;
  isLoadingInitial?: boolean;
  onLoadMore?: () => void;
}

export function ChatArea({
  messages,
  selectedUser,
  inputText,
  onInputChange,
  onSendText,
  onSendImage,
  onBack,
  hasMore = false,
  isLoadingMore = false,
  isLoadingInitial = false,
  onLoadMore,
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

  const hasInitialScrolled = useRef(false);

  const scrollToBottom = () => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    if (messages.length > 0 && !hasInitialScrolled.current) {
      hasInitialScrolled.current = true;

      const container = messageListRef.current;
      if (!container) return;

      const images = container.querySelectorAll('img');

      if (images.length === 0) {
        requestAnimationFrame(scrollToBottom);
        return;
      }

      const imagePromises = Array.from(images).map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => resolve();
        });
      });

      Promise.race([
        Promise.all(imagePromises),
        new Promise((resolve) => setTimeout(resolve, 2000))
      ]).then(() => {
        requestAnimationFrame(scrollToBottom);
      });
    }
  }, [messages]);

  useEffect(() => {
    hasInitialScrolled.current = false;
  }, [selectedUser]);

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
      {/* Header */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200">
        {onBack && (
          <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeftIcon className="w-6 h-6 text-gray-500" />
          </button>
        )}
        <img
          src={avatarUrl}
          alt={displayName}
          className="w-10 h-10 rounded-full object-cover"
        />
        <h2 className="text-lg font-semibold text-gray-800 truncate">{displayName}</h2>
      </div>

      <div
        ref={messageListRef}
        className="flex-1 overflow-y-auto min-h-0 px-4 py-4 space-y-3"
        style={{ scrollBehavior: 'smooth' }}
      >
        {isLoadingInitial ? (
          <div className="space-y-6 pt-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-2 max-w-[80%] ${i % 2 === 0 ? 'flex-row-reverse' : ''}`}>
                  <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />
                  <div className={`h-12 w-32 rounded-2xl ${i % 2 === 0 ? 'bg-emerald-100' : 'bg-gray-200'} animate-pulse`}
                    style={{ width: `${Math.random() * 100 + 100}px` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {hasMore && (
              <div className="flex justify-center p-4">
                <button
                  onClick={onLoadMore}
                  disabled={isLoadingMore}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-emerald-600 bg-emerald-50 rounded-full hover:bg-emerald-100 disabled:opacity-50"
                >
                  {isLoadingMore ? (
                    <>
                      <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <ArrowUpIcon className="w-4 h-4" />
                      Load Older Messages
                    </>
                  )}
                </button>
              </div>
            )}

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
          </>
        )}
      </div>

      {/* Input area */}
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
