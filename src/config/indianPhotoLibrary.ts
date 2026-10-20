export interface IndianSalonPhotoPreset {
  id: string;
  title: string;
  hindiTitle: string;
  category: 'Bridal Makeup' | 'Hair & Gajra' | 'Mehndi & Nail Art' | 'Ayurvedic Facial' | 'Sangeet & Party' | 'Salon Interior' | 'Logo Crest';
  recommendedFor: ('hero' | 'about' | 'gallery' | 'logo')[];
  description: string;
  imageUrl: string;
}

/**
 * Generates pure visual, watermark-free Indian Royal Salon & Bridal Lookbook artwork Data URIs
 * featuring authentic Indian architectural Jharokha arches, Mandala henna geometry,
 * Bridal Shringar silhouettes, Lotus motifs, and Kundan gold detailing — with ZERO text or brand watermarks.
 */
function createIndianBridalArtworkUri(config: {
  bgStart: string;
  bgEnd: string;
  goldPrimary: string;
  goldSecondary: string;
  accentColor: string;
  ivoryText: string;
  illustration:
    | 'maharani-bride'
    | 'sangeet-glam'
    | 'mogra-gajra'
    | 'royal-mehndi'
    | 'ayurvedic-facial'
    | 'reception-rose'
    | 'saree-draping'
    | 'palace-salon'
    | 'royal-crest';
}): string {
  const {
    bgStart,
    bgEnd,
    goldPrimary,
    goldSecondary,
    accentColor,
    ivoryText,
    illustration,
  } = config;

  // Intricate Indian Mandala & Jharokha background frame (Pure visual, no text watermarks)
  const mandalaRings = `
    <g opacity="0.22" stroke="${goldPrimary}" fill="none">
      <circle cx="500" cy="310" r="245" stroke-width="1.2"/>
      <circle cx="500" cy="310" r="220" stroke-width="1.6" stroke-dasharray="6 6"/>
      <circle cx="500" cy="310" r="192" stroke-width="0.9"/>
      <path d="M500 65 L518 105 L500 145 L482 105 Z" fill="${goldPrimary}" opacity="0.45"/>
      <path d="M500 555 L518 515 L500 475 L482 515 Z" fill="${goldPrimary}" opacity="0.45"/>
      <path d="M255 310 L295 292 L335 310 L295 328 Z" fill="${goldPrimary}" opacity="0.45"/>
      <path d="M745 310 L705 292 L665 310 L705 328 Z" fill="${goldPrimary}" opacity="0.45"/>
    </g>
    <!-- Ornate Indian Jharokha Palace Arch -->
    <path d="M 170 580 L 170 215 Q 170 105 330 92 Q 445 80 500 44 Q 555 80 670 92 Q 830 105 830 215 L 830 580" fill="none" stroke="${goldPrimary}" stroke-width="2.2" opacity="0.6"/>
    <path d="M 192 580 L 192 225 Q 192 124 340 112 Q 452 100 500 66 Q 548 100 660 112 Q 808 124 808 225 L 808 580" fill="none" stroke="${goldSecondary}" stroke-width="1.1" stroke-dasharray="5 5" opacity="0.48"/>
    <!-- Subtle Zari Corner Filigree -->
    <rect x="34" y="30" width="932" height="560" rx="18" fill="none" stroke="${goldPrimary}" stroke-width="1.6" opacity="0.45"/>
    <rect x="48" y="44" width="904" height="532" rx="12" fill="none" stroke="${goldSecondary}" stroke-width="0.9" opacity="0.32"/>
  `;

  let centerArt = '';

  if (illustration === 'maharani-bride' || illustration === 'saree-draping') {
    centerArt = `
      <!-- Royal Bridal Veil & Silhouette Centered -->
      <circle cx="500" cy="300" r="135" fill="${accentColor}" opacity="0.42" stroke="${goldPrimary}" stroke-width="2.4"/>
      <!-- Bridal Dupatta Arch -->
      <path d="M 340 485 Q 370 155 500 148 Q 630 155 660 485" fill="${accentColor}" opacity="0.65" stroke="${goldPrimary}" stroke-width="3"/>
      <!-- Face Silhouette -->
      <path d="M 438 285 Q 438 365 500 378 Q 562 365 562 285 Q 562 205 500 205 Q 438 205 438 285 Z" fill="${goldSecondary}" opacity="0.26" stroke="${goldPrimary}" stroke-width="2.2"/>
      <!-- Maang Tikka & Matha Patti -->
      <path d="M 440 242 Q 500 264 560 242" fill="none" stroke="${goldPrimary}" stroke-width="3"/>
      <line x1="500" y1="180" x2="500" y2="250" stroke="${goldPrimary}" stroke-width="2.4"/>
      <circle cx="500" cy="256" r="9" fill="${goldPrimary}"/>
      <circle cx="500" cy="215" r="5" fill="${goldSecondary}"/>
      <!-- Bridal Eyes & Bindi -->
      <circle cx="500" cy="274" r="4.5" fill="${accentColor}"/>
      <path d="M 462 288 Q 476 279 488 288" fill="none" stroke="${goldPrimary}" stroke-width="2.5"/>
      <path d="M 512 288 Q 524 279 538 288" fill="none" stroke="${goldPrimary}" stroke-width="2.5"/>
      <!-- Royal Bridal Nath (Nose Ring) -->
      <circle cx="522" cy="320" r="18" fill="none" stroke="${goldPrimary}" stroke-width="2.2"/>
      <circle cx="540" cy="322" r="4" fill="${goldSecondary}"/>
      <path d="M 538 326 Q 556 336 560 310" fill="none" stroke="${goldPrimary}" stroke-width="1.8" stroke-dasharray="3 3"/>
      <!-- Kundan Choker & Rani Haar Necklace -->
      <path d="M 424 398 Q 500 438 576 398" fill="none" stroke="${goldPrimary}" stroke-width="8"/>
      <path d="M 408 418 Q 500 468 592 418" fill="none" stroke="${goldSecondary}" stroke-width="4" stroke-dasharray="7 5"/>
      <path d="M 392 442 Q 500 502 608 442" fill="none" stroke="${goldPrimary}" stroke-width="2.5"/>
    `;
  } else if (illustration === 'mogra-gajra') {
    centerArt = `
      <!-- Bridal Chignon Bun & Jasmine Mogra Gajra Garland -->
      <circle cx="500" cy="300" r="128" fill="${accentColor}" opacity="0.35" stroke="${goldPrimary}" stroke-width="2"/>
      <circle cx="500" cy="285" r="78" fill="#1a1110" stroke="${goldPrimary}" stroke-width="2.6"/>
      <!-- Gold Rakhdi / Hair Brooch in Center of Bun -->
      <circle cx="500" cy="285" r="28" fill="${goldPrimary}" opacity="0.9"/>
      <circle cx="500" cy="285" r="14" fill="${accentColor}"/>
      <!-- Semi-circle of White Jasmine Mogra Buds -->
      <g fill="${ivoryText}" stroke="${goldPrimary}" stroke-width="1.5">
        <circle cx="406" cy="292" r="16"/>
        <circle cx="415" cy="324" r="16"/>
        <circle cx="436" cy="350" r="16"/>
        <circle cx="466" cy="368" r="16"/>
        <circle cx="500" cy="374" r="18"/>
        <circle cx="534" cy="368" r="16"/>
        <circle cx="564" cy="350" r="16"/>
        <circle cx="585" cy="324" r="16"/>
        <circle cx="594" cy="292" r="16"/>
      </g>
      <!-- Hanging Jasmine Strings (Veni) -->
      <g fill="${ivoryText}" opacity="0.92">
        <circle cx="436" cy="392" r="7"/><circle cx="436" cy="416" r="7"/><circle cx="436" cy="440" r="6"/><circle cx="436" cy="462" r="5"/>
        <circle cx="500" cy="402" r="7"/><circle cx="500" cy="426" r="7"/><circle cx="500" cy="450" r="6"/>
        <circle cx="564" cy="392" r="7"/><circle cx="564" cy="416" r="7"/><circle cx="564" cy="440" r="6"/><circle cx="564" cy="462" r="5"/>
      </g>
    `;
  } else if (illustration === 'royal-mehndi') {
    centerArt = `
      <!-- Intricate Henna Mandala & Bangles -->
      <circle cx="500" cy="305" r="138" fill="${accentColor}" opacity="0.38" stroke="${goldPrimary}" stroke-width="2.5"/>
      <circle cx="500" cy="305" r="102" fill="none" stroke="${goldPrimary}" stroke-width="1.8" stroke-dasharray="5 4"/>
      <circle cx="500" cy="305" r="68" fill="${goldPrimary}" opacity="0.25" stroke="${goldPrimary}" stroke-width="2.2"/>
      <circle cx="500" cy="305" r="24" fill="${goldPrimary}"/>
      <!-- 8 Lotus Petals -->
      <g stroke="${goldPrimary}" stroke-width="2.2" fill="${goldSecondary}" fill-opacity="0.22">
        <path d="M 500 167 Q 528 215 500 237 Q 472 215 500 167 Z"/>
        <path d="M 500 443 Q 528 395 500 373 Q 472 395 500 443 Z"/>
        <path d="M 362 305 Q 410 277 432 305 Q 410 333 362 305 Z"/>
        <path d="M 638 305 Q 590 277 568 305 Q 590 333 638 305 Z"/>
      </g>
      <!-- Hathphool / Kangan Chains -->
      <path d="M 340 430 Q 500 490 660 430" fill="none" stroke="${goldPrimary}" stroke-width="5"/>
      <path d="M 355 450 Q 500 510 645 450" fill="none" stroke="${goldSecondary}" stroke-width="2.5" stroke-dasharray="6 6"/>
    `;
  } else if (illustration === 'ayurvedic-facial') {
    centerArt = `
      <!-- Golden Lotus & Ayurvedic Kalash Bowl -->
      <circle cx="500" cy="305" r="135" fill="${accentColor}" opacity="0.32" stroke="${goldPrimary}" stroke-width="2"/>
      <!-- Blooming Sacred Lotus -->
      <path d="M 500 185 Q 548 260 500 350 Q 452 260 500 185 Z" fill="${goldPrimary}" opacity="0.82"/>
      <path d="M 500 350 Q 582 268 592 210 Q 528 245 500 350 Z" fill="${goldSecondary}" opacity="0.62"/>
      <path d="M 500 350 Q 418 268 408 210 Q 472 245 500 350 Z" fill="${goldSecondary}" opacity="0.62"/>
      <path d="M 500 350 Q 622 305 638 256 Q 562 275 500 350 Z" fill="${goldPrimary}" opacity="0.45"/>
      <path d="M 500 350 Q 378 305 362 256 Q 438 275 500 350 Z" fill="${goldPrimary}" opacity="0.45"/>
      <!-- Brass Urli Bowl -->
      <path d="M 372 358 Q 500 440 628 358 Z" fill="${goldPrimary}" opacity="0.88"/>
      <line x1="345" y1="358" x2="655" y2="358" stroke="${goldSecondary}" stroke-width="4"/>
    `;
  } else if (illustration === 'palace-salon') {
    centerArt = `
      <!-- Royal Arched Salon Mirrors & Chandelier -->
      <path d="M 450 110 L 550 110 L 530 175 L 470 175 Z" fill="${goldPrimary}" opacity="0.72"/>
      <circle cx="500" cy="192" r="14" fill="${goldSecondary}"/>
      <!-- 3 Arched Royal Mirrors -->
      <path d="M 250 460 L 250 275 A 62 62 0 0 1 374 275 L 374 460 Z" fill="${accentColor}" opacity="0.42" stroke="${goldPrimary}" stroke-width="3"/>
      <path d="M 418 460 L 418 245 A 82 82 0 0 1 582 245 L 582 460 Z" fill="${accentColor}" opacity="0.58" stroke="${goldPrimary}" stroke-width="3.6"/>
      <path d="M 626 460 L 626 275 A 62 62 0 0 1 750 275 L 750 460 Z" fill="${accentColor}" opacity="0.42" stroke="${goldPrimary}" stroke-width="3"/>
      <!-- Ring Light Glows inside Mirrors -->
      <circle cx="312" cy="340" r="28" fill="none" stroke="${goldSecondary}" stroke-width="2" opacity="0.6"/>
      <circle cx="500" cy="325" r="38" fill="none" stroke="${goldSecondary}" stroke-width="2.5" opacity="0.75"/>
      <circle cx="688" cy="340" r="28" fill="none" stroke="${goldSecondary}" stroke-width="2" opacity="0.6"/>
      <line x1="210" y1="464" x2="790" y2="464" stroke="${goldPrimary}" stroke-width="2.8"/>
    `;
  } else {
    centerArt = `
      <!-- Royal Jhumka & Shringar Emblem -->
      <circle cx="500" cy="300" r="120" fill="${accentColor}" opacity="0.4" stroke="${goldPrimary}" stroke-width="2.4"/>
      <!-- Ornate Jhumka Dome -->
      <circle cx="500" cy="235" r="24" fill="${goldPrimary}"/>
      <line x1="500" y1="259" x2="500" y2="295" stroke="${goldPrimary}" stroke-width="4"/>
      <path d="M 424 355 A 76 68 0 0 1 576 355 Z" fill="${goldPrimary}" opacity="0.9"/>
      <line x1="418" y1="357" x2="582" y2="357" stroke="${goldSecondary}" stroke-width="4"/>
      <!-- Hanging Pearl Drops -->
      <g fill="${ivoryText}">
        <circle cx="434" cy="380" r="6.5"/>
        <circle cx="460" cy="386" r="6.5"/>
        <circle cx="486" cy="390" r="6.5"/>
        <circle cx="514" cy="390" r="6.5"/>
        <circle cx="540" cy="386" r="6.5"/>
        <circle cx="566" cy="380" r="6.5"/>
      </g>
    `;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 620" width="1000" height="620">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bgStart}"/>
        <stop offset="55%" stop-color="${bgEnd}"/>
        <stop offset="100%" stop-color="${bgStart}"/>
      </linearGradient>
      <radialGradient id="goldAura" cx="50%" cy="48%" r="54%">
        <stop offset="0%" stop-color="${goldPrimary}" stop-opacity="0.32"/>
        <stop offset="100%" stop-color="${bgStart}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="1000" height="620" fill="url(#bgGrad)"/>
    <rect width="1000" height="620" fill="url(#goldAura)"/>
    ${mandalaRings}
    ${centerArt}
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const INDIAN_SALON_PHOTO_LIBRARY: IndianSalonPhotoPreset[] = [
  {
    id: 'ind-maharani-bride',
    title: 'Royal Maharani Bridal Shringar',
    hindiTitle: 'रॉयल महारानी ब्राइडल मेकअप लुक',
    category: 'Bridal Makeup',
    recommendedFor: ['hero', 'gallery', 'about'],
    description: 'Traditional crimson & gold zari lehenga bridal look with heritage Kundan jewelry, Nath, and HD airbrush makeup.',
    imageUrl: createIndianBridalArtworkUri({
      bgStart: '#2d0610',
      bgEnd: '#540d20',
      goldPrimary: '#e5c158',
      goldSecondary: '#fbf2d5',
      accentColor: '#7a1129',
      ivoryText: '#fffdf9',
      illustration: 'maharani-bride',
    }),
  },
  {
    id: 'ind-sangeet-glam',
    title: 'Sangeet & Haldi Golden Glow',
    hindiTitle: 'संगीत और हल्दी गोल्डन ग्लो',
    category: 'Sangeet & Party',
    recommendedFor: ['hero', 'gallery'],
    description: 'Radiant dewy glass-skin makeup with warm saffron & champagne shimmer for Haldi, Mehendi, and Sangeet nights.',
    imageUrl: createIndianBridalArtworkUri({
      bgStart: '#291705',
      bgEnd: '#4f2d0a',
      goldPrimary: '#f5b841',
      goldSecondary: '#ffefc7',
      accentColor: '#8c4f0e',
      ivoryText: '#fffdf7',
      illustration: 'sangeet-glam',
    }),
  },
  {
    id: 'ind-mogra-gajra',
    title: 'Mogra Gajra Bridal Hair Bun',
    hindiTitle: 'मोगरा गजरा ब्राइडल हेयरस्टाइल',
    category: 'Hair & Gajra',
    recommendedFor: ['gallery', 'about'],
    description: 'Classic South & North Indian bridal chignon bun adorned with fresh fragrant white jasmine mogra flowers and gold Rakhdi.',
    imageUrl: createIndianBridalArtworkUri({
      bgStart: '#121a16',
      bgEnd: '#1f3329',
      goldPrimary: '#d9b65c',
      goldSecondary: '#f7efd8',
      accentColor: '#0e4732',
      ivoryText: '#ffffff',
      illustration: 'mogra-gajra',
    }),
  },
  {
    id: 'ind-royal-mehndi',
    title: 'Rajasthani Bridal Mehndi & Kangan',
    hindiTitle: 'राजस्थानी ब्राइडल मेहंदी और कंगन',
    category: 'Mehndi & Nail Art',
    recommendedFor: ['gallery', 'about'],
    description: 'Intricate Marwari & Rajasthani dulhan henna artistry paired with bridal red chooda, kundan rings, and nail extensions.',
    imageUrl: createIndianBridalArtworkUri({
      bgStart: '#241008',
      bgEnd: '#421d0f',
      goldPrimary: '#dfb456',
      goldSecondary: '#faeccf',
      accentColor: '#6b2811',
      ivoryText: '#fffbf5',
      illustration: 'royal-mehndi',
    }),
  },
  {
    id: 'ind-ayurvedic-facial',
    title: '24K Swarna & Kumkumadi Facial',
    hindiTitle: '24K स्वर्ण और कुमकुमादि आयुर्वेदिक फेशियल',
    category: 'Ayurvedic Facial',
    recommendedFor: ['hero', 'about', 'gallery'],
    description: 'Holistic Indian bridal skin ritual infused with Kashmiri saffron, pure sandalwood, rose water, and 24K gold leaf.',
    imageUrl: createIndianBridalArtworkUri({
      bgStart: '#06261d',
      bgEnd: '#0d4233',
      goldPrimary: '#e0bc63',
      goldSecondary: '#fbf2d9',
      accentColor: '#135e48',
      ivoryText: '#f7faf9',
      illustration: 'ayurvedic-facial',
    }),
  },
  {
    id: 'ind-reception-rose',
    title: 'Rose Gold Reception Cocktail Look',
    hindiTitle: 'रोज़ गोल्ड रिसेप्शन और पार्टी मेकअप',
    category: 'Sangeet & Party',
    recommendedFor: ['hero', 'gallery'],
    description: 'Soft pink petal lips, rose-gold smokey eyes, and Hollywood waves tailored for Indian wedding receptions and engagement ceremonies.',
    imageUrl: createIndianBridalArtworkUri({
      bgStart: '#2b1318',
      bgEnd: '#4d222b',
      goldPrimary: '#e3b298',
      goldSecondary: '#fcebe1',
      accentColor: '#783040',
      ivoryText: '#fff8f9',
      illustration: 'reception-rose',
    }),
  },
  {
    id: 'ind-saree-draping',
    title: 'Banarasi & Kanjeevaram Saree Draping',
    hindiTitle: 'बनारसी और कांजीवरम साड़ी ड्रेपिंग',
    category: 'Bridal Makeup',
    recommendedFor: ['gallery'],
    description: 'Precision pleating and royal pallu styling for Banarasi silk sarees, double-dupatta bridal lehengas, and Gujarati/Maharashtrian drapes.',
    imageUrl: createIndianBridalArtworkUri({
      bgStart: '#21092b',
      bgEnd: '#3d124f',
      goldPrimary: '#e8c468',
      goldSecondary: '#fff4d4',
      accentColor: '#601a7d',
      ivoryText: '#fdfaff',
      illustration: 'saree-draping',
    }),
  },
  {
    id: 'ind-palace-salon',
    title: 'Royal Heritage Parlour Interior',
    hindiTitle: 'रॉयल हेरिटेज ब्यूटी पार्लर इंटीरियर',
    category: 'Salon Interior',
    recommendedFor: ['hero', 'about'],
    description: 'Luxury Indian bridal lounge featuring arched brass mirrors, marble floors, warm chandeliers, and private VIP bridal suites.',
    imageUrl: createIndianBridalArtworkUri({
      bgStart: '#14110e',
      bgEnd: '#2b241d',
      goldPrimary: '#d4af37',
      goldSecondary: '#f5e7b8',
      accentColor: '#453728',
      ivoryText: '#faf8f5',
      illustration: 'palace-salon',
    }),
  },
  {
    id: 'ind-royal-crest',
    title: 'Royal Shringar Gold Monogram Logo',
    hindiTitle: 'रॉयल श्रृंगार गोल्ड सैलून लोगो',
    category: 'Logo Crest',
    recommendedFor: ['logo'],
    description: 'Regal gold-on-crimson Indian salon emblem ideal for your website top header logo.',
    imageUrl: createIndianBridalArtworkUri({
      bgStart: '#380714',
      bgEnd: '#1a0309',
      goldPrimary: '#e6c253',
      goldSecondary: '#fff3cc',
      accentColor: '#690e26',
      ivoryText: '#ffffff',
      illustration: 'royal-crest',
    }),
  },
];
