import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ምክረ አበው - የጥያቄ ማቅረቢያ",
  description: "በምክረ አበው ዝግጅት ላይ ጥያቄዎችን በቀጥታ ለመድረክ አባቶች ማቅረቢያ ፈጣን ድረ-ገጽ።",
  applicationName: "ምክረ አበው",
  authors: [{ name: "ምክረ አበው" }],
  keywords: ["ምክረ አበው", "ጥያቄና መልስ", "Mikre Abew", "Ethiopia", "Q&A"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#c58319",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="am" className="h-full">
      <body className="min-h-full flex flex-col font-sans bg-[#faf9f6] text-stone-900 antialiased">
        {children}
      </body>
    </html>
  );
}
