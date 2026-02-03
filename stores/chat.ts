import { create } from "zustand";
import { Message, Conversation, UserProfile } from "@/types";

interface ChatState {
  messages: Message[];
  selectedUser: string | null;
  inputText: string;
  isLoading: boolean;

  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  setSelectedUser: (odna: string | null) => void;
  setInputText: (text: string) => void;
  setLoading: (loading: boolean) => void;

  getConversations: () => Conversation[];
  getSelectedConversation: () => Conversation | undefined;

  profiles: Record<string, UserProfile>;
  isLoadingProfile: Record<string, boolean>;
  fetchUserProfile: (odna: string) => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  selectedUser: null,
  inputText: "",
  isLoading: false,
  profiles: {},
  isLoadingProfile: {},

  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  setSelectedUser: (odna) => set({ selectedUser: odna }),
  setInputText: (text) => set({ inputText: text }),
  setLoading: (loading) => set({ isLoading: loading }),

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
    const { messages } = get();
    const grouped = messages.reduce((acc, msg) => {
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
    const { selectedUser } = get();
    return get().getConversations().find((c) => c.odna === selectedUser);
  },
}));
