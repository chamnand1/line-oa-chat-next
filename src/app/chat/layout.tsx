"use client";

import { usePathname, useRouter } from "next/navigation";
import { useMemo, useCallback } from "react";
import { useChatStore } from "@/src/stores";
import { config } from "@/src/lib/config";
import { Sidebar } from "@/src/components";
import { useMessagesPolling } from "@/src/hooks";
import { Conversation } from "@/src/types";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const selectedUser = useChatStore((state) => state.selectedUser);
  const recentMessages = useChatStore((state) => state.recentMessages);

  useMessagesPolling();

  const conversations = useMemo(() => {
    const grouped = recentMessages.reduce((acc, msg) => {
      const odna = msg.odna || "unknown";
      if (!acc[odna]) {
        acc[odna] = { odna, lastMessage: msg, messages: [] };
      }
      acc[odna].messages.push(msg);
      if (msg.timestamp > acc[odna].lastMessage.timestamp) {
        acc[odna].lastMessage = msg;
      }
      return acc;
    }, {} as Record<string, Conversation>);

    return Object.values(grouped).sort(
      (a, b) => b.lastMessage.timestamp - a.lastMessage.timestamp
    );
  }, [recentMessages]);

  const isChatDetailPage = pathname.startsWith('/chat/') && pathname !== '/chat';

  const handleSelectUser = (odna: string) => {
    router.push(`/chat/${odna}`);
  };

  return (
    <div className="flex h-dvh bg-gray-100 overflow-hidden">
      <div className={`${isChatDetailPage ? 'hidden' : 'flex'} md:flex flex-col w-full md:w-auto`}>
        <Sidebar
          conversations={conversations}
          selectedUser={selectedUser}
          onSelect={handleSelectUser}
          appName={config.appName}
        />
      </div>

      <div className={`${isChatDetailPage ? 'flex' : 'hidden'} md:flex flex-1 flex-col min-w-0`}>
        {children}
      </div>
    </div>
  );
}
