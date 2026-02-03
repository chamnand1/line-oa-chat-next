import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { config } from "@/lib/config";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ message: "No file provided" }, { status: 400 });
    }

    const fileName = `${Date.now()}-${file.name}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { data, error: uploadError } = await supabase.storage
      .from(config.supabase.storage.bucketName)
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      return NextResponse.json({ message: "Upload failed", error: uploadError }, { status: 500 });
    }

    const { data: signedData, error: urlError } = await supabase.storage
      .from(config.supabase.storage.bucketName)
      .createSignedUrl(fileName, config.supabase.storage.expiresIn);

    if (urlError || !signedData) {
      console.error("Signed URL error:", urlError);
      return NextResponse.json({ message: "Failed to generate URL" }, { status: 500 });
    }

    return NextResponse.json({
      url: signedData.signedUrl,
      fileName: fileName
    });
  } catch (error) {
    console.error("Internal Server Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
