export interface DemoActivity {
  id: string;
  name: string;
  city: string;
  category: 'outdoor' | 'culture' | 'food' | 'fun';
  categoryLabel: string;
  price: number;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  lightingActive: boolean;
  directContact: boolean;
  highlight: string;
  tags: string[];
}

export const DEMO_ACTIVITIES: DemoActivity[] = [
  {
    id: 'act-1',
    name: 'Bowling & Lounge Mall of Sfax',
    city: 'Sfax',
    category: 'fun',
    categoryLabel: 'Loisirs Indoor',
    price: 25,
    rating: 4.9,
    reviewCount: 142,
    imageUrl: 'https://images.unsplash.com/photo-1544984243-ec57ea16fe25?auto=format&fit=crop&w=800&q=80',
    lightingActive: true,
    directContact: true,
    highlight: '-20% sur les sessions week-end',
    tags: ['Famille', 'Climatisé', 'Arcade'],
  },
  {
    id: 'act-2',
    name: 'Café Diwan & Terrasse Médina',
    city: 'Sfax',
    category: 'culture',
    categoryLabel: 'Culture & Détente',
    price: 12,
    rating: 4.8,
    reviewCount: 98,
    imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80',
    lightingActive: true,
    directContact: true,
    highlight: 'Vue panoramique sur les remparts',
    tags: ['Historique', 'Thé aux amandes', 'Vue toit'],
  },
  {
    id: 'act-3',
    name: 'Sortie Catamaran & Pêche Kerkennah',
    city: 'Kerkennah / Sfax',
    category: 'outdoor',
    categoryLabel: 'Plein Air & Mer',
    price: 45,
    rating: 4.95,
    reviewCount: 76,
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    lightingActive: true,
    directContact: true,
    highlight: 'Déjeuner frais poissons inclus',
    tags: ['Bateau', 'Baignade', 'Évasion'],
  },
  {
    id: 'act-4',
    name: 'Escape Game Énigmes Médina',
    city: 'Sfax',
    category: 'fun',
    categoryLabel: 'Loisirs & Frissons',
    price: 30,
    rating: 4.7,
    reviewCount: 64,
    imageUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80',
    lightingActive: true,
    directContact: true,
    highlight: '3 salles à thèmes immersives',
    tags: ['Équipe', 'Challenge', 'Indoor'],
  },
  {
    id: 'act-5',
    name: 'Atelier Céramique & Thé Sidi Bou Saïd',
    city: 'Sidi Bou Saïd / Tunis',
    category: 'culture',
    categoryLabel: 'Artisanat & Savoir-faire',
    price: 35,
    rating: 4.9,
    reviewCount: 110,
    imageUrl: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=800&q=80',
    lightingActive: true,
    directContact: true,
    highlight: 'Repartez avec votre pièce personnalisée',
    tags: ['Créatif', 'Tradition', 'Méditerranée'],
  },
  {
    id: 'act-6',
    name: 'Kitesurf & Sunset au Lagon Bleu',
    city: 'Djerba',
    category: 'outdoor',
    categoryLabel: 'Sensations Nautiques',
    price: 65,
    rating: 5.0,
    reviewCount: 88,
    imageUrl: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=800&q=80',
    lightingActive: true,
    directContact: true,
    highlight: 'Moniteurs certifiés IKO',
    tags: ['Glisse', 'Adrénaline', 'Plage'],
  },
];
