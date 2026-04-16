import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Collective Slide Decks",
  description: "Presentation decks with cross-device remote control",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#111", color: "#ccc", fontFamily: "system-ui, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
