import { NextRequest, NextResponse } from "next/server";
import { validateSignature } from "@line/bot-sdk";
import { lineConfig, lineBlobClient } from "@/src/lib/line";
import { db } from "@/src/lib/db";
import { supabase } from "@/src/lib/supabase";
import { config } from "@/src/lib/config";
import { MESSAGE_DIRECTION, MESSAGE_TYPE, WEBHOOK_EVENT_TYPE } from "@/src/lib/constants";
import { Message } from "@/src/types";

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
      if (!event.source.userId) continue;

      let messageData: Message = {
        id: event.message.id,
        odna: event.source.userId,
        direction: MESSAGE_DIRECTION.INCOMING,
        timestamp: event.timestamp,
        webhookEventId: event.webhookEventId,
        type: MESSAGE_TYPE.TEXT,
        text: "",
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

          const { error: uploadError } = await supabase.storage
            .from(config.supabase.storage.bucketName)
            .upload(fileName, buffer, {
              contentType: 'image/jpeg',
              upsert: true
            });

          if (uploadError) {
            console.error("Supabase upload error:", uploadError);
            continue;
          }

          const { data: signedData, error: urlError } = await supabase.storage
            .from(config.supabase.storage.bucketName)
            .createSignedUrl(fileName, config.supabase.storage.expiresIn);

          if (urlError || !signedData) {
            console.error("Supabase signed URL error:", urlError);
            continue;
          }

          messageData.type = MESSAGE_TYPE.IMAGE;
          messageData.text = "Sent an image";
          messageData.imageUrl = signedData.signedUrl;
        } catch (error) {
          console.error("Error processing image:", error);
          continue;
        }
      } else {
        continue;
      }

      await db.addMessage(messageData);
    }
  }

  return NextResponse.json({ status: "ok" });
}
