import { RoyalThemeId } from '../types/saas.ts';

export const ALLOWED_ROYAL_THEMES: RoyalThemeId[] = [
  'royal-gold',
  'rose-elegance',
  'bridal-royale',
  'emerald-luxe',
  'mocha-signature',
  'rose-luxe',
];

export function isValidRoyalTheme(id: unknown): id is RoyalThemeId {
  return typeof id === 'string' && (ALLOWED_ROYAL_THEMES as string[]).includes(id);
}

export function resolveSafeThemeId(id: unknown, fallback: RoyalThemeId = 'royal-gold'): RoyalThemeId {
  return isValidRoyalTheme(id) ? id : fallback;
}

export function resolveThemeAlias(raw: unknown): RoyalThemeId | null {
  if (typeof raw !== 'string' || !raw.trim()) return null;
  const clean = raw.trim().toLowerCase().replace(/_/g, '-');
  if (isValidRoyalTheme(clean)) return clean;
  const aliasMap: Record<string, RoyalThemeId> = {
    royal: 'royal-gold',
    gold: 'royal-gold',
    '1': 'royal-gold',
    elegance: 'rose-elegance',
    blush: 'rose-elegance',
    '2': 'rose-elegance',
    bridal: 'bridal-royale',
    crimson: 'bridal-royale',
    '3': 'bridal-royale',
    emerald: 'emerald-luxe',
    spa: 'emerald-luxe',
    '4': 'emerald-luxe',
    mocha: 'mocha-signature',
    espresso: 'mocha-signature',
    '5': 'mocha-signature',
    rose: 'rose-luxe',
    pink: 'rose-luxe',
    glamour: 'rose-luxe',
    '6': 'rose-luxe',
  };
  return aliasMap[clean] || null;
}

export interface RoyalThemeTokens {
  id: RoyalThemeId;
  name: string;
  tagline: string;
  description: string;
  layoutVariant:
    | 'editorial-noir'
    | 'parisian-split'
    | 'regal-arch'
    | 'botanical-grid'
    | 'architectural-minimal'
    | 'rose-luxe-pink';
  swatches: [string, string, string];
  palette: {
    canvasBg: string;
    surfaceBg: string;
    elevatedBg: string;
    heroBg: string;
    heroText: string;
    heroMuted: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    accentPrimary: string;
    accentSecondary: string;
    buttonBg: string;
    buttonText: string;
    borderSubtle: string;
    borderAccent: string;
    footerBg: string;
    footerText: string;
  };
  typography: {
    headingFont: string;
    heroAlignment: 'left' | 'center';
    serviceCardStyle: 'bordered' | 'editorial-row' | 'framed' | 'photo-card';
  };
  defaultCopy: {
    tagline: string;
    heroHeadline: string;
    heroSubheadline: string;
    servicesKicker: string;
    servicesHeading: string;
    aboutTitle: string;
    aboutDescription: string;
  };
  previewSvgDataUri: string;
}

/**
 * Pure visual, watermark-free luxury salon studio & bridal artwork generator for each of the 6 themes.
 * Zero text or external branding is ever stamped onto the image.
 */
