import { SiteContent } from './site-content.model';

/**
 * Static site texts. They rarely change, so they ship with the app instead of coming from
 * the API: edit them here and redeploy. Projects, skills and roles are loaded from the API.
 */
export const SITE_CONTENT: SiteContent = {
  seo: {
    title: 'Mitja Kurath – Base Camp',
    description:
      'Mitja Kurath, software developer and scout based in Switzerland. Building things that hold up in any weather.',
    language: 'en',
  },
  person: {
    firstName: 'MITJA',
    lastName: 'KURATH',
    initials: 'MK',
    ariaHomeLabel: 'Mitja Kurath, home',
  },
  timezone: 'Europe/Zurich',
  timezoneLabel: 'CET',
  footerCity: 'ST. GALLEN, CH',
  brandCoordinates: '47°25′N',
  navigation: [
    { label: 'Work', href: '#work', counter: 'projects' },
    { label: 'Notes', href: '#about', counter: 'notes' },
    { label: 'Kit', href: '#equipment', counter: 'skills' },
    { label: 'Contact', href: '#contact', counter: null, glyph: '↗' },
  ],
  hero: {
    coordinates: ['47° 25′ 28″ N', '09° 22′ 36″ E'],
    altitudeLabel: 'ALT.',
    altitude: 670,
    taglineLines: ['Software developer. Scout.', 'Building things that hold up', 'in any weather.'],
    ctaLabel: 'Follow the trail',
    ctaHref: '#work',
    scrollNote: 'SCROLL TO ASCEND',
  },
  sections: {
    work: {
      headingLines: ['Selected'],
      emphasis: 'waypoints.',
      emphasisInline: false,
      intro:
        'A selection of digital products, systems, and experiments made with clarity and built for the long route.',
    },
    about: {
      eyebrowLines: ['DEVELOPER BY TRADE', 'PATHFINDER BY NATURE'],
      quote: {
        before: 'Good systems, like good trails, should make the way forward',
        emphasis: 'feel obvious.',
      },
      paragraphs: [
        'I’m Mitja, a software developer based in Switzerland. I care about thoughtful interfaces, durable code, and reducing complex problems to their clearest form.',
        'Away from the screen, I lead a local scout group. It keeps me practical: plan well, adapt quickly, leave things better than you found them.',
      ],
      portraitLabel: '// PORTRAIT, SOMEWHERE OUTSIDE',
      stampLines: ['OUT', 'THERE'],
      stampSmall: 'EST. 1997',
      linkLabel: 'More about the route',
      linkHref: '#contact',
    },
    equipment: {
      headingLines: ['What’s in', 'the'],
      emphasis: 'pack.',
      emphasisInline: true,
      intro:
        '// A working kit for taking digital products from first sketch to reliable release.',
    },
    experience: {
      headingLines: ['Experience,'],
      emphasis: 'in elevation.',
      emphasisInline: false,
      introLines: ['Every role added perspective.', 'Every project raised the bar.'],
      altitudes: ['1,200 M', '2,000 M', '2,800 M'],
      currentLabel: 'NOW',
    },
    contact: {
      note: ['// THE VIEW IS BETTER', 'WHEN SHARED'],
      headingLines: ['LET’S BUILD', 'SOMETHING'],
      emphasis: 'TOGETHER.',
      emphasisInline: false,
    },
  },
  contactLinks: [
    {
      kind: 'email',
      label: 'Email',
      href: 'mailto:hi@mitjakurath.ch',
      hint: '0.0 KM · NOW',
      external: false,
      direction: 'right',
    },
    {
      kind: 'github',
      label: 'GitHub',
      href: 'https://github.com/mitja-kurath',
      hint: '1 CLICK · NEARBY',
      external: true,
      direction: 'left',
    },
    {
      kind: 'linkedin',
      label: 'LinkedIn',
      href: 'https://www.linkedin.com/in/mitja-kurath-b40827323/',
      hint: '2 MIN · NORTH',
      external: true,
      direction: 'right',
    },
  ],
  contactForm: {
    title: 'Summit register',
    nameLabel: 'Name',
    emailLabel: 'Email',
    messageLabel: 'Message',
    submitLabel: 'Sign the log',
    sendingLabel: 'Signing…',
    successMessage: 'Logged. I’ll get back to you soon.',
    stampLabel: 'Logged',
    errorMessage: 'The message could not be sent. Please try again or use email.',
    spamCheckMessage: 'One moment, the spam check is still running.',
    rateLimitMessage: 'Too many messages in a short time. Please wait a minute.',
  },
  footer: {
    localTimeLabel: 'LOCAL TIME',
    compassNorth: 'N',
    compassLabelLines: ['KEEP', 'EXPLORING'],
    credit: 'Made with care & a little trail dust.',
    ownerName: 'MITJA KURATH',
    backToTopLabel: 'BACK TO BASE CAMP',
    backToTopHref: '#base-camp',
  },
};
