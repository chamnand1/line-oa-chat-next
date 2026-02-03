import { NextResponse } from "next/server";
import { lineClient } from "@/lib/line";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const profile = await lineClient.getProfile(userId);
    return NextResponse.json(profile);
  } catch (error: any) {
    const status = error.statusCode || 500;
    return NextResponse.json({ error: "Failed to fetch user profile" }, { status });
  }
}
