import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { SiteDto } from '../api/api.models';

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

  apply(site: SiteDto): void {
    const { seo } = site;
    this.title.setTitle(seo.title);
    if (seo.language) {
      this.document.documentElement.lang = seo.language;
    }
    const tags: { key: 'name' | 'property'; id: string; content: string }[] = [
      { key: 'name', id: 'description', content: seo.description },
      { key: 'property', id: 'og:type', content: 'website' },
      { key: 'property', id: 'og:title', content: seo.title },
      { key: 'property', id: 'og:description', content: seo.description },
      { key: 'name', id: 'twitter:card', content: 'summary' },
      { key: 'name', id: 'twitter:title', content: seo.title },
      { key: 'name', id: 'twitter:description', content: seo.description },
    ];
    for (const { key, id, content } of tags) {
      this.meta.updateTag({ [key]: id, content }, `${key}="${id}"`);
    }
    this.applyJsonLd(site);
  }

  private applyJsonLd(site: SiteDto): void {
    const email = site.contactLinks.find((link) => link.kind === 'email');
    const person = {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: `${capitalize(site.person.firstName)} ${capitalize(site.person.lastName)}`,
      description: site.seo.description,
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
