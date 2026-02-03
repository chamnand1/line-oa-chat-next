import { messagingApi } from "@line/bot-sdk";
import { config } from "./config";

const { MessagingApiClient, MessagingApiBlobClient } = messagingApi;

export const lineClient = new MessagingApiClient({
  channelAccessToken: config.line.channelAccessToken,
});

export const lineBlobClient = new MessagingApiBlobClient({
  channelAccessToken: config.line.channelAccessToken,
});

export const lineConfig = {
  channelAccessToken: config.line.channelAccessToken,
  channelSecret: config.line.channelSecret,
};
