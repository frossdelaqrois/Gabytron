import { services } from "./services-data";
import { SiteHeader } from "./components/SiteHeader";

const reelImages = [
  { src: "/galleries/campaigns/image-001.webp", href: "/services/campaigns", alt: "Campaign photography" },
  { src: "/galleries/portraits/image-014.webp", href: "/services/portraits", alt: "Portrait photography" },
  { src: "/galleries/products/image-006.webp", href: "/services/products", alt: "Product photography" },
  { src: "/galleries/lookbook/image-009.webp", href: "/services/lookbook", alt: "Lookbook photography" },
  { src: "/galleries/events/image-012.webp", href: "/services/events", alt: "Event photography" },
  { src: "/galleries/ecommerce/image-008.webp", href: "/services/ecommerce", alt: "E-commerce photography" },
  { src: "/galleries/corporate/image-004.webp", href: "/services/corporate", alt: "Corporate photography" },
  { src: "/galleries/campaigns/image-032.webp", href: "/services/campaigns", alt: "Fashion campaign photography" },
];

export default function Home() {
  return (
    <main id="top">
      <SiteHeader onHomePage />

      <section className="hero" aria-labelledby="hero-title">
        <div className="heroReel" aria-hidden="true">
          <div className="heroReelTrack">
            <div className="heroReelSet">
              {reelImages.map((image) => <img src={image.src} alt="" key={image.src} />)}
            </div>
            <div className="heroReelSet">
              {reelImages.map((image) => <img src={image.src} alt="" key={`duplicate-${image.src}`} />)}
            </div>
          </div>
        </div>
        <div className="heroScrim" aria-hidden="true" />
        <div className="heroCopy">
          <p className="eyebrow"><span>●</span> Kuala Lumpur · Available worldwide</p>
          <h1 id="hero-title">MAKE<br />EVERY FRAME<br /><em>MATTER.</em></h1>
          <p className="heroLede">Photography and film built around real ideas, bold direction, and stories worth remembering.</p>
          <div className="heroActions">
            <a className="button primary" href="#services">Explore our work <span>↘</span></a>
            <a className="button secondary" href="https://wa.me/60122938950">Start a project ↗</a>
          </div>
        </div>
        <p className="heroIndex"><span>01</span> / VISUAL STORIES</p>
      </section>

      <div className="ticker" aria-label="Gabytron creative services">
        <div>PHOTO <i>✦</i> FILM <i>✦</i> CREATIVE DIRECTION <i>✦</i> RETOUCHING <i>✦</i> PHOTO <i>✦</i> FILM <i>✦</i> CREATIVE DIRECTION <i>✦</i> RETOUCHING <i>✦</i></div>
      </div>

      <section className="about section" id="about">
        <div className="aboutImages">
          <div className="aboutImageFrame aboutPrimaryFrame">
            <img className="aboutPrimary" src="/media/about-2.webp" alt="Gabytron production portrait" />
          </div>
          <div className="aboutImageFrame aboutSecondaryFrame">
            <img className="aboutSecondary" src="/media/about-1.webp" alt="Behind the scenes with Gabytron Productions" />
          </div>
          <span className="roundel">PHOTO + FILM<br />KUALA LUMPUR</span>
        </div>
        <div className="aboutCopy">
          <p className="kicker">About the studio</p>
          <h2>BIG IDEAS.<br /><span>PRECISE EXECUTION.</span></h2>
          <p>We are a premier photo and video production company creating visual content that captivates audiences and brings stories to life with precision and artistry.</p>
          <p>Based in Kuala Lumpur and working with clients locally and globally, we combine active listening, inspired creation, and collaborative direction to shape every brief into memorable work.</p>
          <div className="principles">
            <span><b>01</b> Collaborate</span>
            <span><b>02</b> Listen</span>
            <span><b>03</b> Create</span>
          </div>
        </div>
      </section>

      <section className="services section" id="services">
        <div className="servicesHeading">
          <div>
            <p className="kicker">What we do</p>
            <h2>WORK THAT<br /><span>MOVES PEOPLE.</span></h2>
          </div>
          <p>From concept development and art direction to production and retouching, every detail is shaped around your audience, your platform, and your story.</p>
        </div>
        <div className="serviceGrid">
          {services.map((service) => (
            <article className="serviceCard" key={service.title}>
              <a className="serviceImage" href={`/services/${service.slug}`} aria-label={`View the ${service.shortTitle} gallery`}>
                <img src={service.cover} alt="" />
              </a>
              <p>{service.tag}</p>
              <h3><a href={`/services/${service.slug}`}>{service.shortTitle}</a></h3>
              <a href={`/services/${service.slug}`} aria-label={`View the ${service.shortTitle} gallery`}>View full gallery <span>↗</span></a>
            </article>
          ))}
        </div>
      </section>

      <section className="process section">
        <p className="kicker">The Gabytron approach</p>
        <h2>FROM FIRST THOUGHT<br />TO <span>FINAL FRAME.</span></h2>
        <div className="processGrid">
          <article><b>01</b><h3>Discover</h3><p>We listen closely, find the real objective, and clarify the audience.</p></article>
          <article><b>02</b><h3>Shape</h3><p>Concept, art direction, casting, location, and production planning.</p></article>
          <article><b>03</b><h3>Create</h3><p>A focused shoot with space for the unexpected moments that make work sing.</p></article>
          <article><b>04</b><h3>Refine</h3><p>Thoughtful editing, colour, retouching, and delivery for every format.</p></article>
        </div>
      </section>

      <section className="contact" id="contact">
        <div className="contactCopy">
          <p className="kicker">Your next story starts here</p>
          <h2>LET&apos;S MAKE<br /><span>SOMETHING GREAT.</span></h2>
          <p>Tell us what you are building, launching, celebrating, or preserving. We would love to hear the story.</p>
          <div className="contactActions">
            <a className="button primary" href="https://wa.me/60122938950">WhatsApp us <span>↗</span></a>
            <a className="button secondary" href="https://www.instagram.com/gabytron.pro">Instagram <span>↗</span></a>
          </div>
        </div>
        <div className="contactDetails">
          <p><span>Based in</span><strong>Klang Valley<br />Malaysia</strong></p>
          <p><span>Call / WhatsApp</span><a href="https://wa.me/60122938950">+60 12-293 8950 ↗</a></p>
          <p><span>Follow</span><a href="https://www.instagram.com/gabytron.pro">@gabytron.pro ↗</a></p>
        </div>
      </section>

      <footer id="site-footer">
        <a className="brand originalBrand footerBrand" href="#top" aria-label="Gabytron Productions home">
          <img src="/media/logo.png" alt="Gabytron Productions" />
        </a>
        <p>Photo · Film · Creative Direction</p>
        <p>© 2026 Gabytron Productions · SSM 003222809-H</p>
      </footer>
    </main>
  );
}
