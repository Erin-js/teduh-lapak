import { NextResponse } from "next/server";
import { z } from "zod";
import { readOperations, mutateOperations } from "@/lib/store";
import catalog from "../../../../public/data/catalog.json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const facility = z.enum([
  "tersedia",
  "perlu_perbaikan",
  "tidak_tersedia",
  "belum_diperiksa",
]);
const locationId = z
  .string()
  .refine(
    (id) => catalog.locations.some((x) => x.id === id),
    "Loksem tidak ditemukan.",
  );
const schema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("inspection"),
    locationId,
    officer: z.string().trim().min(2).max(80),
    shade: facility,
    water: facility,
    rest: facility,
    note: z.string().trim().max(1200),
    photo: z
      .string()
      .regex(/^\/api\/photos\/[a-f0-9-]+\.(jpg|png|webp)$/)
      .optional(),
  }),
  z.object({
    type: z.literal("report"),
    locationId,
    kind: z.enum(["Air minum", "Peneduh", "Tempat jeda", "Lainnya"]),
    note: z.string().trim().min(5).max(1200),
  }),
]);
function safeOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
}
export async function GET() {
  try {
    return NextResponse.json(await readOperations());
  } catch {
    return NextResponse.json(
      { error: "Catatan belum dapat dibaca. Coba lagi." },
      { status: 500 },
    );
  }
}
export async function POST(request: Request) {
  if (!safeOrigin(request))
    return NextResponse.json(
      { error: "Permintaan tidak diizinkan." },
      { status: 403 },
    );
  try {
    if (Number(request.headers.get("content-length") || 0) > 20000)
      return NextResponse.json(
        { error: "Isian terlalu besar." },
        { status: 413 },
      );
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success)
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      );
    const { type, ...input } = parsed.data;
    const createdAt = new Date().toISOString();
    await mutateOperations((data) => {
      if (type === "inspection")
        data.inspections.unshift({
          ...input,
          id: crypto.randomUUID(),
          createdAt,
        } as (typeof data.inspections)[number]);
      else
        data.reports.unshift({
          ...input,
          id: crypto.randomUUID(),
          createdAt,
          updatedAt: createdAt,
          status: "baru",
        } as (typeof data.reports)[number]);
    });
    return NextResponse.json(await readOperations(), { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof SyntaxError
            ? "Format isian tidak valid."
            : "Catatan gagal disimpan. Coba lagi.",
      },
      { status: error instanceof SyntaxError ? 400 : 500 },
    );
  }
}
export async function PATCH(request: Request) {
  if (!safeOrigin(request))
    return NextResponse.json(
      { error: "Permintaan tidak diizinkan." },
      { status: 403 },
    );
  try {
    const parsed = z
      .object({ id: z.uuid(), status: z.enum(["baru", "diproses", "selesai"]) })
      .safeParse(await request.json());
    if (!parsed.success)
      return NextResponse.json(
        { error: "Status laporan tidak valid." },
        { status: 400 },
      );
    const found = await mutateOperations((data) => {
      const report = data.reports.find((x) => x.id === parsed.data.id);
      if (!report) return false;
      report.status = parsed.data.status;
      report.updatedAt = new Date().toISOString();
      return true;
    });
    return found
      ? NextResponse.json(await readOperations())
      : NextResponse.json(
          { error: "Laporan tidak ditemukan." },
          { status: 404 },
        );
  } catch {
    return NextResponse.json(
      { error: "Status gagal diperbarui." },
      { status: 500 },
    );
  }
}