function createLuxurySvgDataUri(config: {
  bg1: string;
  bg2: string;
  accent: string;
  secondary: string;
  motif: 'arch' | 'columns' | 'frames' | 'botanical' | 'travertine' | 'rose-luxe';
}): string {
  const { bg1, bg2, accent, secondary, motif } = config;
  let motifMarkup = '';

  if (motif === 'rose-luxe') {
    motifMarkup = `
      <!-- Luxury Pink Salon Studio with Arched LED Mirrors, Chandeliers & Velvet Chairs -->
      <polygon points="0,560 1000,560 840,410 160,410" fill="#12090e" opacity="0.82"/>
      <line x1="160" y1="410" x2="840" y2="410" stroke="${accent}" stroke-opacity="0.35" stroke-width="1.5"/>
      <!-- Left & Right Arched Ring-Light Mirrors -->
      <rect x="95" y="70" width="185" height="310" rx="92" fill="#23131b" stroke="${secondary}" stroke-width="2.5" opacity="0.88"/>
      <circle cx="187" cy="195" r="46" fill="none" stroke="#ffffff" stroke-width="4" opacity="0.55"/>
      <rect x="720" y="70" width="185" height="310" rx="92" fill="#23131b" stroke="${secondary}" stroke-width="2.5" opacity="0.88"/>
      <circle cx="812" cy="195" r="46" fill="none" stroke="#ffffff" stroke-width="4" opacity="0.55"/>
      <!-- Center Grand Arch Mirror & Vanity -->
      <path d="M 355 390 L 355 175 A 145 145 0 0 1 645 175 L 645 390 Z" fill="#2d1722" stroke="${accent}" stroke-width="3" opacity="0.92"/>
      <path d="M 375 390 L 375 185 A 125 125 0 0 1 625 185 L 625 390 Z" fill="none" stroke="${secondary}" stroke-width="1.2" stroke-dasharray="5 5" opacity="0.55"/>
      <circle cx="500" cy="220" r="62" fill="none" stroke="#fbcfe8" stroke-width="3.5" opacity="0.65"/>
      <!-- Velvet Styling Lounge Chairs -->
      <path d="M 415 445 Q 415 365 500 365 Q 585 365 585 445 L 568 510 L 432 510 Z" fill="${accent}" opacity="0.78" stroke="${secondary}" stroke-width="2"/>
      <path d="M 0 495 Q 320 445 560 485 T 1000 460 L 1000 560 L 0 560 Z" fill="#fff5f9" opacity="0.92"/>
    `;
  } else if (motif === 'arch') {
    // Bridal Royale: Maharani Jharokha Palace Arch & Bridal Shringar Silhouette
    motifMarkup = `
      <rect x="44" y="36" width="912" height="488" rx="18" fill="none" stroke="${accent}" stroke-width="1.8" opacity="0.5"/>
      <path d="M 220 510 L 220 210 Q 220 105 365 92 Q 455 82 500 48 Q 545 82 635 92 Q 780 105 780 210 L 780 510" fill="none" stroke="${accent}" stroke-width="2.8" opacity="0.82"/>
      <path d="M 244 510 L 244 220 Q 244 125 375 112 Q 460 102 500 72 Q 540 102 625 112 Q 756 125 756 220 L 756 510" fill="${secondary}" fill-opacity="0.08" stroke="${accent}" stroke-width="1.2" stroke-dasharray="6 5" opacity="0.7"/>
      <!-- Royal Chandelier & Bridal Mandala -->
      <circle cx="500" cy="275" r="128" fill="none" stroke="${accent}" stroke-width="2" opacity="0.65"/>
      <circle cx="500" cy="275" r="96" fill="${accent}" fill-opacity="0.16" stroke="${secondary}" stroke-width="1.4" stroke-dasharray="4 4"/>
      <!-- Bridal Crown / Maang Tikka & Necklace -->
      <path d="M 432 250 Q 500 285 568 250" fill="none" stroke="${accent}" stroke-width="3.5"/>
      <circle cx="500" cy="264" r="10" fill="${accent}"/>
      <path d="M 415 335 Q 500 385 585 335" fill="none" stroke="${accent}" stroke-width="7"/>
      <path d="M 398 358 Q 500 415 602 358" fill="none" stroke="${secondary}" stroke-width="3" stroke-dasharray="6 4"/>
    `;
  } else if (motif === 'columns') {
    // Royal Gold: Obsidian Noir & 24K Gold Luxury Salon Mirrors & Chandelier
    motifMarkup = `
      <rect x="60" y="45" width="880" height="470" fill="none" stroke="${accent}" stroke-width="1.8" opacity="0.55"/>
      <rect x="78" y="63" width="844" height="434" fill="none" stroke="${accent}" stroke-width="0.9" opacity="0.35"/>
      <!-- 3 Grand Gold Arched Salon Mirrors -->
      <path d="M 155 445 L 155 210 A 85 85 0 0 1 325 210 L 325 445 Z" fill="#171411" stroke="${accent}" stroke-width="2.5" opacity="0.88"/>
      <path d="M 385 445 L 385 170 A 115 115 0 0 1 615 170 L 615 445 Z" fill="#1f1a15" stroke="${accent}" stroke-width="3.2"/>
      <path d="M 675 445 L 675 210 A 85 85 0 0 1 845 210 L 845 445 Z" fill="#171411" stroke="${accent}" stroke-width="2.5" opacity="0.88"/>
      <!-- Warm Gold Ring Lights & Chandelier Drops -->
      <circle cx="240" cy="275" r="42" fill="none" stroke="${secondary}" stroke-width="2.2" opacity="0.55"/>
      <circle cx="500" cy="255" r="58" fill="none" stroke="${accent}" stroke-width="3" opacity="0.85"/>
      <circle cx="760" cy="275" r="42" fill="none" stroke="${secondary}" stroke-width="2.2" opacity="0.55"/>
      <line x1="120" y1="446" x2="880" y2="446" stroke="${accent}" stroke-width="2.5" opacity="0.75"/>
    `;
  } else if (motif === 'frames') {
    // Rose Elegance: Parisian Blush Atelier Arches & Floral Styling Lounge
    motifMarkup = `
      <rect x="70" y="55" width="860" height="450" rx="24" fill="none" stroke="${secondary}" stroke-width="1.6" opacity="0.55"/>
      <!-- Dual Overlapping Parisian Arches -->
      <rect x="150" y="85" width="310" height="390" rx="155" fill="${accent}" fill-opacity="0.22" stroke="${secondary}" stroke-width="2.5"/>
      <rect x="168" y="103" width="274" height="354" rx="137" fill="none" stroke="${accent}" stroke-width="1.2"/>
      <rect x="520" y="105" width="330" height="370" rx="22" fill="#ffffff" fill-opacity="0.08" stroke="${secondary}" stroke-width="2"/>
      <!-- Sculptural Vanity Mirror & Blush Rose Blooms -->
      <circle cx="305" cy="245" r="68" fill="none" stroke="${secondary}" stroke-width="2.5" opacity="0.85"/>
      <circle cx="685" cy="245" r="82" fill="${accent}" fill-opacity="0.28" stroke="${secondary}" stroke-width="2"/>
      <path d="M 635 370 Q 685 310 735 370 Z" fill="${secondary}" fill-opacity="0.45"/>
    `;
  } else if (motif === 'botanical') {
    // Emerald Luxe: Ayurvedic Botanical Spa Sanctuary & Sacred Lotus Urli
    motifMarkup = `
      <rect x="65" y="50" width="870" height="460" rx="16" fill="none" stroke="${accent}" stroke-width="1.6" opacity="0.5"/>
      <path d="M 310 470 L 310 205 A 190 190 0 0 1 690 205 L 690 470 Z" fill="#041f17" fill-opacity="0.55" stroke="${accent}" stroke-width="2.6"/>
      <!-- Botanical Leaves & Sacred Golden Lotus -->
      <path d="M 500 155 Q 545 235 500 325 Q 455 235 500 155 Z" fill="${accent}" opacity="0.8"/>
      <path d="M 500 325 Q 585 245 595 185 Q 530 220 500 325 Z" fill="${secondary}" opacity="0.45"/>
      <path d="M 500 325 Q 415 245 405 185 Q 470 220 500 325 Z" fill="${secondary}" opacity="0.45"/>
      <path d="M 500 325 Q 625 280 640 230 Q 560 250 500 325 Z" fill="${accent}" opacity="0.45"/>
      <path d="M 500 325 Q 375 280 360 230 Q 440 250 500 325 Z" fill="${accent}" opacity="0.45"/>
      <!-- Brass Urli Vessel -->
      <path d="M 380 335 Q 500 415 620 335 Z" fill="${accent}" opacity="0.88"/>
      <line x1="350" y1="335" x2="650" y2="335" stroke="${secondary}" stroke-width="3" opacity="0.75"/>
    `;
  } else {
    // Mocha Signature: Architectural Travertine Stone & Espresso Minimalist Studio
    motifMarkup = `
      <rect x="65" y="50" width="870" height="460" fill="none" stroke="${accent}" stroke-width="1.5" opacity="0.45"/>
      <!-- Asymmetric Travertine Plinths & Sculptural Arch -->
      <rect x="135" y="95" width="320" height="370" rx="160" fill="${secondary}" fill-opacity="0.14" stroke="${accent}" stroke-width="2.2"/>
      <rect x="495" y="125" width="365" height="340" rx="12" fill="#1c130f" fill-opacity="0.55" stroke="${accent}" stroke-width="2"/>
      <circle cx="295" cy="240" r="64" fill="${accent}" fill-opacity="0.32" stroke="${secondary}" stroke-width="1.8"/>
      <path d="M 565 405 L 565 245 A 110 110 0 0 1 785 245 L 785 405 Z" fill="none" stroke="${accent}" stroke-width="2.4"/>
      <line x1="135" y1="465" x2="860" y2="465" stroke="${accent}" stroke-width="2" opacity="0.65"/>
    `;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 560" width="1000" height="560">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bg1}"/>
        <stop offset="100%" stop-color="${bg2}"/>
      </linearGradient>
      <radialGradient id="glow" cx="50%" cy="45%" r="55%">
        <stop offset="0%" stop-color="${accent}" stop-opacity="0.32"/>
        <stop offset="100%" stop-color="${bg1}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="1000" height="560" fill="url(#g)"/>
    <rect width="1000" height="560" fill="url(#glow)"/>
    ${motifMarkup}
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * High-detail Luxury Salon Interior Hero Backdrop for the Rosé Luxe Pink theme
 * Depicts arched studio mirrors, ring light reflections, styling stations, and warm rose ambiance
 */
export function getRoseLuxeSalonHeroUri(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 800" width="1440" height="800">
    <defs>
      <linearGradient id="roomBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1c1217"/>
        <stop offset="45%" stop-color="#2e1d26"/>
        <stop offset="100%" stop-color="#170e13"/>
      </linearGradient>
      <radialGradient id="pinkGlowLeft" cx="18%" cy="35%" r="45%">
        <stop offset="0%" stop-color="#f472b6" stop-opacity="0.25"/>
        <stop offset="100%" stop-color="#1c1217" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="pinkGlowRight" cx="82%" cy="40%" r="45%">
        <stop offset="0%" stop-color="#e11d74" stop-opacity="0.24"/>
        <stop offset="100%" stop-color="#170e13" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="mirrorGlass" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#4a3340" stop-opacity="0.55"/>
        <stop offset="50%" stop-color="#261820" stop-opacity="0.75"/>
        <stop offset="100%" stop-color="#140c10" stop-opacity="0.85"/>
      </linearGradient>
    </defs>
    <rect width="1440" height="800" fill="url(#roomBg)"/>
    <rect width="1440" height="800" fill="url(#pinkGlowLeft)"/>
    <rect width="1440" height="800" fill="url(#pinkGlowRight)"/>

    <!-- Perspective Salon Floor Lines -->
    <polygon points="0,800 1440,800 1180,540 260,540" fill="#140b10" opacity="0.75"/>
    <line x1="260" y1="540" x2="1180" y2="540" stroke="#f472b6" stroke-opacity="0.22" stroke-width="1.5"/>

    <!-- Left Salon Vanity Station & Arched LED Mirror -->
    <g opacity="0.85">
      <rect x="90" y="130" width="210" height="360" rx="105" fill="url(#mirrorGlass)" stroke="#fbcfe8" stroke-opacity="0.45" stroke-width="3"/>
      <rect x="102" y="142" width="186" height="336" rx="93" fill="none" stroke="#f472b6" stroke-opacity="0.25" stroke-width="1.5"/>
      <!-- Ring Light Reflection in Left Mirror -->
      <circle cx="195" cy="285" r="46" fill="none" stroke="#fdf2f8" stroke-opacity="0.45" stroke-width="5"/>
      <line x1="195" y1="331" x2="195" y2="465" stroke="#fdf2f8" stroke-opacity="0.3" stroke-width="4"/>
      <!-- Salon Styling Chair Silhouette -->
      <path d="M 115 520 Q 115 440 195 440 Q 275 440 275 520 L 260 595 L 130 595 Z" fill="#291821" stroke="#f472b6" stroke-opacity="0.3" stroke-width="1.5"/>
      <line x1="195" y1="595" x2="195" y2="665" stroke="#9d7b8b" stroke-width="5"/>
      <ellipse cx="195" cy="668" rx="48" ry="10" fill="#3d2431"/>
    </g>

    <!-- Left Shelving Display with Cosmetic Bottles -->
    <g opacity="0.55" stroke="#f9a8d4" stroke-width="1.5" fill="#3b2230">
      <rect x="340" y="170" width="130" height="310" rx="6"/>
      <line x1="340" y1="245" x2="470" y2="245"/>
      <line x1="340" y1="320" x2="470" y2="320"/>
      <line x1="340" y1="395" x2="470" y2="395"/>
      <rect x="362" y="210" width="16" height="34" rx="3" fill="#f472b6" opacity="0.6"/>
      <rect x="388" y="202" width="18" height="42" rx="3" fill="#fbcfe8" opacity="0.5"/>
      <rect x="418" y="215" width="14" height="29" rx="3" fill="#e11d74" opacity="0.6"/>
    </g>

    <!-- Right Salon Vanity Station & Arched LED Mirror -->
    <g opacity="0.85">
      <rect x="1140" y="130" width="210" height="360" rx="105" fill="url(#mirrorGlass)" stroke="#fbcfe8" stroke-opacity="0.45" stroke-width="3"/>
      <rect x="1152" y="142" width="186" height="336" rx="93" fill="none" stroke="#f472b6" stroke-opacity="0.25" stroke-width="1.5"/>
      <!-- Warm Pendant Chandelier Reflection -->
      <line x1="1245" y1="142" x2="1245" y2="225" stroke="#fbcfe8" stroke-opacity="0.4" stroke-width="2"/>
      <circle cx="1245" cy="240" r="22" fill="#fce7f3" fill-opacity="0.35"/>
      <!-- Plush Rose Velvet Lounge Armchair -->
      <path d="M 1060 540 Q 1060 445 1190 445 Q 1320 445 1335 550 L 1315 650 L 1075 650 Z" fill="#4a2535" stroke="#f472b6" stroke-opacity="0.35" stroke-width="2"/>
      <path d="M 1095 555 Q 1195 525 1295 555 L 1285 635 L 1105 635 Z" fill="#331824"/>
    </g>

    <!-- Right Arched Curtain Drapery -->
    <g opacity="0.5" stroke="#f472b6" stroke-opacity="0.3" stroke-width="1.5" fill="none">
      <path d="M 970 110 L 970 510"/>
      <path d="M 990 110 L 990 510"/>
      <path d="M 1010 110 L 1010 510"/>
    </g>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const ROYAL_THEMES: Record<RoyalThemeId, RoyalThemeTokens> = {
  'royal-gold': {
    id: 'royal-gold',
    name: 'Royal Gold',
    tagline: 'Obsidian Noir, Brushed Gold & Warm Ivory Editorial',
    description:
      'High-contrast obsidian marble canvas with brushed champagne gold hairlines and ivory typography. Crafted for flagship couture salons and celebrity styling houses.',
    layoutVariant: 'editorial-noir',
    swatches: ['#0c0a09', '#d4af37', '#faf8f5'],
    palette: {
      canvasBg: '#0c0a09',
      surfaceBg: '#161412',
      elevatedBg: '#1f1c18',
      heroBg: '#090807',
      heroText: '#faf8f5',
      heroMuted: '#d6d0c4',
      textPrimary: '#faf8f5',
      textSecondary: '#d6d0c4',
      textMuted: '#9c9488',
      accentPrimary: '#d4af37',
      accentSecondary: '#f3e5ab',
      buttonBg: '#d4af37',
      buttonText: '#0c0a09',
      borderSubtle: 'rgba(212, 175, 55, 0.22)',
      borderAccent: '#d4af37',
      footerBg: '#070605',
      footerText: '#a8a096',
    },
    typography: {
      headingFont: "'Playfair Display', Georgia, serif",
      heroAlignment: 'center',
      serviceCardStyle: 'framed',
    },
    defaultCopy: {
      tagline: '24K GOLD LUXURY HAIR, SKIN & BRIDAL COUTURE',
      heroHeadline: 'Exquisite Hair Artistry & Luxury Bridal Sanctuary',
      heroSubheadline:
        'Experience bespoke bridal shringar, precision hair color, and rejuvenating 24K gold facials crafted by master stylists.',
      servicesKicker: 'SIGNATURE TREATMENT MENU',
      servicesHeading: 'Luxury Salon & Bridal Services',
      aboutTitle: 'Where Luxury Artistry Meets Timeless Beauty',
      aboutDescription:
        'Every appointment begins with a personalized consultation in our private luxury suites, blending international styling techniques with pure botanical care.',
    },
    previewSvgDataUri: createLuxurySvgDataUri({
      bg1: '#0c0a09',
      bg2: '#1c1814',
      accent: '#d4af37',
      secondary: '#faf8f5',
      motif: 'columns',
    }),
  },

  'rose-elegance': {
    id: 'rose-elegance',
    name: 'Rose Elegance',
    tagline: 'Blush Rose, Warm Ivory & Champagne Gold',
    description:
      'Soft Parisian atelier aesthetic combining dusty blush pink, silk ivory surfaces, and delicate champagne gold accents for modern luxury hair & skin studios.',
    layoutVariant: 'parisian-split',
    swatches: ['#fdf8f7', '#d88c9a', '#c9a66b'],
    palette: {
      canvasBg: '#fdf8f7',
      surfaceBg: '#f7ece9',
      elevatedBg: '#ffffff',
      heroBg: '#f4e2de',
      heroText: '#2d1c1e',
      heroMuted: '#634448',
      textPrimary: '#2d1c1e',
      textSecondary: '#5c3d42',
      textMuted: '#8a696e',
      accentPrimary: '#b85d6f',
      accentSecondary: '#c9a66b',
      buttonBg: '#2d1c1e',
      buttonText: '#fdf8f7',
      borderSubtle: 'rgba(184, 93, 111, 0.2)',
      borderAccent: '#c9a66b',
      footerBg: '#241517',
      footerText: '#e6d3d0',
    },
    typography: {
      headingFont: "'Playfair Display', Georgia, serif",
      heroAlignment: 'left',
      serviceCardStyle: 'bordered',
    },
    defaultCopy: {
      tagline: 'BLUSH ROSE & SILK IVORY BEAUTY ATELIER',
      heroHeadline: 'Soft Glam Styling & Radiant Skin Rituals',
      heroSubheadline:
        'Curated hair transformations, Korean glass-skin facials, and elegant bridal makeovers in a serene blush-rose studio.',
      servicesKicker: 'CURATED ATELIER MENU',
      servicesHeading: 'Bespoke Beauty & Styling Menu',
      aboutTitle: 'Elegance Crafted Around Your Natural Radiance',
      aboutDescription:
        'Our studio combines gentle dermal therapies with modern hair couture so every guest steps out with effortless confidence.',
    },
    previewSvgDataUri: createLuxurySvgDataUri({
      bg1: '#3b1f25',
      bg2: '#5c2e38',
      accent: '#f2c6ce',
      secondary: '#c9a66b',
      motif: 'frames',
    }),
  },

  'bridal-royale': {
    id: 'bridal-royale',
    name: 'Bridal Royale',
    tagline: 'Imperial Burgundy, Warm Cream & Heritage Gold',
    description:
      'Regal bridal couture architecture blending deep velvet burgundy headers with warm parchment cream surfaces and antique gold borders for wedding & makeup specialists.',
    layoutVariant: 'regal-arch',
    swatches: ['#4a0e1e', '#fbf7f0', '#c8a24b'],
    palette: {
      canvasBg: '#fbf7f0',
      surfaceBg: '#f3ece0',
      elevatedBg: '#ffffff',
      heroBg: '#4a0e1e',
      heroText: '#fbf7f0',
      heroMuted: '#e8dcc8',
      textPrimary: '#2c0912',
      textSecondary: '#592532',
      textMuted: '#825660',
      accentPrimary: '#4a0e1e',
      accentSecondary: '#c8a24b',
      buttonBg: '#4a0e1e',
      buttonText: '#fbf7f0',
      borderSubtle: 'rgba(200, 162, 75, 0.32)',
      borderAccent: '#c8a24b',
      footerBg: '#2c0912',
      footerText: '#e2d4c0',
    },
    typography: {
      headingFont: "'Playfair Display', Georgia, serif",
      heroAlignment: 'center',
      serviceCardStyle: 'framed',
    },
    defaultCopy: {
      tagline: 'ROYAL INDIAN BRIDAL SHRINGAR & MAKEUP LOUNGE',
      heroHeadline: 'Royal Maharani Bridal Makeup & Pre-Bridal Packages',
      heroSubheadline:
        'Specializing in HD & Airbrush Dulhan Shringar, Sangeet & Haldi glamour, Kundan hair styling, and royal pre-bridal Ubtan rituals.',
      servicesKicker: 'SHAHI BRIDAL & SALON MENU',
      servicesHeading: 'Bridal Shringar & Signature Packages',
      aboutTitle: 'Celebrating Indian Bridal Heritage & Timeless Glamour',
      aboutDescription:
        'From engagement to wedding day pheras, our bridal artists craft flawless, long-lasting looks tailored to your lehenga, jewelry, and skin tone.',
    },
    previewSvgDataUri: createLuxurySvgDataUri({
      bg1: '#4a0e1e',
      bg2: '#2c0812',
      accent: '#c8a24b',
      secondary: '#fbf7f0',
      motif: 'arch',
    }),
  },

  'emerald-luxe': {
    id: 'emerald-luxe',
    name: 'Emerald Luxe',
    tagline: 'Deep Botanical Emerald, Alabaster Ivory & Brass',
    description:
      'Serene holistic spa aesthetic featuring deep emerald green architectural banners, crisp alabaster ivory treatment menus, and subtle brushed gold detailing.',
    layoutVariant: 'botanical-grid',
    swatches: ['#062c21', '#f7f6f1', '#c9a654'],
    palette: {
      canvasBg: '#f7f6f1',
      surfaceBg: '#edece4',
      elevatedBg: '#ffffff',
      heroBg: '#062c21',
      heroText: '#f7f6f1',
      heroMuted: '#cfe0da',
      textPrimary: '#08291f',
      textSecondary: '#2d4f43',
      textMuted: '#5c7a6f',
      accentPrimary: '#062c21',
      accentSecondary: '#c9a654',
      buttonBg: '#062c21',
      buttonText: '#f7f6f1',
      borderSubtle: 'rgba(6, 44, 33, 0.16)',
      borderAccent: '#c9a654',
      footerBg: '#041f17',
      footerText: '#bfd1cb',
    },
    typography: {
      headingFont: "'Playfair Display', Georgia, serif",
      heroAlignment: 'left',
      serviceCardStyle: 'editorial-row',
    },
    defaultCopy: {
      tagline: 'ORGANIC AYURVEDIC SPA & BOTANICAL HAIR SANCTUARY',
      heroHeadline: 'Pure Botanical Beauty & Holistic Ayurvedic Rituals',
      heroSubheadline:
        '100% toxin-free herbal hair spas, 24K Kumkumadi saffron facials, and restorative head-to-toe wellness therapies.',
      servicesKicker: 'HOLISTIC SPA & SALON MENU',
      servicesHeading: 'Botanical Treatments & Rituals',
      aboutTitle: 'Pure Organic Formulations for Skin & Hair Wellness',
      aboutDescription:
        'Inspired by ancient Indian Ayurvedic rituals and modern botanical science, every treatment restores deep cellular vitality and natural shine.',
    },
    previewSvgDataUri: createLuxurySvgDataUri({
      bg1: '#062c21',
      bg2: '#0b4232',
      accent: '#c9a654',
      secondary: '#f7f6f1',
      motif: 'botanical',
    }),
  },

  'mocha-signature': {
    id: 'mocha-signature',
    name: 'Mocha Signature',
    tagline: 'Espresso Mocha, Travertine Beige & Warm Ivory',
    description:
      'Contemporary architectural aesthetics studio palette combining rich roasted mocha brown, warm travertine stone beige, and soft linen ivory.',
    layoutVariant: 'architectural-minimal',
    swatches: ['#2c1e18', '#eee6dd', '#faf6f2'],
    palette: {
      canvasBg: '#faf6f2',
      surfaceBg: '#eee6dd',
      elevatedBg: '#ffffff',
      heroBg: '#2c1e18',
      heroText: '#faf6f2',
      heroMuted: '#dfd3c7',
      textPrimary: '#261914',
      textSecondary: '#543d34',
      textMuted: '#826a60',
      accentPrimary: '#2c1e18',
      accentSecondary: '#b58d67',
      buttonBg: '#2c1e18',
      buttonText: '#faf6f2',
      borderSubtle: 'rgba(44, 30, 24, 0.16)',
      borderAccent: '#b58d67',
      footerBg: '#1c130f',
      footerText: '#d4c5b8',
    },
    typography: {
      headingFont: "'Playfair Display', Georgia, serif",
      heroAlignment: 'left',
      serviceCardStyle: 'bordered',
    },
    defaultCopy: {
      tagline: 'ARCHITECTURAL HAIR, SKIN & AESTHETICS LOUNGE',
      heroHeadline: 'Modern Beauty Architecture & Precision Styling',
      heroSubheadline:
        'Dimensional balayage, keratin smoothing, structured brow sculpting, and clinical skin rejuvenation in a calm minimalist studio.',
      servicesKicker: 'STUDIO TREATMENT DIRECTORY',
      servicesHeading: 'Precision Hair, Skin & Nail Architecture',
      aboutTitle: 'Contemporary Craftsmanship & Personalized Care',
      aboutDescription:
        'Designed as a tranquil urban retreat, our studio delivers precision haircuts, custom color chemistry, and results-driven skin care.',
    },
    previewSvgDataUri: createLuxurySvgDataUri({
      bg1: '#2c1e18',
      bg2: '#473127',
      accent: '#d1ae86',
      secondary: '#faf6f2',
      motif: 'travertine',
    }),
  },

  'rose-luxe': {
    id: 'rose-luxe',
    name: 'Rosé Luxe Pink',
    tagline: 'Because You Deserve To Shine',
    description:
      'Signature Rosé Luxe Pink salon experience featuring a frosted dark glass hero showcase, sweeping curved wave divider, photo-top service cards, Why Choose Us highlights, and a 2x2 About collage.',
    layoutVariant: 'rose-luxe-pink',
    swatches: ['#e11d74', '#fff5f8', '#fde4ee'],
    palette: {
      canvasBg: '#fff9fb',
      surfaceBg: '#fdf0f6',
      elevatedBg: '#ffffff',
      heroBg: '#1c1117',
      heroText: '#ffffff',
      heroMuted: '#f9d5e5',
      textPrimary: '#1f1218',
      textSecondary: '#5e434f',
      textMuted: '#8c6978',
      accentPrimary: '#e11d74',
      accentSecondary: '#e11d74',
      buttonBg: '#e11d74',
      buttonText: '#ffffff',
      borderSubtle: 'rgba(225, 29, 116, 0.14)',
      borderAccent: '#f472b6',
      footerBg: '#1a0f15',
      footerText: '#f5d8e6',
    },
    typography: {
      headingFont: "'Playfair Display', Georgia, serif",
      heroAlignment: 'center',
      serviceCardStyle: 'photo-card',
    },
    defaultCopy: {
      tagline: 'BECAUSE YOU DESERVE TO SHINE',
      heroHeadline: 'Premium Salon Experience For Modern Women',
      heroSubheadline:
        'Indulge in luxury treatments crafted by expert stylists. Where beauty meets elegance, and every visit feels like a retreat.',
      servicesKicker: 'WHAT WE OFFER',
      servicesHeading: 'Our Premium Services',
      aboutTitle: 'Crafting Beauty & Confidence Every Day',
      aboutDescription:
        'We believe every woman deserves to feel beautiful and confident. Our journey began with a simple vision — to create a sanctuary where luxury meets comfort.',
    },
    previewSvgDataUri: createLuxurySvgDataUri({
      bg1: '#2b1620',
      bg2: '#4a2035',
      accent: '#e11d74',
      secondary: '#fbcfe8',
      motif: 'rose-luxe',
    }),
  },
};

export function getThemeHeroBackdropUri(themeId: RoyalThemeId): string {
  if (themeId === 'rose-luxe') {
    return getRoseLuxeSalonHeroUri();
  }
  return ROYAL_THEMES[themeId]?.previewSvgDataUri || ROYAL_THEMES['royal-gold'].previewSvgDataUri;
}

/**
 * Returns true if the image URL is empty, a legacy unsplash URL, or an auto-generated SVG preset
 * so that switching themes automatically loads the new theme's signature artwork unless the owner
 * uploaded their own custom photo (JPEG/PNG data URI or custom https photo).
 */
export function isDefaultOrPresetHeroImage(url?: string): boolean {
  if (!url || !url.trim()) return true;
  if (url.includes('images.unsplash.com')) return true;
  if (url.startsWith('data:image/svg+xml')) return true;
  return false;
}

export function getGalleryArtworkDataUri(_title: string, _category: string, theme: RoyalThemeTokens): string {
  return createLuxurySvgDataUri({
    bg1: theme.palette.heroBg,
    bg2: theme.id === 'rose-luxe' ? '#4a1c32' : theme.palette.surfaceBg,
    accent: theme.palette.accentSecondary,
    secondary: theme.palette.heroText,
    motif:
      theme.id === 'bridal-royale'
        ? 'arch'
        : theme.id === 'emerald-luxe'
        ? 'botanical'
        : theme.id === 'royal-gold'
        ? 'columns'
        : theme.id === 'rose-luxe'
        ? 'rose-luxe'
        : theme.id === 'rose-elegance'
        ? 'frames'
        : 'travertine',
  });
}

export const ROYAL_THEME_LIST = ALLOWED_ROYAL_THEMES.map((id) => ({
  ...ROYAL_THEMES[id],
  subtitle: ROYAL_THEMES[id].tagline,
  badge: ROYAL_THEMES[id].tagline.split('·')[0].trim(),
}));
