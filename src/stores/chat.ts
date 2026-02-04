import { create } from "zustand";
import { Message, Conversation, UserProfile } from "@/src/types";
import { messageService } from "@/src/services";
import { config } from "@/src/lib/config";

interface ChatState {
  // Data
  messagesByUser: Record<string, Message[]>;
  hasMoreByUser: Record<string, boolean>;
  loadingByUser: Record<string, boolean>;
  profiles: Record<string, UserProfile>;
  isLoadingProfile: Record<string, boolean>;
  recentMessages: Message[];

  // UI State
  selectedUser: string | null;
  inputText: string;
  isLoading: boolean;
}

interface ChatActions {
  setSelectedUser: (odna: string | null) => void;
  setInputText: (text: string) => void;
  setLoading: (loading: boolean) => void;

  loadMessages: (odna: string) => Promise<void>;
  loadMoreMessages: (odna: string) => Promise<void>;
  addMessage: (message: Message) => void;

  fetchUserProfile: (odna: string) => Promise<void>;
  loadRecentMessages: () => Promise<void>;
}

export const useChatStore = create<ChatState & ChatActions>((set, get) => ({
  // --- Initial State ---
  messagesByUser: {},
  hasMoreByUser: {},
  loadingByUser: {},
  profiles: {},
  isLoadingProfile: {},
  recentMessages: [],
  selectedUser: null,
  inputText: "",
  isLoading: false,

  // --- Actions ---
  setSelectedUser: (odna) => set({ selectedUser: odna }),

  setInputText: (text) => set({ inputText: text }),

  setLoading: (loading) => set({ isLoading: loading }),

  loadMessages: async (odna) => {
    const { messagesByUser, loadingByUser } = get();

    // Prevent double loading or redundant fetching
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
      console.error(`[ChatStore] Error loading messages for ${odna}:`, error);
      set((state) => ({
        loadingByUser: { ...state.loadingByUser, [odna]: false }
      }));
    }
  },

  loadMoreMessages: async (odna) => {
    const { messagesByUser, hasMoreByUser, loadingByUser } = get();

    if (!hasMoreByUser[odna] || loadingByUser[odna]) return;

    const currentMessages = messagesByUser[odna] || [];
    const oldestTimestamp = currentMessages.length > 0 ? currentMessages[0].timestamp : undefined;

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
          [odna]: [...olderMessages, ...currentMessages]
        },
        hasMoreByUser: { ...state.hasMoreByUser, [odna]: hasMore },
        loadingByUser: { ...state.loadingByUser, [odna]: false }
      }));
    } catch (error) {
      console.error(`[ChatStore] Error loading more messages for ${odna}:`, error);
      set((state) => ({
        loadingByUser: { ...state.loadingByUser, [odna]: false }
      }));
    }
  },

  addMessage: (message) => {
    const { odna, id } = message;

    set((state) => {
      const userMessages = state.messagesByUser[odna] || [];

      // Prevent duplicates if already exists (e.g. from polling and real-time push)
      if (userMessages.some(m => m.id === id)) return state;

      return {
        messagesByUser: {
          ...state.messagesByUser,
          [odna]: [...userMessages, message]
        },
        recentMessages: [
          message,
          ...state.recentMessages.filter(m => m.id !== id)
        ].slice(0, 200) // Keep recent list manageable
      };
    });
  },

  loadRecentMessages: async () => {
    try {
      const { messages } = await messageService.getRecent(100);
      set({ recentMessages: messages });
    } catch (error) {
      console.error("[ChatStore] Error loading recent messages:", error);
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
        throw new Error(`User not found: ${odna}`);
      }
    } catch (error) {
      console.error(`[ChatStore] Profile fetch failed for ${odna}:`, error);
      set((state) => ({
        isLoadingProfile: { ...state.isLoadingProfile, [odna]: false }
      }));
    }
  },
}));

