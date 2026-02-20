import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Arabic Corpus Admin",
  description: "QA and ingestion dashboard for Arabic Book Corpus Platform"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
