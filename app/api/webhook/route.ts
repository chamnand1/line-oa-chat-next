import { NextRequest, NextResponse } from "next/server";
import { validateSignature } from "@line/bot-sdk";
import { lineConfig, lineBlobClient } from "@/lib/line";
import { db } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import { MESSAGE_DIRECTION, MESSAGE_TYPE, WEBHOOK_EVENT_TYPE } from "@/lib/constants";

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

          const { error: uploadError } = await supabase.storage
            .from('chat-images')
            .upload(fileName, buffer, {
              contentType: 'image/jpeg',
              upsert: true
            });

          if (uploadError) {
            console.error("Supabase upload error:", uploadError);
            continue;
          }

          const { data: { publicUrl } } = supabase.storage
            .from('chat-images')
            .getPublicUrl(fileName);

          messageData.type = MESSAGE_TYPE.IMAGE;
          messageData.text = "Sent an image";
          messageData.imageUrl = publicUrl;
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
