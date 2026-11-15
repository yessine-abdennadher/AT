export interface ActivityMenuItem {
  id: string;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  price: number;
  originalPrice?: number;
  isPopular?: boolean;
  isSpecialty?: boolean;
  isSignature?: boolean;
  badge?: string;
  imageUrl?: string;
}

export interface ActivityMenuSectionData {
  id: string;
  title: string;
  titleAr?: string;
  icon?: string;
  items: ActivityMenuItem[];
}

export interface ActivityMenuData {
  pdfUrl?: string;
  images?: string[];
  currency?: string;
  sections: ActivityMenuSectionData[];
}

export interface DemoActivity {
  id: string;
  name: string;
  nameAr?: string;
  city: string;
  locationName?: string;
  category: 'outdoor' | 'creative' | 'food' | 'fun' | 'sport' | 'couple' | 'friends';
  type?: 'activity' | 'restaurant' | 'cafe' | 'other';
  coordinates?: { latitude?: number; longitude?: number };
  coordinatesVerified?: boolean;
  categoryLabel: string;
  price: number;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  lightingActive: boolean;
  hasAirConditioning?: boolean;
  directContact: boolean;
  phone?: string;
  whatsapp?: string;
  highlight: string;
  description?: string;
  tags: string[];
  promotion?: {
    isPromo: boolean;
    discountPercent: number;
    promoLabel?: string;
    validUntil?: string;
  };
  events?: Array<{
    id?: string;
    title: string;
    image?: string;
    date: string;
    time: string;
    price: number;
    description?: string;
    category?: string;
  }>;
  partnerTier?: 'standard' | 'pro' | 'premium';
  isFeatured?: boolean;
  menu?: ActivityMenuData;
}

