import { messagingApi } from "@line/bot-sdk";

const { MessagingApiClient, MessagingApiBlobClient } = messagingApi;

const channelAccessToken = process.env.CHANNEL_ACCESS_TOKEN || "";
const channelSecret = process.env.CHANNEL_SECRET || "";

export const lineClient = new MessagingApiClient({
  channelAccessToken,
});

export const lineBlobClient = new MessagingApiBlobClient({
  channelAccessToken,
});

export const lineConfig = {
  channelAccessToken,
  channelSecret,
};
