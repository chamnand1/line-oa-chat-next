export const config = {
  appName: process.env.NEXT_PUBLIC_APP_NAME || "LINE OA Admin",
  pollingInterval: parseInt(process.env.NEXT_PUBLIC_POLLING_INTERVAL || "3000", 10),
};
