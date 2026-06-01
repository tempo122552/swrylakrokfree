import type { Metadata } from "next";
import { projectDescription, projectName } from "@/lib/brand";
import "./globals.css";

export const metadata: Metadata = {
  title: projectName,
  description: projectDescription,
  icons: {
    icon: "/brand/swry-rak-lok-logo.jpg",
    apple: "/brand/swry-rak-lok-logo.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
