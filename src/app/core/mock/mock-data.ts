import type { PortfolioDto } from '../api/api.models';

/**
 * Projects, skills and roles of the original React site, shaped like the API responses.
 * This is the reference payload documented in API.md.
 */
export const MOCK_PORTFOLIO: PortfolioDto = {
  projects: [
    {
      id: 'alpine-signal',
      order: 1,
      name: 'Alpine Signal',
      type: 'Field communication',
      year: '2025',
      stack: 'React / TypeScript / WebSockets',
      description:
        'A resilient coordination platform built for teams operating beyond reliable coverage.',
      artVariant: 1,
      coordinates: ['N 47.3769°', 'E 08.5417°'],
    },
    {
      id: 'nadel',
      order: 2,
      name: 'Nadel',
      type: 'Design infrastructure',
      year: '2024',
      stack: 'Storybook / Tokens / Figma API',
      description: 'A precise design system that helps product teams find one shared direction.',
      artVariant: 2,
      coordinates: ['N 47.3769°', 'E 08.5417°'],
    },
    {
      id: 'contour',
      order: 3,
      name: 'Contour',
      type: 'Data exploration',
      year: '2024',
      stack: 'D3.js / Mapbox / Node',
      description:
        'Complex environmental data translated into a landscape people can understand.',
      artVariant: 3,
      coordinates: ['N 47.3769°', 'E 08.5417°'],
    },
    {
      id: 'feuerstelle',
      order: 4,
      name: 'Feuerstelle',
      type: 'Community platform',
      year: '2023',
      stack: 'Next.js / PostgreSQL / PWA',
      description: 'A digital gathering place for local groups, made to work in the field.',
      artVariant: 4,
      coordinates: ['N 47.3769°', 'E 08.5417°'],
    },
  ],
  skills: [
    {
      id: 'essentials',
      order: 1,
      title: 'Essentials',
      items: ['TypeScript', 'React', 'Next.js', 'Node.js', 'CSS systems'],
    },
    {
      id: 'navigation',
      order: 2,
      title: 'Navigation',
      items: ['Product thinking', 'UX engineering', 'Prototyping', 'Accessibility'],
    },
    {
      id: 'base-layer',
      order: 3,
      title: 'Base layer',
      items: ['PostgreSQL', 'Docker', 'CI / CD', 'Cloud infrastructure'],
    },
  ],
  experience: {
    roles: [
      {
        id: 'junior-developer',
        order: 1,
        year: '2018',
        title: 'Junior Developer',
        subtitle: 'First ascent',
        isCurrent: false,
      },
      {
        id: 'software-engineer',
        order: 2,
        year: '2020',
        title: 'Software Engineer',
        subtitle: 'Product team',
        isCurrent: false,
      },
      {
        id: 'senior-developer',
        order: 3,
        year: '2022',
        title: 'Senior Developer',
        subtitle: 'Technical lead',
        isCurrent: false,
      },
      {
        id: 'independent',
        order: 4,
        year: '2025',
        title: 'Independent',
        subtitle: 'New routes',
        isCurrent: true,
      },
    ],
  },
};
