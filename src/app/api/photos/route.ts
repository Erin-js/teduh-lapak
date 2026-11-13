import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
export const runtime = "nodejs";
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      if (new URL(origin).host !== request.headers.get("host"))
        return NextResponse.json(
          { error: "Permintaan tidak diizinkan." },
          { status: 403 },
        );
    } catch {
      return NextResponse.json(
        { error: "Permintaan tidak diizinkan." },
        { status: 403 },
      );
    }
  }
  try {
    if (Number(request.headers.get("content-length") || 0) > 6 * 1024 * 1024)
      return NextResponse.json(
        { error: "Maksimal ukuran foto 5 MB." },
        { status: 413 },
      );
    const form = await request.formData();
    const file = form.get("photo");
    if (!(file instanceof File) || file.size > 5 * 1024 * 1024)
      return NextResponse.json(
        { error: "Pilih foto JPG, PNG, atau WebP maksimal 5 MB." },
        { status: 400 },
      );
    const bytes = Buffer.from(await file.arrayBuffer());
    let extension = "";
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
      extension = "jpg";
    if (
      bytes
        .subarray(0, 8)
        .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    )
      extension = "png";
    if (
      bytes.toString("ascii", 0, 4) === "RIFF" &&
      bytes.toString("ascii", 8, 12) === "WEBP"
    )
      extension = "webp";
    if (!extension)
      return NextResponse.json(
        { error: "Format foto tidak didukung." },
        { status: 400 },
      );
    const name = `${crypto.randomUUID()}.${extension}`;
    const directory = path.join(process.cwd(), ".data", "photos");
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, name), bytes);
    return NextResponse.json({ url: `/api/photos/${name}` }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Foto gagal diunggah." },
      { status: 500 },
    );
  }
}
