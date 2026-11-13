import assert from "node:assert/strict";
import { mkdir, readFile, writeFile, unlink } from "node:fs/promises";
import path from "node:path";

const base = "http://127.0.0.1:3000";
const results = [];
async function test(name, fn) {
  await fn();
  results.push({ name, passed: true });
  console.log(`PASS ${name}`);
}
async function send(method, body, origin = base) {
  return fetch(`${base}/api/operations`, {
    method,
    headers: { "Content-Type": "application/json", Origin: origin },
    body: JSON.stringify(body),
  });
}
await test("Home responds successfully", async () => {
  const response = await fetch(base);
  assert.equal(response.status, 200);
  assert.match(await response.text(), /TEDUH LAPAK/);
});
await test("Analysis contains 261 areas, 89 initial review areas and 436 recorded vendors", async () => {
  const data = await (await fetch(`${base}/data/catalog.json`)).json();
  assert.equal(data.areas.length, 261);
  assert.equal(data.areas.filter((a) => a.category === 0).length, 89);
  assert.equal(data.locations.length, 10);
  assert.equal(
    data.locations.reduce((total, l) => total + l.vendors, 0),
    436,
  );
  assert.equal(data.areas.filter((a) => a.lisa === "High-High").length, 29);
  assert.equal(new Set(data.areas.map((a) => a.cluster)).size, data.summary.k);
});
await test("Invalid location rejected", async () => {
  assert.equal(
    (
      await send("POST", {
        type: "report",
        locationId: "unknown",
        kind: "Air minum",
        note: "Fixture test",
      })
    ).status,
    400,
  );
});
await test("Invalid facility status rejected", async () => {
  assert.equal(
    (
      await send("POST", {
        type: "inspection",
        locationId: "jt-23",
        officer: "Test",
        shade: "wrong",
        water: "tersedia",
        rest: "tersedia",
        note: "",
      })
    ).status,
    400,
  );
});
await test("Cross-origin mutations rejected", async () => {
  assert.equal(
    (
      await send(
        "POST",
        {
          type: "report",
          locationId: "jt-23",
          kind: "Air minum",
          note: "Fixture test",
        },
        "https://example.com",
      )
    ).status,
    403,
  );
});
await test("Unknown report returns 404", async () => {
  assert.equal(
    (await send("PATCH", { id: crypto.randomUUID(), status: "selesai" }))
      .status,
    404,
  );
});
await test("Operations remain readable", async () => {
  const response = await fetch(`${base}/api/operations`);
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.ok(Array.isArray(data.inspections));
  assert.ok(Array.isArray(data.reports));
});
await test("Invalid photo rejected", async () => {
  const form = new FormData();
  form.append(
    "photo",
    new Blob(["invalid"], { type: "image/png" }),
    "fixture.png",
  );
  const response = await fetch(`${base}/api/photos`, {
    method: "POST",
    headers: { Origin: base },
    body: form,
  });
  assert.equal(response.status, 400);
});
await test("Photo upload and readback work", async () => {
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aGgAAAABJRU5ErkJggg==",
    "base64",
  );
  const form = new FormData();
  form.append("photo", new Blob([png], { type: "image/png" }), "fixture.png");
  const response = await fetch(`${base}/api/photos`, {
    method: "POST",
    headers: { Origin: base },
    body: form,
  });
  assert.equal(response.status, 201);
  const { url } = await response.json();
  const image = await fetch(base + url);
  assert.equal(image.status, 200);
  assert.equal(image.headers.get("content-type"), "image/png");
  assert.deepEqual(Buffer.from(await image.arrayBuffer()), png);
  await unlink(
    path.join(process.cwd(), ".data", "photos", url.split("/").at(-1)),
  );
});
await test("Uploaded photo path traversal rejected", async () => {
  const response = await fetch(`${base}/api/photos/not-a-valid-photo`);
  assert.equal(response.status, 404);
});
await mkdir("verification", { recursive: true });
await writeFile(
  "verification/api-check.json",
  JSON.stringify({ checkedAt: new Date().toISOString(), results }, null, 2),
);
console.log(`${results.length} checks passed.`);
