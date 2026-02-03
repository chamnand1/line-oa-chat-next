import { NextRequest, NextResponse } from "next/server";
import { validateSignature } from "@line/bot-sdk";
import { lineConfig, lineBlobClient } from "@/lib/line";
import { db } from "@/lib/db";
import { MESSAGE_DIRECTION, MESSAGE_TYPE, WEBHOOK_EVENT_TYPE } from "@/lib/constants";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-line-signature") as string;

  if (!signature) {
    return NextResponse.json({ message: "Missing signature" }, { status: 400 });
  }

  if (!validateSignature(body, lineConfig.channelSecret, signature)) {
    return NextResponse.json({ message: "Invalid signature" }, { status: 403 });
  }

  const data = JSON.parse(body);

  for (const event of data.events) {
    if (event.type === WEBHOOK_EVENT_TYPE.MESSAGE) {
      let messageData: any = {
        id: event.message.id,
        odna: event.source.userId!,
        direction: MESSAGE_DIRECTION.INCOMING,
        timestamp: event.timestamp,
        webhookEventId: event.webhookEventId,
      };

      if (event.message.type === MESSAGE_TYPE.TEXT) {
        messageData.type = MESSAGE_TYPE.TEXT;
        messageData.text = event.message.text;
      } else if (event.message.type === MESSAGE_TYPE.IMAGE) {
        try {
          const stream = await lineBlobClient.getMessageContent(event.message.id);
          const chunks: any[] = [];
          for await (const chunk of stream) {
            chunks.push(chunk);
          }
          const buffer = Buffer.concat(chunks);

          const fileName = `${event.message.id}.jpg`;
          const uploadDir = path.join(process.cwd(), "public", "uploads");

          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }

          const filePath = path.join(uploadDir, fileName);
          fs.writeFileSync(filePath, buffer);

          messageData.type = MESSAGE_TYPE.IMAGE;
          messageData.text = "Sent an image";
          messageData.imageUrl = `/uploads/${fileName}`;
        } catch (error) {
          console.error("Error downloading image:", error);
          continue;
        }
      } else {
        continue;
      }

      db.addMessage(messageData);
    }
  }

  return NextResponse.json({ status: "ok" });
}
