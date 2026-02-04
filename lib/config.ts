export const config = {
  appName: process.env.NEXT_PUBLIC_APP_NAME || "LINE OA Admin",
  pollingInterval: parseInt(process.env.NEXT_PUBLIC_POLLING_INTERVAL || "3000", 10),

  line: {
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN || "",
    channelSecret: process.env.CHANNEL_SECRET || "",
  },

  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "",
    secretKey: process.env.SUPABASE_SECRET_KEY || "",
    tableName: process.env.NEXT_PUBLIC_SUPABASE_TABLE_NAME || "messages",
    storage: {
      bucketName: process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "chat-images",
      expiresIn: parseInt(process.env.NEXT_PUBLIC_SUPABASE_STORAGE_EXPIRES_IN || "31536000", 10),
      maxFileSize: 50 * 1024 * 1024, // 50MB
    },
  },

  pagination: {
    messagesPerPage: parseInt(process.env.NEXT_PUBLIC_MESSAGES_PER_PAGE || "50", 10),
  }
};
