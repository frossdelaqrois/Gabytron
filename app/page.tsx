const services = [
  { title: "Campaigns", image: "/media/campaign.webp", tag: "Brand / Editorial" },
  { title: "Lookbook", image: "/media/lookbook.webp", tag: "Seasonal / Fashion" },
  { title: "Corporate Branding", image: "/media/corp.webp", tag: "People / Business" },
  { title: "Product Shoot", image: "/media/product.webp", tag: "Studio / Detail" },
  { title: "Portraiture", image: "/media/portrait.webp", tag: "Character / Story" },
  { title: "e-Commerce", image: "/media/ecomm.webp", tag: "Catalog / Conversion" },
  { title: "Event", image: "/media/event.webp", tag: "Live / Documentary" },
  { title: "Photo Restoration", image: "/media/restore.webp", tag: "Archive / Revival" },
  { title: "Drone Services", image: "/media/drone.webp", tag: "Aerial / Motion" },
];

export default function Home() {
  return (
    <main id="top">
      <header className="siteHeader">
        <a className="brand" href="#top" aria-label="Gabytron Productions home">
          GABYTRON<span>●</span>
        </a>
        <nav aria-label="Main navigation">
          <a href="#about">About</a>
          <a href="#services">Services</a>
          <a className="navCta" href="#contact">Let&apos;s create ↗</a>
        </nav>
      </header>

      <section className="hero" aria-labelledby="hero-title">
        <div className="heroImage" aria-hidden="true" />
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
          <img className="aboutPrimary" src="/media/about-2.webp" alt="Gabytron production portrait" />
          <img className="aboutSecondary" src="/media/about-1.webp" alt="Behind the scenes with Gabytron Productions" />
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
          {services.map((service, index) => (
            <article className="serviceCard" key={service.title}>
              <div className="serviceImage">
                <img src={service.image} alt="" />
                <span>{String(index + 1).padStart(2, "0")}</span>
              </div>
              <p>{service.tag}</p>
              <h3>{service.title}</h3>
              <a href="#contact" aria-label={`Ask about ${service.title}`}>Discuss this service <span>↗</span></a>
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

      <footer>
        <a className="brand" href="#top">GABYTRON<span>●</span></a>
        <p>Photo · Film · Creative Direction</p>
        <p>© 2026 Gabytron Productions · SSM 003222809-H</p>
      </footer>
    </main>
  );
}
