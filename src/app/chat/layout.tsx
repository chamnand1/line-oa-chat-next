"use client";

import { usePathname, useRouter } from "next/navigation";
import { useChatStore } from "@/src/stores";
import { config } from "@/src/lib/config";
import { Sidebar } from "@/src/components";
import { useMessagesPolling } from "@/src/hooks";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { selectedUser, getConversations } = useChatStore();

  useMessagesPolling();

  const conversations = getConversations();

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
