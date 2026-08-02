export type Service = {
  slug: string;
  title: string;
  shortTitle: string;
  tag: string;
  cover: string;
  description: string;
  additionalCopy?: string[];
  collections?: { title: string; description?: string }[];
  imageCount: number;
  videoCount: number;
  audioVideoIndexes?: number[];
  animations?: string[];
};

export const services: Service[] = [
  {
    slug: "campaigns",
    title: "Campaigns",
    shortTitle: "Campaigns",
    tag: "Brand / Editorial",
    cover: "/media/campaign.webp",
    description: "Campaign photography is the art of storytelling through impactful visuals. Whether it’s a bold fashion campaign, a radiant beauty showcase, or a brand-focused corporate shoot, our expertise lies in creating images that resonate with your audience.",
    additionalCopy: ["At Gabytron Productions, we design campaigns that inspire, connect, and elevate your brand to new heights. Let us transform your vision into imagery that leaves a lasting impression."],
    collections: [
      { title: "Fashion Campaigns", description: "Highlight the essence of style and elegance with visually striking images tailored to represent brands and designers." },
      { title: "Fashion & Apparel" },
      { title: "Beauty & Hair Campaigns", description: "Showcase beauty and hair products or services with captivating visuals that emphasize detail, vibrance, and style. From flawless makeup to stunning hairstyles, we deliver campaigns that inspire and connect with your audience." },
      { title: "Beauty" },
      { title: "Product Campaigns", description: "Deliver compelling images that make products the star of the show, perfect for advertising." },
      { title: "Bag Campaigns" },
      { title: "Product campaign with Human Subjects" },
      { title: "Product Only" },
    ],
    imageCount: 71,
    videoCount: 6,
    audioVideoIndexes: [6],
  },
  {
    slug: "lookbook",
    title: "Lookbook / Editorial",
    shortTitle: "Lookbook",
    tag: "Seasonal / Fashion",
    cover: "/media/lookbook.webp",
    description: "Bring your fashion or thematic vision to life with high-end editorial photography. We craft visually compelling lookbooks that tell a story and make your brand stand out.",
    collections: [
      { title: "General Lookbook" },
      { title: "Lookbook + E-commerce" },
      { title: "Lookbook Video Samples" },
    ],
    imageCount: 28,
    videoCount: 1,
    audioVideoIndexes: [1],
  },
  {
    slug: "corporate",
    title: "Corporate Branding",
    shortTitle: "Corporate Branding",
    tag: "People / Business",
    cover: "/media/corp.webp",
    description: "Your brand speaks volumes about who you are and what you stand for. A consistent, professional image is key to building trust and authority with your audience. From your leadership team to the products you deliver, every element of your brand should reflect the values and vision that set you apart.",
    additionalCopy: ["With tailored visuals that align with your identity, you can establish a strong presence, communicate credibility, and solidify your position as a leader in your industry."],
    imageCount: 24,
    videoCount: 5,
    audioVideoIndexes: [1, 2, 3, 5],
    animations: ["/galleries/corporate/animation-001.gif"],
  },
  {
    slug: "products",
    title: "Product Shoot",
    shortTitle: "Product Shoot",
    tag: "Studio / Detail",
    cover: "/media/product.webp",
    description: "Your product is more than just an item—it’s a representation of your brand’s story and values. High-quality product photography goes beyond capturing an image; it creates a visual narrative that connects with your audience. Through thoughtful styling, creative setups, and expert lighting techniques, product photography is designed to showcase your product’s uniqueness and elevate your brand identity.",
    additionalCopy: ["Whether for advertising campaigns, lookbooks, or promotional materials, these images leave a lasting impression and set your brand apart in a crowded marketplace."],
    imageCount: 26,
    videoCount: 5,
  },
  {
    slug: "portraits",
    title: "Portraiture",
    shortTitle: "Portraiture",
    tag: "Character / Story",
    cover: "/media/portrait.webp",
    description: "Every person has a story, and our portrait photography captures yours with authenticity and elegance. From professional headshots to family milestones or creative personal expressions, we create portraits that go beyond the surface, reflecting your personality and purpose.",
    additionalCopy: ["At Gabytron Productions, we craft timeless portraits that celebrate individuality and connection, making every photo a meaningful keepsake."],
    collections: [
      { title: "Individual Portraits", description: "Tailored for professionals and creatives in their respective fields, including comedians, dancers, actors, and more. Let’s capture the inner star in you with portraits that reflect your unique personality and craft, helping you stand out." },
      { title: "Comedian & Actor Portrait" },
      { title: "Non-Corporate & Career" },
      { title: "Corporate Portraits", description: "Perfect for executives, business professionals, and teams, these portraits are designed to reflect competence, professionalism, and approachability for corporate branding." },
      { title: "General Corporate Portrait" },
      { title: "Themed Corporate Portrait" },
      { title: "Corporate Event" },
      { title: "Domestic Portraits", description: "Celebrate personal moments with warm, authentic portraits, whether it’s for families, couples, or individuals in a cozy and intimate setting." },
    ],
    imageCount: 80,
    videoCount: 0,
  },
  {
    slug: "ecommerce",
    title: "E-Commerce",
    shortTitle: "E-Commerce",
    tag: "Catalog / Conversion",
    cover: "/media/ecomm.webp",
    description: "In the fast-paced world of online retail, customers make purchasing decisions in seconds. E-commerce photography ensures your products stand out with clear, detailed, and professional visuals that highlight every feature. By using clean backgrounds, consistent lighting, and multiple angles, e-commerce images provide transparency and build customer confidence.",
    additionalCopy: ["These visuals aren’t just functional—they’re essential for creating a seamless shopping experience and establishing trust in your brand. Great e-commerce photography doesn’t just showcase your products; it drives conversions and keeps customers coming back."],
    collections: [
      { title: "Lookbook + E-commerce" },
      { title: "Accessory Catalogue" },
    ],
    imageCount: 24,
    videoCount: 0,
  },
  {
    slug: "events",
    title: "Event",
    shortTitle: "Event",
    tag: "Live / Documentary",
    cover: "/media/event.webp",
    description: "Events are milestones filled with emotions, connections, and achievements. At Gabytron Productions, we specialize in capturing the essence of these moments through vibrant, storytelling photography.",
    additionalCopy: ["From corporate events and weddings to product launches, our team ensures no detail is overlooked. With every shot, we preserve the memories that matter most, creating visuals you’ll cherish long after the event has passed."],
    imageCount: 29,
    videoCount: 1,
  },
  {
    slug: "restoration",
    title: "Photo Restoration",
    shortTitle: "Photo Restoration",
    tag: "Archive / Revival",
    cover: "/media/restore.webp",
    description: "Preserve your memories with expert photo restoration services. Whether it’s a faded, damaged, or torn photograph, we restore it to its former glory with meticulous attention to detail.",
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
    title: "Drones",
    shortTitle: "Drone Services",
    tag: "Aerial / Motion",
    cover: "/galleries/drones/animation-001.gif",
    description: "Take your visuals to new heights with stunning aerial photography and videography. Perfect for real estate, events, landscapes, or creative campaigns, our drone services offer a unique perspective that captivates and inspires.",
    collections: [{ title: "Drone Video Samples" }],
    imageCount: 0,
    videoCount: 5,
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
