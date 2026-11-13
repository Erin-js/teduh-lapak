import { readFile } from "node:fs/promises";
import path from "node:path";
export const runtime = "nodejs";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;
  if (!/^[a-f0-9-]+\.(jpg|png|webp)$/.test(name))
    return new Response("Tidak ditemukan", { status: 404 });
  try {
    const bytes = await readFile(
      path.join(process.cwd(), ".data", "photos", name),
    );
    const type = name.endsWith(".jpg")
      ? "image/jpeg"
      : name.endsWith(".png")
        ? "image/png"
        : "image/webp";
    return new Response(bytes, {
      headers: {
        "Content-Type": type,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, max-age=86400",
      },
    });
  } catch {
    return new Response("Tidak ditemukan", { status: 404 });
  }
}
