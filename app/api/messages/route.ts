import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { lineClient } from "@/lib/line";
import { MESSAGE_DIRECTION, MESSAGE_TYPE } from "@/lib/constants";

export async function GET() {
  return NextResponse.json(db.getMessages());
}

export async function POST(req: NextRequest) {
  try {
    const { odna, text } = await req.json();

    if (!odna || !text) {
      return NextResponse.json({ message: "Missing userId or text" }, { status: 400 });
    }

    await lineClient.pushMessage({
      to: odna,
      messages: [{ type: "text", text }],
    });

    const newMessage = db.addMessage({
      id: Date.now().toString(),
      odna,
      direction: MESSAGE_DIRECTION.OUTGOING,
      type: MESSAGE_TYPE.TEXT,
      text,
      timestamp: Date.now(),
    });

    return NextResponse.json(newMessage);
  } catch (error) {
    return NextResponse.json({ message: "Failed" }, { status: 500 });
  }
}
