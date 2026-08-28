import type { Metadata } from "next";
import "./tokens.css";
import "./globals.css";
import "./components.css";

export const metadata: Metadata = {
  title: "Azure Optimizer V2 Benchmark",
  description: "Evidence-driven Azure infrastructure analysis benchmark.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
