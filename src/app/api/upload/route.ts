import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/src/lib/supabase";
import { config } from "@/src/lib/config";

export async function POST(req: NextRequest) {
  try {
    const { path } = await req.json();

    if (!path) {
      return NextResponse.json({ message: "No path provided" }, { status: 400 });
    }

    const { data: signedData, error: urlError } = await supabase.storage
      .from(config.supabase.storage.bucketName)
      .createSignedUrl(path, config.supabase.storage.expiresIn);

    if (urlError || !signedData) {
      console.error("Signed URL error:", urlError);
      return NextResponse.json({ message: "Failed to generate URL" }, { status: 500 });
    }

    return NextResponse.json({
      url: signedData.signedUrl
    });
  } catch (error) {
    console.error("Internal Server Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
