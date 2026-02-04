import { create } from "zustand";
import { Message, Conversation, UserProfile } from "@/src/types";
import { messageService } from "@/src/services";
import { config } from "@/src/lib/config";

interface ChatState {
  messagesByUser: Record<string, Message[]>;
  hasMoreByUser: Record<string, boolean>;
  loadingByUser: Record<string, boolean>;

  selectedUser: string | null;
  inputText: string;
  isLoading: boolean;

  setSelectedUser: (odna: string | null) => void;
  setInputText: (text: string) => void;
  setLoading: (loading: boolean) => void;

  loadMessages: (odna: string) => Promise<void>;
  loadMoreMessages: (odna: string) => Promise<void>;
  addMessage: (message: Message) => void;

  getConversations: () => Conversation[];
  getSelectedConversation: () => Conversation | undefined;

  profiles: Record<string, UserProfile>;
  isLoadingProfile: Record<string, boolean>;
  fetchUserProfile: (odna: string) => Promise<void>;

  recentMessages: Message[];
  loadRecentMessages: () => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messagesByUser: {},
  hasMoreByUser: {},
  loadingByUser: {},
  selectedUser: null,
  inputText: "",
  isLoading: false,
  profiles: {},
  isLoadingProfile: {},
  recentMessages: [],

  setSelectedUser: (odna) => set({ selectedUser: odna }),
  setInputText: (text) => set({ inputText: text }),
  setLoading: (loading) => set({ isLoading: loading }),

  loadMessages: async (odna) => {
    const { messagesByUser, loadingByUser } = get();

    if (messagesByUser[odna]?.length > 0 || loadingByUser[odna]) return;

    set((state) => ({
      loadingByUser: { ...state.loadingByUser, [odna]: true }
    }));

    try {
      const { messages, hasMore } = await messageService.getByUser(odna, config.pagination.messagesPerPage);
      set((state) => ({
        messagesByUser: { ...state.messagesByUser, [odna]: messages },
        hasMoreByUser: { ...state.hasMoreByUser, [odna]: hasMore },
        loadingByUser: { ...state.loadingByUser, [odna]: false }
      }));
    } catch (error) {
      console.error("Error loading messages:", error);
      set((state) => ({
        loadingByUser: { ...state.loadingByUser, [odna]: false }
      }));
    }
  },

  loadMoreMessages: async (odna) => {
    const { messagesByUser, hasMoreByUser, loadingByUser } = get();

    if (!hasMoreByUser[odna] || loadingByUser[odna]) return;

    const messages = messagesByUser[odna] || [];
    const oldestTimestamp = messages.length > 0 ? messages[0].timestamp : undefined;

    set((state) => ({
      loadingByUser: { ...state.loadingByUser, [odna]: true }
    }));

    try {
      const { messages: olderMessages, hasMore } = await messageService.getByUser(
        odna,
        config.pagination.messagesPerPage,
        oldestTimestamp
      );

      set((state) => ({
        messagesByUser: {
          ...state.messagesByUser,
          [odna]: [...olderMessages, ...messages]
        },
        hasMoreByUser: { ...state.hasMoreByUser, [odna]: hasMore },
        loadingByUser: { ...state.loadingByUser, [odna]: false }
      }));
    } catch (error) {
      console.error("Error loading more messages:", error);
      set((state) => ({
        loadingByUser: { ...state.loadingByUser, [odna]: false }
      }));
    }
  },

  addMessage: (message) => {
    const odna = message.odna;
    set((state) => ({
      messagesByUser: {
        ...state.messagesByUser,
        [odna]: [...(state.messagesByUser[odna] || []), message]
      },
      recentMessages: [...state.recentMessages, message]
    }));
  },

  loadRecentMessages: async () => {
    try {
      const { messages } = await messageService.getRecent(100);
      set({ recentMessages: messages });
    } catch (error) {
      console.error("Error loading recent messages:", error);
    }
  },

  fetchUserProfile: async (odna) => {
    const { profiles, isLoadingProfile } = get();

    if (profiles[odna] || isLoadingProfile[odna]) return;

    set((state) => ({
      isLoadingProfile: { ...state.isLoadingProfile, [odna]: true }
    }));

    try {
      const res = await fetch(`/api/users/${odna}`);
      if (res.ok) {
        const data = await res.json();
        set((state) => ({
          profiles: { ...state.profiles, [odna]: data },
          isLoadingProfile: { ...state.isLoadingProfile, [odna]: false }
        }));
      } else {
        set((state) => ({
          isLoadingProfile: { ...state.isLoadingProfile, [odna]: false }
        }));
      }
    } catch (error) {
      console.error(`Failed to fetch profile for ${odna}:`, error);
      set((state) => ({
        isLoadingProfile: { ...state.isLoadingProfile, [odna]: false }
      }));
    }
  },

  getConversations: () => {
    const { recentMessages } = get();
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
  },

  getSelectedConversation: () => {
    const { selectedUser, messagesByUser } = get();
    if (!selectedUser) return undefined;

    const messages = messagesByUser[selectedUser] || [];
    if (messages.length === 0) return undefined;

    return {
      odna: selectedUser,
      messages,
      lastMessage: messages[messages.length - 1]
    };
  },
}));
