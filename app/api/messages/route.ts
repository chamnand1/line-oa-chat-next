import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { config } from "@/lib/config";
import { lineClient } from "@/lib/line";
import { MESSAGE_DIRECTION, MESSAGE_TYPE } from "@/lib/constants";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const odna = searchParams.get('odna') || undefined;
  const limit = parseInt(searchParams.get('limit') || config.pagination.messagesPerPage.toString());
  const beforeParam = searchParams.get('before');
  const before = beforeParam ? parseInt(beforeParam) : undefined;

  const result = await db.getMessages(odna, limit, before);
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  try {
    const { odna, text, type, imageUrl } = await req.json();

    if (!odna) {
      return NextResponse.json({ message: "Missing userId" }, { status: 400 });
    }

    const msgType = type || MESSAGE_TYPE.TEXT;

    if (msgType === MESSAGE_TYPE.TEXT) {
      if (!text) return NextResponse.json({ message: "Missing text" }, { status: 400 });

      await lineClient.pushMessage({
        to: odna,
        messages: [{ type: "text", text }],
      });
    } else if (msgType === MESSAGE_TYPE.IMAGE) {
      if (!imageUrl) return NextResponse.json({ message: "Missing imageUrl" }, { status: 400 });

      await lineClient.pushMessage({
        to: odna,
        messages: [{
          type: "image",
          originalContentUrl: imageUrl,
          previewImageUrl: imageUrl
        }],
      });
    }

    const newMessage = await db.addMessage({
      id: Date.now().toString(),
      odna,
      direction: MESSAGE_DIRECTION.OUTGOING,
      type: msgType,
      text: text || (msgType === MESSAGE_TYPE.IMAGE ? "Sent an image" : ""),
      imageUrl: imageUrl,
      timestamp: Date.now(),
    });

    return NextResponse.json(newMessage);
  } catch (error) {
    return NextResponse.json({ message: "Failed" }, { status: 500 });
  }
}
