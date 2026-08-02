import { services } from "../services-data";

export function SiteHeader({ onHomePage = false }: { onHomePage?: boolean }) {
  return (
    <div className="globalHeader">
      <header className="siteHeader">
        <a className="brand originalBrand" href="/" aria-label="Gabytron Productions home">
          <img src="/media/logo.png" alt="Gabytron Productions" />
        </a>

        <nav className="desktopNav" aria-label="Main navigation">
          <a href={onHomePage ? "#about" : "/#about"}>About</a>
          <span className="quickNavPrompt">Services <b>↓</b></span>
          <a className="navCta" href={onHomePage ? "#contact" : "/#contact"}>Let&apos;s create ↗</a>
        </nav>

        <details className="mobileMenu">
          <summary>Menu <span>＋</span></summary>
          <div className="mobileMenuPanel" role="navigation" aria-label="Mobile navigation">
            <a href="/">Home</a>
            <a href="/#about">About</a>
            {services.map((service) => (
              <a href={`/services/${service.slug}`} key={service.slug}>{service.shortTitle}<span>↗</span></a>
            ))}
            <a className="mobileContact" href="/#contact">Start a project ↗</a>
          </div>
        </details>
      </header>

      <div className="quickNavPanel">
        <div className="quickNavHeading">
          <div>
            <span>Quick navigation</span>
            <strong>Explore the work</strong>
          </div>
          <a href="/#services">View all services ↘</a>
        </div>
        <div className="quickNavGrid" role="navigation" aria-label="Service pages">
          {services.map((service) => (
            <a href={`/services/${service.slug}`} key={service.slug}>
              <span>{service.tag}</span>
              <strong>{service.shortTitle}</strong>
              <b>↗</b>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
