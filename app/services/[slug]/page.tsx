import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { galleryFiles, getService, services } from "../../services-data";
import { SiteHeader } from "../../components/SiteHeader";
import { RestorationComparisons } from "../../components/BeforeAfterSlider";

const portraitGroups = [
  {
    title: "Individual Portraits",
    description: "Tailored for professionals and creatives in their respective fields, including comedians, dancers, actors, and more. Let’s capture the inner star in you with portraits that reflect your unique personality and craft, helping you stand out.",
    collections: [
      { title: "Comedian & Actor Portrait", start: 15, end: 29 },
      { title: "Non-Corporate & Career", start: 67, end: 80 },
    ],
  },
  {
    title: "Corporate Portraits",
    description: "Perfect for executives, business professionals, and teams, these portraits are designed to reflect competence, professionalism, and approachability for corporate branding.",
    collections: [
      { title: "General Corporate Portrait", start: 46, end: 53 },
      { title: "Themed Corporate Portrait", start: 1, end: 14 },
      { title: "Corporate Event", start: 30, end: 45 },
    ],
  },
  {
    title: "Domestic Portraits",
    description: "Celebrate personal moments with warm, authentic portraits, whether it’s for families, couples, or individuals in a cozy and intimate setting.",
    collections: [{ title: "", start: 54, end: 66 }],
  },
];

const servicePhotoGroups: Record<string, typeof portraitGroups> = {
  campaigns: [
    {
      title: "Fashion Campaigns",
      description: "Highlight the essence of style and elegance with visually striking images tailored to represent brands and designers.",
      collections: [{ title: "Fashion & Apparel", start: 29, end: 38 }],
    },
    {
      title: "Beauty & Hair Campaigns",
      description: "Showcase beauty and hair products or services with captivating visuals that emphasize detail, vibrance, and style. From flawless makeup to stunning hairstyles, we deliver campaigns that inspire and connect with your audience.",
      collections: [{ title: "Beauty", start: 1, end: 8 }],
    },
    {
      title: "Product Campaigns",
      description: "Deliver compelling images that make products the star of the show, perfect for advertising.",
      collections: [
        { title: "Bag Campaigns", start: 39, end: 45 },
        { title: "Product Campaign with Human Subjects", start: 46, end: 55 },
        { title: "Product Only", start: 56, end: 71 },
      ],
    },
    {
      title: "Corporate Branding Campaigns",
      description: "Reinforce brand identity through polished visuals for websites, presentations, and advertising.",
      collections: [{ title: "Corporate Headshots", start: 9, end: 28 }],
    },
  ],
  lookbook: [
    {
      title: "",
      description: "",
      collections: [
        { title: "General Lookbook", start: 1, end: 14 },
        { title: "Lookbook + E-commerce", start: 15, end: 28 },
      ],
    },
  ],
  ecommerce: [
    {
      title: "",
      description: "",
      collections: [
        { title: "Lookbook + E-commerce", start: 11, end: 24 },
        { title: "Accessory Catalogue", start: 1, end: 10 },
      ],
    },
  ],
  products: [
    {
      title: "",
      description: "",
      collections: [
        { title: "Product Campaign with Human Subjects", start: 1, end: 10 },
        { title: "Product Campaign Samples without Human Subjects", start: 11, end: 26 },
      ],
    },
  ],
  corporate: [
    {
      title: "",
      description: "",
      collections: [
        { title: "General Corporate Portrait", start: 17, end: 24 },
        { title: "Corporate Event", start: 1, end: 16 },
      ],
    },
  ],
  events: [
    {
      title: "",
      description: "",
      collections: [
        { title: "Corporate Event", start: 14, end: 29 },
        { title: "Event Group", start: 1, end: 3 },
        { title: "Wedding", start: 4, end: 13 },
      ],
    },
  ],
};

