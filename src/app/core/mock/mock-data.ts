import type { PortfolioDto } from '../api/api.models';

/**
 * Projects, skills and roles, shaped like the API responses. Used by the mock API in
 * development, as the database seed (api/scripts/generate-seed.mjs) and as the reference
 * payload documented in API.md. Live content is edited in the admin panel.
 */
export const MOCK_PORTFOLIO: PortfolioDto = {
  projects: [
    {
      id: 'marsch',
      order: 1,
      name: 'Marsch',
      type: 'Hiking time planner',
      year: '2026',
      stack: 'SvelteKit / TypeScript / Swisstopo API',
      description:
        'Upload a GPX or KML route and get walking times, ascent and a printable Marschzeittabelle, based on the SAC formula.',
      artVariant: 3,
      coordinates: ['N 47.4245°', 'E 09.3767°'],
      url: 'https://marsch.mitjakurath.ch',
    },
    {
      id: 'koda',
      order: 2,
      name: 'Koda',
      type: 'API documentation platform',
      year: '2026',
      stack: 'Angular / Spring Boot / PostgreSQL',
      description:
        'Upload an OpenAPI spec, browse its endpoints and control access with JWT auth. Built for the security module M183.',
      artVariant: 1,
      coordinates: ['N 47.4245°', 'E 09.3767°'],
      url: 'https://github.com/mitja-kurath/koda',
    },
    {
      id: 'markdown2pdf',
      order: 3,
      name: 'markdown2pdf',
      type: 'Writing tool',
      year: '2026',
      stack: 'SvelteKit / TypeScript',
      description:
        'A Markdown editor with live preview and one-click A4 PDF export. Runs entirely in your browser.',
      artVariant: 2,
      coordinates: ['N 47.4245°', 'E 09.3767°'],
      url: 'https://m2p.mku.wtf',
    },
    {
      id: 'vst3-template',
      order: 4,
      name: 'VST3 Template',
      type: 'Audio plugin',
      year: '2026',
      stack: 'C++ / VST3 SDK / CMake',
      description:
        'A minimal VST3 plugin template without JUCE that passes Steinberg’s validator out of the box.',
      artVariant: 4,
      coordinates: ['N 47.4245°', 'E 09.3767°'],
      url: 'https://github.com/mitja-kurath/vst-template',
    },
  ],
  skills: [
    {
      id: 'essentials',
      order: 1,
      title: 'Essentials',
      items: ['TypeScript', 'Java', 'C#', 'C++', 'SQL'],
    },
    {
      id: 'navigation',
      order: 2,
      title: 'Navigation',
      items: ['Angular', 'Svelte / SvelteKit', 'Tailwind CSS', 'HTML & CSS', 'Vitest'],
    },
    {
      id: 'base-layer',
      order: 3,
      title: 'Base layer',
      items: ['Spring Boot', 'PostgreSQL', 'Docker', 'Cloudflare Workers', 'Git'],
    },
  ],
  experience: {
    roles: [
      {
        id: 'proffix',
        order: 1,
        year: '2023',
        title: 'Apprentice Developer',
        subtitle: 'Proffix Software AG',
        isCurrent: false,
      },
      {
        id: 'pfadi-flums',
        order: 2,
        year: '2025',
        title: 'Scout Leader',
        subtitle: 'Pfadi Flums',
        isCurrent: false,
      },
      {
        id: 'kyberna',
        order: 3,
        year: '2025',
        title: 'Apprentice Developer',
        subtitle: 'Kyberna AG · 4th year',
        isCurrent: true,
      },
      {
        id: 'informatiker-efz',
        order: 4,
        year: '2027',
        title: 'Informatiker EFZ',
        subtitle: 'Next summit',
        isCurrent: false,
      },
    ],
  },
};
