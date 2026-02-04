import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/src/lib/supabase";
import { config } from "@/src/lib/config";

export async function POST(req: NextRequest) {
  try {
    const { fileName, fileType } = await req.json();

    if (!fileName) {
      return NextResponse.json({ message: "No filename provided" }, { status: 400 });
    }

    const path = `${Date.now()}-${fileName}`;

    const { data, error } = await supabase.storage
      .from(config.supabase.storage.bucketName)
      .createSignedUploadUrl(path);

    if (error || !data) {
      console.error("Signed upload URL error:", error);
      return NextResponse.json({ message: "Failed to generate upload URL", error }, { status: 500 });
    }

    const { data: readData, error: readError } = await supabase.storage
      .from(config.supabase.storage.bucketName)
      .createSignedUrl(path, config.supabase.storage.expiresIn);

    if (readError || !readData) {
    }

    return NextResponse.json({
      uploadUrl: data.signedUrl,
      token: data.token,
      path: path,
    });
  } catch (error) {
    console.error("Internal Server Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
