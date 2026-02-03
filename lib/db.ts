import fs from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "db.json");

import { MessageDirection, MessageType } from "@/lib/constants";

export interface Message {
  id: string;
  odna: string;
  direction: MessageDirection;
  type: MessageType;
  text: string;
  imageUrl?: string;
  timestamp: number;
  webhookEventId?: string;
}

interface DB {
  messages: Message[];
}

function readDb(): DB {
  try {
    if (!fs.existsSync(DB_PATH)) {
      return { messages: [] };
    }
    return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
  } catch {
    return { messages: [] };
  }
}

function writeDb(data: DB) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

export const db = {
  getMessages: () => {
    const messages = readDb().messages;
    return messages.sort((a, b) => a.timestamp - b.timestamp);
  },
  addMessage: (message: Message) => {
    const data = readDb();

    const exists = data.messages.some(m => m.id === message.id);
    if (exists) {
      return message;
    }

    data.messages.push(message);
    writeDb(data);
    return message;
  },
};