export const DEMO_ACTIVITIES: DemoActivity[] = [
  {
    id: 'act-mall-sfax',
    name: 'Mall of Sfax',
    nameAr: 'مول صفاقس',
    city: 'Sfax',
    locationName: 'Route de Tunis Km 9, Sakiet Ezzit, Sfax',
    category: 'fun',
    type: 'activity',
    categoryLabel: 'Loisirs & Shopping',
    price: 15,
    rating: 4.9,
    reviewCount: 480,
    imageUrl: 'https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?auto=format&fit=crop&w=800&q=80',
    lightingActive: true,
    hasAirConditioning: true,
    directContact: true,
    phone: '+216 74 123 456',
    whatsapp: '+216 98 123 456',
    partnerTier: 'pro',
    highlight: 'Boutiques internationales, Cinéma Pathé & Food court',
    description: 'Le plus grand centre commercial et de loisirs à Sfax ! Boutiques internationales, food court, cinéma Pathé, bowling et loisirs familiaux complets.',
    tags: ['Populaire', 'Climatisé', 'Famille', 'Cinéma'],
    menu: {
      currency: 'DT',
      images: [
        'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1000&q=80',
      ],
      sections: [
        {
          id: 'sec-cinema',
          title: 'Séances Cinéma Pathé',
          titleAr: 'عروض سينما باثي',
          icon: 'ticket',
          items: [
            {
              id: 'item-cine-std',
              name: 'Billet Standard 2D',
              nameAr: 'تذكرة عادية 2D',
              description: 'Accès aux dernières sorties nationales et internationales en salle climatisée Dolby 7.1.',
              price: 16,
              isPopular: true,
              imageUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80',
            },
            {
              id: 'item-cine-vip',
              name: 'Billet VIP Fauteuil Inclinable',
              nameAr: 'تذكرة كبار الشخصيات VIP',
              description: 'Siège en cuir inclinable avec service boissons et pop-corn chaud.',
              price: 24,
              isSpecialty: true,
              badge: 'Confort Max',
              imageUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=600&q=80',
            },
          ],
        },
        {
          id: 'sec-bowling',
          title: 'Bowling & Jeux Arcade',
          titleAr: 'البولينغ وألعاب الأركيد',
          icon: 'sparkles',
          items: [
            {
              id: 'item-bowl-solo',
              name: 'Partie Bowling 1 Personne',
              nameAr: 'جولة بولينغ لشخص واحد',
              description: 'Location de chaussures incluse avec pistes informatisées dernière génération.',
              price: 12,
              imageUrl: 'https://images.unsplash.com/photo-1545809074-59472b3f5eff?auto=format&fit=crop&w=600&q=80',
            },
            {
              id: 'item-bowl-pack',
              name: 'Pack Famille & Amis (4 Joueurs)',
              nameAr: 'باقة العائلة والأصدقاء (4 لاعبين)',
              description: '2 parties complètes pour 4 personnes avec 4 boissons fraîches offertes.',
              price: 45,
              originalPrice: 56,
              isPopular: true,
              badge: 'Économique',
              imageUrl: 'https://images.unsplash.com/photo-1545809074-59472b3f5eff?auto=format&fit=crop&w=600&q=80',
            },
          ],
        },
      ],
    },
  },
  {
    id: 'act-dar-zmen',
    name: 'Dar Zmen - دار زمان',
    nameAr: 'دار زمان',
    city: 'Sfax',
    locationName: 'Route Téniour Km 1.5, Picville, Sfax',
    category: 'food',
    type: 'cafe',
    categoryLabel: 'Cafés & Patrimoine',
    price: 12,
    rating: 4.8,
    reviewCount: 310,
    imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80',
    lightingActive: true,
    hasAirConditioning: true,
    directContact: true,
    phone: '+216 74 987 654',
    whatsapp: '+216 99 987 654',
    partnerTier: 'premium',
    isFeatured: true,
    highlight: 'Café turc à la fleur d’oranger & Thé aux amandes',
    description: 'Ambiance tunisienne authentique et décor traditionnel au cœur de Sfax. Café turc à la fleur d’oranger, thé aux amandes, pâtisseries sfaxiennes et chicha dans un cadre apaisant.',
    tags: ['Traditionnel', 'Thé aux amandes', 'Patrimoine', 'Chicha'],
    menu: {
      currency: 'DT',
      images: [
        'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1000&q=80',
      ],
      sections: [
        {
          id: 'sec-boissons-chaudes',
          title: 'Boissons & Thés d’Antan',
          titleAr: 'مشروبات وشاي زمان',
          icon: 'coffee',
          items: [
            {
              id: 'item-the-amandes',
              name: 'Thé Vert aux Amandes Grillées',
              nameAr: 'شاي أخضر باللوز المحمص',
              description: 'Infusion de menthe fraîche avec une généreuse dose d’amandes tunisiennes torréfiées.',
              price: 8.5,
              isSignature: true,
              isPopular: true,
              badge: 'Spécialité Maison',
              imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80',
            },
            {
              id: 'item-cafe-turc',
              name: 'Café Turc à l’Eau de Fleur d’Oranger',
              nameAr: 'قهوة تركية بماء زهر البرتقال',
              description: 'Préparé à l’ancienne dans un cezve en cuivre avec quelques gouttes de zhar sfaxien.',
              price: 6.5,
              isSignature: true,
              badge: 'Signature',
              imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
            },
            {
              id: 'item-cappuccino-miel',
              name: 'Cappuccino Mousse Miel & Cannelle',
              nameAr: 'كابوتشينو برغوة العسل والقرفة',
              description: 'Espresso double torréfaction, lait velouté fouetté, touche de miel pur et cannelle.',
              price: 7.5,
              isPopular: true,
              imageUrl: 'https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=600&q=80',
            },
          ],
        },
        {
          id: 'sec-patisserie',
          title: 'Douceurs Sfaxiennes',
          titleAr: 'حلويات صفاقسية أصيلة',
          icon: 'utensils',
          items: [
            {
              id: 'item-assiette-degustation',
              name: 'Assiette Royale de Pâtisseries Sfaxiennes',
              nameAr: 'صحن ملوكي من الحلويات الصفاقسية',
              description: 'Sélection raffinée de baklawa pistache, kaak warka aux amandes, mlabbes et ghraiba dorée.',
              price: 14,
              originalPrice: 18,
              isSignature: true,
              badge: 'Coup de Cœur',
              imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80',
            },
            {
              id: 'item-crepe-noisette',
              name: 'Crêpe Croustillante Noisettes & Chocolat Noir',
              nameAr: 'كريب مقرمش بالبندق والشوكولاتة',
              description: 'Crêpe fine artisanale nappée de praliné noisette fait maison et éclats croustillants.',
              price: 11,
              isPopular: true,
              imageUrl: 'https://images.unsplash.com/photo-1519676867240-f03562e64548?auto=format&fit=crop&w=600&q=80',
            },
          ],
        },
        {
          id: 'sec-chicha',
          title: 'Chicha & Espace Détente',
          titleAr: 'الشيشة والاسترخاء',
          icon: 'sparkles',
          items: [
            {
              id: 'item-chicha-pomme',
              name: 'Chicha Double Pomme Fakher',
              nameAr: 'شيشة تفاحتين فاخر',
              description: 'Servie avec embout stérile individuel et charbons naturels de coco renouvelés.',
              price: 16,
              isPopular: true,
              imageUrl: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=600&q=80',
            },
            {
              id: 'item-chicha-raisin',
              name: 'Chicha Raisin Menthe Glacée Premium',
              nameAr: 'شيشة عنب ونعناع مثلج',
              description: 'Saveur fraîche intense avec colonne refroidie pour une fumée veloutée.',
              price: 18,
              badge: 'Premium',
              imageUrl: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=600&q=80',
            },
          ],
        },
      ],
    },
  },
  {
    id: 'act-cafe-diwan',
    name: 'Café Diwan - Remparts de la Médina',
    nameAr: 'مقهى الديوان - أسوار المدينة',
    city: 'Sfax',
    locationName: 'Bab Diwan, Médina de Sfax',
    category: 'food',
    type: 'cafe',
    categoryLabel: 'Café avec Vue Mer',
    price: 10,
    rating: 4.7,
    reviewCount: 260,
    imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
    lightingActive: true,
    hasAirConditioning: false,
    directContact: true,
    partnerTier: 'standard',
    highlight: 'Terrasse panoramique sur les remparts historiques',
    description: 'Terrasse panoramique perchée sur les remparts de la Médina de Sfax. Vue imprenable sur Bab Diwan et le port maritime avec brise marine fraîche.',
    tags: ['Vue Mer', 'Médina Historique', 'Terrasse', 'Panoramique'],
    menu: {
      currency: 'DT',
      sections: [
        {
          id: 'sec-diwan-cafe',
          title: 'Caféterie & Boissons Fraîches',
          titleAr: 'المقهى والمشروبات',
          items: [
            {
              id: 'diwan-express',
              name: 'Café Express Italien',
              nameAr: 'قهوة سريعة إيطالية',
              description: 'Grain pur arabica torréfié selon la méthode napolitaine.',
              price: 3.5,
            },
            {
              id: 'diwan-the-menthe',
              name: 'Thé Rouge Traditionnel aux Pignons',
              nameAr: 'شاي أحمر بالبندق الصنوبري',
              description: 'Thé fort parfumé avec généreuse garniture de pignons.',
              price: 7.0,
            },
            {
              id: 'diwan-jus-orange',
              name: 'Jus d’Orange Fraîchement Pressé',
              nameAr: 'عصير برتقال طازج',
              description: '100% fruits locaux de saison sans sucre ajouté.',
              price: 6.0,
            },
            {
              id: 'diwan-toast',
              name: 'Toast Croque-Monsieur Fromage & Jambon',
              nameAr: 'توست جبن وحبش',
              description: 'Pain de mie toasté avec fromage fondu et salade fraîche.',
              price: 7.5,
            },
          ],
        },
      ],
    },
  },
  {
    id: 'act-escape-room',
    name: 'Escape Room Sfax',
    nameAr: 'غرفة الهروب صفاقس',
    city: 'Sfax',
    locationName: 'Route Afrane Km 3, Sfax',
    category: 'fun',
    categoryLabel: 'Aventure & Frissons',
    price: 25,
    rating: 4.8,
    reviewCount: 142,
    imageUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80',
    lightingActive: true,
    hasAirConditioning: true,
    directContact: true,
    highlight: '60 minutes chrono d’énigmes en équipe',
    description: 'Une expérience d’immersion palpitante entre amis ! Résolvez les énigmes et évadez-vous en moins de 60 minutes avec adrénaline garantie.',
    tags: ['Défi d’équipe', 'Énigmes', 'Adrénaline', 'Climatisé'],
  },
  {
    id: 'act-bowling-mall',
    name: 'Bowling & Loisirs Mall of Sfax',
    nameAr: 'بولينغ وألعاب مول صفاقس',
    city: 'Sfax',
    locationName: 'Mall of Sfax, Route de Tunis Km 9, Sakiet Ezzit',
    category: 'fun',
    categoryLabel: 'Loisirs Indoor & Arcade',
    price: 18,
    rating: 4.8,
    reviewCount: 195,
    imageUrl: 'https://images.unsplash.com/photo-1538388149866-71294d1f0b54?auto=format&fit=crop&w=800&q=80',
    lightingActive: true,
    hasAirConditioning: true,
    directContact: true,
    highlight: 'Pistes de bowling dernier cri & Arcade interactif',
    description: 'Pistes de bowling dernier cri, billard et jeux d’arcade interactifs pour une soirée festive et compétitive au Mall of Sfax.',
    tags: ['Bowling', 'Billard', 'Jeux Arcade', 'Compétition'],
  },
  {
    id: 'act-theatre-sfax',
    name: 'Théâtre Municipal & Bab Bhar',
    nameAr: 'المسرح البلدي وباب بحر',
    city: 'Sfax',
    locationName: 'Avenue Hédi Chaker, Bab Bhar, Sfax',
    category: 'creative',
    categoryLabel: 'Culture & Spectacles',
    price: 10,
    rating: 4.6,
    reviewCount: 180,
    imageUrl: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=800&q=80',
    lightingActive: true,
    hasAirConditioning: true,
    directContact: false,
    highlight: 'Concerts live, pièces théâtrales & expositions',
    description: 'Cœur architectural et culturel de Sfax. Spectacles théâtraux, concerts en direct et expositions artistiques au cœur de Bab Bhar.',
    tags: ['Culture', 'Théâtre', 'Concerts', 'Architecture'],
  },
  {
    id: 'act-le-moulin',
    name: 'Le Moulin Cafe & Lounge',
    nameAr: 'لو مولان كافيه ولاونج',
    city: 'Sfax',
    locationName: 'Route Gremda Km 2, Sfax',
    category: 'food',
    categoryLabel: 'Lounge Cosy & Brunch',
    price: 14,
    rating: 4.7,
    reviewCount: 220,
    imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80',
    lightingActive: true,
    hasAirConditioning: true,
    directContact: true,
    highlight: 'Café de spécialité & Ambiance studieuse ou festive',
    description: 'Lounge élégant et cosy avec café de spécialité, brunchs gourmands et ambiance musicale feutrée pour se retrouver entre amis ou étudier.',
    tags: ['Lounge Cosy', 'Wi-Fi Rapide', 'Brunch', 'Gourmand'],
  },
  {
    id: 'act-chaffar-beach',
    name: 'Plage de Chaffar Sfax',
    nameAr: 'شاطئ الشفار - صفاقس',
    city: 'Sfax',
    locationName: 'Plage Chaffar, Mahres, Sfax',
    category: 'outdoor',
    categoryLabel: 'Plein Air & Mer',
    price: 0,
    rating: 4.6,
    reviewCount: 390,
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    lightingActive: false,
    hasAirConditioning: false,
    directContact: false,
    highlight: 'Plage de sable fin & Coucher de soleil magnifique',
    description: 'La plus belle plage de sable fin de la région de Sfax. Idéale pour les baignades estivales, pique-niques en famille, beach-volley et couchers de soleil.',
    tags: ['Accès Gratuit', 'Baignade', 'Plein Air', 'Plage'],
  },
];
