import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { SiteContent } from '../content/site-content.model';

const JSON_LD_ID = 'person-jsonld';

/**
 * Applies `site` to <title>, description, Open Graph / Twitter tags, <html lang> and a
 * schema.org `Person` JSON-LD block. Runs during pre-rendering, so all of it is in the
 * static HTML that crawlers and link previews read.
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  apply(site: SiteContent): void {
    const { seo } = site;
    this.title.setTitle(seo.title);
    if (seo.language) {
      this.document.documentElement.lang = seo.language;
    }
    const url = `${seo.siteUrl}/`;
    const image = new URL(seo.image, seo.siteUrl).href;
    const tags: { key: 'name' | 'property'; id: string; content: string }[] = [
      { key: 'name', id: 'description', content: seo.description },
      { key: 'property', id: 'og:type', content: 'website' },
      { key: 'property', id: 'og:site_name', content: seo.title },
      { key: 'property', id: 'og:url', content: url },
      { key: 'property', id: 'og:image', content: image },
      { key: 'property', id: 'og:image:width', content: '1200' },
      { key: 'property', id: 'og:image:height', content: '630' },
      { key: 'property', id: 'og:image:alt', content: seo.imageAlt },
      { key: 'property', id: 'og:title', content: seo.title },
      { key: 'property', id: 'og:description', content: seo.description },
      { key: 'name', id: 'twitter:card', content: 'summary_large_image' },
      { key: 'name', id: 'twitter:title', content: seo.title },
      { key: 'name', id: 'twitter:description', content: seo.description },
      { key: 'name', id: 'twitter:image', content: image },
      { key: 'name', id: 'twitter:image:alt', content: seo.imageAlt },
    ];
    for (const { key, id, content } of tags) {
      this.meta.updateTag({ [key]: id, content }, `${key}="${id}"`);
    }
    this.applyCanonical(url);
    this.applyJsonLd(site);
  }

  private applyCanonical(href: string): void {
    let link = this.document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', href);
  }

  private applyJsonLd(site: SiteContent): void {
    const email = site.contactLinks.find((link) => link.kind === 'email');
    const person = {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: `${capitalize(site.person.firstName)} ${capitalize(site.person.lastName)}`,
      description: site.seo.description,
      url: `${site.seo.siteUrl}/`,
      image: new URL(site.seo.image, site.seo.siteUrl).href,
      ...(email ? { email: email.href.replace(/^mailto:/, '') } : {}),
      sameAs: site.contactLinks.filter((link) => link.external).map((link) => link.href),
    };
    let script = this.document.getElementById(JSON_LD_ID);
    if (!script) {
      script = this.document.createElement('script');
      script.id = JSON_LD_ID;
      script.setAttribute('type', 'application/ld+json');
      this.document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(person).replace(/</g, '\\u003c');
  }
}

function capitalize(word: string): string {
  return word.charAt(0).toLocaleUpperCase() + word.slice(1).toLocaleLowerCase();
}
