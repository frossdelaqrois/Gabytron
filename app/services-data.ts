export type Service = {
  slug: string;
  title: string;
  shortTitle: string;
  tag: string;
  cover: string;
  description: string;
  imageCount: number;
  videoCount: number;
  animations?: string[];
};

export const services: Service[] = [
  {
    slug: "campaigns",
    title: "Campaigns",
    shortTitle: "Campaigns",
    tag: "Brand / Editorial",
    cover: "/media/campaign.webp",
    description: "Impactful fashion, beauty, product, and brand-led visuals designed to connect with an audience and leave a lasting impression.",
    imageCount: 71,
    videoCount: 6,
  },
  {
    slug: "lookbook",
    title: "Lookbook / Editorial",
    shortTitle: "Lookbook",
    tag: "Seasonal / Fashion",
    cover: "/media/lookbook.webp",
    description: "High-end editorial photography that brings fashion and thematic ideas to life through cohesive, story-led image collections.",
    imageCount: 28,
    videoCount: 1,
  },
  {
    slug: "corporate",
    title: "Corporate Branding",
    shortTitle: "Corporate Branding",
    tag: "People / Business",
    cover: "/media/corp.webp",
    description: "Professional portraits, team imagery, and brand films that communicate credibility, consistency, and the character of your organisation.",
    imageCount: 24,
    videoCount: 5,
    animations: ["/galleries/corporate/animation-001.gif"],
  },
  {
    slug: "products",
    title: "Product Shoot",
    shortTitle: "Product Shoot",
    tag: "Studio / Detail",
    cover: "/media/product.webp",
    description: "Thoughtful styling, expert lighting, and creative setups that turn a product into a visual story and elevate its place in the market.",
    imageCount: 26,
    videoCount: 5,
  },
  {
    slug: "portraits",
    title: "Portraiture",
    shortTitle: "Portraiture",
    tag: "Character / Story",
    cover: "/media/portrait.webp",
    description: "Authentic, elegant portraits for professionals, creatives, teams, families, and individuals—each shaped around personality and purpose.",
    imageCount: 80,
    videoCount: 0,
  },
  {
    slug: "ecommerce",
    title: "E-Commerce",
    shortTitle: "E-Commerce",
    tag: "Catalog / Conversion",
    cover: "/media/ecomm.webp",
    description: "Clean, consistent, detailed product imagery that builds customer confidence and creates a seamless online shopping experience.",
    imageCount: 24,
    videoCount: 0,
  },
  {
    slug: "events",
    title: "Event",
    shortTitle: "Event",
    tag: "Live / Documentary",
    cover: "/media/event.webp",
    description: "Vibrant storytelling photography and film for corporate events, weddings, launches, and the milestones that deserve to be remembered.",
    imageCount: 29,
    videoCount: 1,
  },
  {
    slug: "restoration",
    title: "Photo Restoration",
    shortTitle: "Photo Restoration",
    tag: "Archive / Revival",
    cover: "/media/restore.webp",
    description: "Meticulous restoration of faded, torn, and damaged photographs, preserving important memories while respecting the original image.",
    imageCount: 8,
    videoCount: 0,
  },
  {
    slug: "film",
    title: "Film Photography",
    shortTitle: "Film Photography",
    tag: "Analog / Documentary",
    cover: "/galleries/film/image-001.webp",
    description: "Character-rich photography with an analog sensibility—natural texture, deliberate composition, and honest moments shaped into timeless visual stories.",
    imageCount: 12,
    videoCount: 0,
  },
  {
    slug: "drones",
    title: "Drone Services",
    shortTitle: "Drone Services",
    tag: "Aerial / Motion",
    cover: "/media/drone.webp",
    description: "Aerial photography and videography for real estate, events, landscapes, and campaigns that need a compelling new perspective.",
    imageCount: 0,
    videoCount: 5,
    animations: ["/galleries/drones/animation-001.gif"],
  },
];

export function getService(slug: string) {
  return services.find((service) => service.slug === slug);
}

export function galleryFiles(service: Service, type: "image" | "video") {
  const count = type === "image" ? service.imageCount : service.videoCount;
  const extension = type === "image" ? "webp" : "webm";
  return Array.from({ length: count }, (_, index) =>
    `/galleries/${service.slug}/${type}-${String(index + 1).padStart(3, "0")}.${extension}`,
  );
}
