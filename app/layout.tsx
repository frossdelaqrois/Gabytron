import type { Metadata } from "next";
import { Anton, Manrope } from "next/font/google";
import { PhotoEditor } from "./components/PhotoEditor";
import { galleryFiles, services } from "./services-data";
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

const editorAssets = Array.from(new Set([
  "/media/hero.webp",
  "/media/about-1.webp",
  "/media/about-2.webp",
  ...services.map((service) => service.cover),
  ...services.flatMap((service) => galleryFiles(service, "image")),
  ...services.flatMap((service) => service.animations || []),
  "/featured/emillio/portrait.jpg",
  "/featured/emillio/work-1.jpg",
  "/featured/emillio/work-2.jpg",
  "/featured/emillio/work-3.jpg",
  "/featured/emillio/work-4.jpg",
]));

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${display.variable} ${body.variable}`}>{children}<PhotoEditor assets={editorAssets} /></body></html>;
}