export function generateStaticParams() {
  return services.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) return {};
  return {
    title: `${service.title} — Gabytron Productions`,
    description: service.description,
  };
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) notFound();

  const images = [...galleryFiles(service, "image"), ...(service.animations || [])];
  const videos = galleryFiles(service, "video");
  const galleryImages = galleryFiles(service, "image");
  const sampledGalleryImages = Array.from(
    { length: Math.min(6, galleryImages.length) },
    (_, index) => galleryImages[Math.floor(index * galleryImages.length / Math.min(6, galleryImages.length))],
  );
  const heroImages = Array.from(new Set([service.cover, ...(service.animations || []), ...sampledGalleryImages]));
  const groupedPhotoSections = service.slug === "portraits" ? portraitGroups : servicePhotoGroups[service.slug];

  return (
    <main className="galleryPage">
      <SiteHeader />

      <section
        className="galleryHero"
        data-photo-editor-background
        data-photo-editor-source={service.cover}
        style={{ "--gallery-cover": `url('${service.cover}')` } as React.CSSProperties}
      >
        <div className="galleryHeroImage" aria-hidden="true" />
        <div className="heroReel galleryHeroReel" aria-hidden="true">
          <div className="heroReelTrack">
            <div className="heroReelSet">
              {heroImages.map((src) => <img src={src} alt="" key={src} />)}
            </div>
            <div className="heroReelSet">
              {heroImages.map((src) => <img src={src} alt="" key={`duplicate-${src}`} />)}
            </div>
          </div>
        </div>
        <div className="galleryHeroScrim" aria-hidden="true" />
        <div className="galleryHeroCopy">
          <a className="galleryBack" href="/#services">← All services</a>
          <p className="eyebrow"><span>●</span> {service.tag}</p>
          <h1>{service.title}</h1>
          <p>{service.description}</p>
          <a className="button primary" href="#gallery">View the work <span>↘</span></a>
        </div>
      </section>

      <section className="galleryWork section" id="gallery">
        {service.slug !== "drones" && !groupedPhotoSections && (service.additionalCopy?.length || service.collections?.length) && (
          <aside className="originalServiceCopy" aria-label={`${service.title} service details`}>
            {service.additionalCopy?.map((paragraph) => <p className="serviceCopyLead" key={paragraph}>{paragraph}</p>)}
            {service.collections?.length && (
              <div className="serviceCollectionGrid">
                {service.collections.map((collection) => (
                  <article key={collection.title}>
                    <h3>{collection.title}</h3>
                    {collection.description && <p>{collection.description}</p>}
                  </article>
                ))}
              </div>
            )}
          </aside>
        )}

        {service.slug === "film" && (
          <aside className="artistFeature" aria-labelledby="emillio-title">
            <div className="artistPortrait">
              <img src="/featured/emillio/portrait.jpg" alt="Film photographer Emillio Daniel" />
              <span>Recommended<br />artist</span>
            </div>
            <div className="artistCopy">
              <p className="kicker">Gabytron Productions recommends</p>
              <h2 id="emillio-title">EMILLIO<br /><span>DANIEL.</span></h2>
              <p>Emillio Daniel is a professional Malaysian film photographer specialising in fine-art portraiture. Working across 35mm, medium-format, and large-format cameras, he combines the character of analog film with precise composition and modern strobe lighting to create distinctive, carefully considered portraits. Gabytron Productions recommends Emillio for clients seeking expressive portrait work with a strong artistic identity.</p>
              <a className="button artistLink" href="https://www.emilliodaniel.com/" target="_blank" rel="noreferrer">Visit his website <span>↗</span></a>
            </div>
            <div className="artistExamples" aria-label="Examples of Emillio Daniel's work">
              {[1, 2, 3, 4].map((index) => (
                <a href="https://www.emilliodaniel.com/" target="_blank" rel="noreferrer" key={index} aria-label={`View more of Emillio Daniel's work, example ${index}`}>
                  <img src={`/featured/emillio/work-${index}.jpg`} alt={`Fine-art film portrait by Emillio Daniel, example ${index}`} loading="lazy" />
                </a>
              ))}
            </div>
            <p className="artistCredit">Portrait and featured work © Emillio Daniel · <a href="https://www.emilliodaniel.com/" target="_blank" rel="noreferrer">emilliodaniel.com ↗</a></p>
          </aside>
        )}

        {service.slug !== "film" && service.slug !== "drones" && service.slug !== "restoration" && !groupedPhotoSections && (
          <>
            {images.length > 0 && (
              <div className="photoGallery">
                {images.map((src, index) => (
                  <figure key={src}>
                    <img src={src} alt={`${service.title} portfolio example ${index + 1}`} loading={index < 6 ? "eager" : "lazy"} />
                  </figure>
                ))}
              </div>
            )}
          </>
        )}

        {groupedPhotoSections && (
          <section className="groupedPortfolio" aria-label={`${service.title} photography collections`}>
            {service.additionalCopy?.[0] && <p className="groupedPageLead">{service.additionalCopy[0]}</p>}
            {groupedPhotoSections.map((group, groupIndex) => {
              const groupId = `${service.slug}-collection-${groupIndex + 1}`;
              return (
              <section className={`groupedGallerySection ${group.title ? "hasGroupHeading" : ""}`} key={`${group.title}-${groupIndex}`} aria-labelledby={group.title ? groupId : undefined}>
                {group.title && (
                  <header className="groupedGalleryHeader">
                    <p className="kicker">{service.slug === "portraits" ? "Portrait collection" : "Selected work"}</p>
                    <h2 id={groupId}>{group.title}</h2>
                    <p>{group.description}</p>
                  </header>
                )}
                {group.collections.map((collection) => {
                  const collectionImages = images.slice(collection.start - 1, collection.end);
                  return (
                    <article className="groupedCollection" key={`${group.title}-${collection.start}`}>
                      {collection.title && <h3>{collection.title}</h3>}
                      <div className="groupedPhotoGrid">
                        {collectionImages.map((src, index) => (
                          <figure key={src}>
                            <img src={src} alt={`${collection.title || group.title} example ${index + 1}`} loading="lazy" />
                          </figure>
                        ))}
                      </div>
                    </article>
                  );
                })}
              </section>
              );
            })}
          </section>
        )}

        {service.slug === "restoration" && (
          <RestorationComparisons
            pairs={Array.from({ length: Math.floor(images.length / 2) }, (_, index) => ({
              before: images[index * 2],
              after: images[index * 2 + 1],
            }))}
          />
        )}

        {videos.length > 0 && (
          <div className={`filmSection ${service.slug === "drones" ? "droneSamples" : ""}`}>
            <p className="kicker">{service.slug === "drones" ? "Original aerial collection" : "Motion work"}</p>
            <h2>{service.slug === "drones" ? <>DRONE <span>VIDEO SAMPLES.</span></> : <>WATCH THE <span>FILMS.</span></>}</h2>
            {service.slug === "lookbook" && <p className="watchNowLabel">Watch Now</p>}
            <div className="videoGallery">
              {videos.map((src, index) => {
                const hasAudio = service.audioVideoIndexes?.includes(index + 1) || false;
                return (
                  <video
                    key={src}
                    controls={hasAudio}
                    autoPlay={!hasAudio}
                    muted={!hasAudio}
                    loop={!hasAudio}
                    playsInline
                    preload={hasAudio ? "metadata" : "auto"}
                    aria-label={`${service.title} ${hasAudio ? "video" : "silent animated"} sample ${index + 1}`}
                  >
                    <source src={src} type="video/webm" />
                  </video>
                );
              })}
            </div>
          </div>
        )}
      </section>

      <section className="serviceContactCallout" aria-labelledby="service-contact-title">
        <p className="kicker">We Would Love To Hear From You</p>
        <h2 id="service-contact-title">CONTACT <span>US.</span></h2>
        <p>Our core beliefs: collaboration, active listening, and inspired creation.</p>
        <a className="button primary" href="https://wa.me/60122938950">Start a conversation <span>↗</span></a>
      </section>

      <section className="allServicesFooter" aria-labelledby="all-services-title">
        <div className="allServicesHeading">
          <div>
            <p className="kicker">Everything we offer</p>
            <h2 id="all-services-title">ALL <span>SERVICES.</span></h2>
          </div>
          <p>Jump directly to any Gabytron Productions service.</p>
        </div>
        <div className="allServicesGrid">
          {services.map((item) => (
            <a
              href={`/services/${item.slug}`}
              key={item.slug}
              className={item.slug === service.slug ? "current" : undefined}
              aria-current={item.slug === service.slug ? "page" : undefined}
            >
              <span>{item.tag}</span>
              <strong>{item.shortTitle}</strong>
              <b>{item.slug === service.slug ? "Current" : "↗"}</b>
            </a>
          ))}
        </div>
      </section>

      <footer id="site-footer">
        <a className="brand originalBrand footerBrand" href="/" aria-label="Gabytron Productions home">
          <img src="/media/logo.png" alt="Gabytron Productions" />
        </a>
        <a href="/#services">All services</a>
        <p>© 2026 Gabytron Productions</p>
      </footer>
    </main>
  );
}
