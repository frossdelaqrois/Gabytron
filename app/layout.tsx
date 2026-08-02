import type { Metadata } from "next";
import { Anton, Manrope } from "next/font/google";
import "./globals.css";

const display = Anton({ variable: "--font-display", weight: "400", subsets: ["latin"] });
const body = Manrope({ variable: "--font-body", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Gabytron Productions — Photo & Film",
  description: "Bold photography, film, creative direction and visual storytelling from Kuala Lumpur to the world.",
  icons: { icon: "/media/logo.png" },
  openGraph: {
    title: "Gabytron Productions — Photo & Film",
    description: "Photography, film and creative direction from Kuala Lumpur to the world.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Gabytron Productions" }],
  },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${display.variable} ${body.variable}`}>{children}</body></html>;
}
