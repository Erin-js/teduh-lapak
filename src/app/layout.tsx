import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "TEDUH LAPAK — Ruang teduh, usaha tetap tumbuh.",
  description:
    "Jelajahi peta panas Jakarta, kenali kebutuhan Loksem, dan bantu hadirkan peneduh, air minum, serta tempat jeda di dekat lapak.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
