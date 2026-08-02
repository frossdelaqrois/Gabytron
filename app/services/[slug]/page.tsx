import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { galleryFiles, getService, services } from "../../services-data";
import { SiteHeader } from "../../components/SiteHeader";

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

        {service.slug !== "film" && (
          <>
            <div className="galleryIntro">
              <div>
                <p className="kicker">Selected work</p>
                <h2>THE FULL<br /><span>COLLECTION.</span></h2>
              </div>
              <p>{images.length > 0 ? `${images.length} photographs` : "Aerial film collection"}{videos.length > 0 ? ` · ${videos.length} films` : ""}. Every example from the original Gabytron service portfolio is included here.</p>
            </div>

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

        {videos.length > 0 && (
          <div className="filmSection">
            <p className="kicker">Motion work</p>
            <h2>WATCH THE <span>FILMS.</span></h2>
            <div className="videoGallery">
              {videos.map((src, index) => (
                <video key={src} controls preload="metadata" aria-label={`${service.title} video sample ${index + 1}`}>
                  <source src={src} type="video/webm" />
                </video>
              ))}
            </div>
          </div>
        )}
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
