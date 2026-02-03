import { NextResponse } from "next/server";
import { lineClient } from "@/lib/line";

export async function GET() {
  try {
    const botInfo = await lineClient.getBotInfo();
    return NextResponse.json(botInfo);
  } catch (error: any) {
    const status = error.statusCode || 500;
    const message = error.statusMessage || "Failed to fetch bot info";
    return NextResponse.json({ error: message, details: error.originalError?.response?.data }, { status });
  }
}
