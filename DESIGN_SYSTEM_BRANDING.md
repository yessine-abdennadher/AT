# 🎨 TFARHIDA (تفرهيدة) & WIN — BRAND BOOK & DESIGN SYSTEM UX/UI (WEB & MOBILE)

> **Document de Référence Unique (Single Source of Truth)**  
> Ce document définit l'ensemble des règles de design, l'identité de marque, les palettes de couleurs exactes, la typographie, les espacements, les composants d'interface et les directives UX/UI pour le Web ([`landing`](file:///c:/AT/landing)) et le Mobile ([`activitytn`](file:///c:/AT/activitytn)).

---

## 📌 Sommaire
1. [Identité de Marque & Branding](#1-identité-de-marque--branding)
2. [Palette Chromatique Complète](#2-palette-chromatique-complète)
   - [2.1 Couleurs Signature & Brand](#21-couleurs-signature--brand)
   - [2.2 Dégradés Officiels (Gradients)](#22-dégradés-officiels-gradients)
   - [2.3 Surfaces, Arrière-plans & Neutres (Clair & Sombre)](#23-surfaces-arrière-plans--neutres-clair--sombre)
   - [2.4 Couleurs Fonctionnelles & Sémantiques](#24-couleurs-fonctionnelles--sémantiques)
   - [2.5 Palettes Thématiques Identitaires Tunisiennes](#25-palettes-thématiques-identitaires-tunisiennes)
3. [Typographie & Styles d'Écriture](#3-typographie--styles-décriture)
   - [3.1 Polices Web & Mobile](#31-polices-web--mobile)
   - [3.2 Échelle Typographique (Type Scale)](#32-échelle-typographique-type-scale)
   - [3.3 Ton Rédactionnel & Multilinguisme (FR / AR RTL / EN)](#33-ton-rédactionnel--multilinguisme-fr--ar-rtl--en)
4. [Rayons de Courbure, Ombres & Élévation](#4-rayons-de-courbure-ombres--élévation)
   - [4.1 Rayons (Border Radius)](#41-rayons-border-radius)
   - [4.2 Ombres & Effets de Lueur (Shadows & Glows)](#42-ombres--effets-de-lueur-shadows--glows)
   - [4.3 Glassmorphism & Translucidité](#43-glassmorphism--translucidité)
5. [Directives Ergonomie, Composants & UX Patterns](#5-directives-ergonomie-composants--ux-patterns)
   - [5.1 Modales & Feuilles d'Édition](#51-modales--feuilles-dédition)
   - [5.2 Iconographie 100% Vectorielle](#52-iconographie-100-vectorielle)
   - [5.3 Recherche, Filtres & Suggestions](#53-recherche-filtres--suggestions)
   - [5.4 Zéro Scrollbar Parasite & Règles Responsive](#54-zéro-scrollbar-parasite--règles-responsive)

---

## 1. Identité de Marque & Branding

### 1.1 Nom & Valeurs
- **Nom Principal** : **Tfarhida** (تفرهيدة — *décompression, divertissement, joie de vivre en tunisien*).
- **Nom d'App / Label Mobile** : **WIN** (وين — *Où aller ?*).
- **Slogans Officiels** :
  - *FR* : "L'application N°1 des sorties en Tunisie" · "Que fait-on maintenant ?"
  - *AR* : "تفرهيدة · التطبيق الأول للخروجات في تونس" · "وين نمشيو اليوم؟"
  - *EN* : "The #1 Outings & Activities App in Tunisia" · "Where to next?"

### 1.2 Piliers de Différenciation
1. **Zéro Commission & Contact Direct** : Mise en relation immédiate sur WhatsApp avec le gérant de l'établissement sans intermédiaire payant.
2. **Statut Lumière & Électricité en Direct** : Information en temps réel sur la disponibilité électrique et climatisation (critique en Tunisie l'été).
3. **Sorties 100% Vérifiées sur le Terrain** : Horaires fiables, photos réelles, avis certifiés.
4. **Assistant Local KharjaBot** : Recommandation selon budget en Dinars Tunisiens (DT) et envies.

### 1.3 Personnalité & Ton de Voix
- **Chaleureux & Accessible** : Proche des Tunisiens, intégrant des touches de Derja authentique.
- **Moderne & Tech** : Design soyeux, micro-interactions, dégradés pastel et néon.
- **Rassurant & Transparent** : Clarté totale sur les prix en DT, 0 mauvaise surprise.

---

## 2. Palette Chromatique Complète

### 2.1 Couleurs Signature & Brand

| Rôle | Nom du Token | Valeur Hex | Variable Web (`variables.css`) | Variable Mobile (`WIN_COLORS`) | Utilisation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Cyan Électrique** | `Cyan Signature` | `#00D2FF` | `--color-cyan-glow` | `WIN_COLORS.cyan` | Lueur d'accent, badges vedettes, gradient hero |
| **Bleu Ciel** | `Cyan Light` | `#38BDF8` | `--color-primary-light` | `WIN_COLORS.cyanLight` | Liens actifs, états hover, mode sombre accent |
| **Bleu Méditerranée** | `Primary / Cyan Dark` | `#0284C7` | `--color-primary` | `WIN_COLORS.cyanDark` | Couleur primaire d'action, boutons principaux, icônes |
| **Bleu Royal** | `Royal Blue` | `#2563EB` | `--color-royal-blue` | `WIN_COLORS.blue` | Dégradés CTA, en-têtes contrastés |
| **Bleu Nuit Profond** | `Blue Dark` | `#1D4ED8` | `--color-primary-hover` | `WIN_COLORS.blueDark` | Hover de bouton primaire |
| **Violet Signature** | `Purple Signature` | `#7C3AED` | `--color-purple-signature` | `WIN_COLORS.purple` | Touche premium, tags spéciaux, dégradé |
| **Lilas Doux** | `Violet Light` | `#C084FC` | `--color-pale-purple` | `WIN_COLORS.violetLight` | Badges secondaires, dégradés pastel |
| **Corail Pastel** | `Coral` | `#FDA4AF` | N/A (surfaces accents) | `WIN_COLORS.coral` | Boutons soyeux dégradés mobile |
| **Rose Pêche** | `Peach / Rose` | `#FFD1BA` / `#FB7185` | N/A | `WIN_COLORS.peach` / `rose` | Accents festifs et dégradés féminins/lifestyle |

---

### 2.2 Dégradés Officiels (Gradients)

#### Web (CSS Linear Gradients)
```css
/* Dégradé Signature Logo & Titres Web */
--color-primary-gradient: linear-gradient(135deg, #00D2FF 0%, #2563EB 55%, #7C3AED 100%);

/* Fond Doux d'En-tête Clair */
--color-header-gradient: linear-gradient(135deg, #E0F2FE 0%, #EDE9FE 50%, #F0FDF4 100%);

/* Carte Business Sombre */
background: linear-gradient(135deg, #0F172A 0%, #1A2849 100%);
```

#### Mobile (React Native `expo-linear-gradient`)
```typescript
// Header Clair Soyeux
headerLight: ['#FCE3E4', '#C2A9FA', '#8CBBF8', '#DBCDFD']

// Header Cosmique Sombre
headerDark: ['#060B24', '#0F1E4A', '#1E1245', '#081730']

// Bouton CTA Principal Soyeux
buttonPrimary: ['#FDA4AF', '#C084FC', '#818CF8']

// Bouton Accent Électrique
buttonAccent: ['#00D2FF', '#2563EB', '#7C3AED']

// Fond d'Ondes Pastel (Splash & Onboarding)
pastelWave: ['#FCDADC', '#E0D4FC', '#CCE0FB', '#E7DEFE']
```

---

### 2.3 Surfaces, Arrière-plans & Neutres (Clair & Sombre)

#### Mode Clair (Sidi Bou Saïd & Pureté Méditerranéenne)
| Élément | Valeur Hex | Variable Web | Variable Mobile |
| :--- | :--- | :--- | :--- |
| **Fond d'Écran Principal** | `#F0F7FF` / `#F8FAFC` | `--bg-main` | `WIN_COLORS.slate50` / `bg` |
| **Fond Secondaire / Voile** | `#E0F2FE` | `--bg-secondary` | `WIN_COLORS.slate100` |
| **Carte / Card Surface** | `#FFFFFF` | `--bg-card` | `WIN_COLORS.white` |
| **Bordure Délicate** | `rgba(224, 242, 254, 0.9)` / `#E2E8F0` | `--border-subtle` | `WIN_COLORS.slate200` |
| **Bordure Marquée** | `#BAE6FD` | `--border-strong` | `WIN_COLORS.slate300` |
| **Texte Principal** | `#0F172A` | `--text-primary` | `WIN_COLORS.slate900` |
| **Texte Secondaire** | `#475569` | `--text-secondary` | `WIN_COLORS.slate600` |
| **Texte Estompé / Muted** | `#64748B` | `--text-muted` | `WIN_COLORS.slate500` |
| **Titre Navy Intense** | `#0B1528` | `--color-navy` | `WIN_COLORS.slate900` |

#### Mode Sombre (Cosmic Midnight)
| Élément | Valeur Hex | Variable Web | Variable Mobile |
| :--- | :--- | :--- | :--- |
| **Fond d'Écran Nuit** | `#060B24` | `--bg-main` | `WIN_COLORS.darkBg` (`#060B24`) |
| **Fond Secondaire Nuit** | `#0A1232` / `#0B132B` | `--bg-secondary` | `#0B132B` |
| **Carte Élevée Nuit** | `#0F172A` | `--bg-card` | `WIN_COLORS.darkCard` (`#0F172A`) |
| **Carte Surface Hover** | `#151D3B` | `--bg-card-hover` | `WIN_COLORS.darkSurface` (`#151D3B`) |
| **Bordure Nuit Subtile** | `rgba(255, 255, 255, 0.08)` | `--border-subtle` | `WIN_COLORS.darkBorder` (`rgba(255, 255, 255, 0.1)`) |
| **Bordure Nuit Prononcée**| `rgba(255, 255, 255, 0.16)` | `--border-strong` | `rgba(255, 255, 255, 0.15)` |
| **Texte Principal Sombre**| `#F8FAFC` | `--text-primary` | `#F8FAFC` |
| **Texte Secondaire Sombre**| `#CBD5E1` | `--text-secondary` | `WIN_COLORS.slate300` |
| **Texte Muted Sombre** | `#94A3B8` | `--text-muted` | `WIN_COLORS.slate400` |

---

### 2.4 Couleurs Fonctionnelles & Sémantiques

| Statut / Fonction | Hex Principal | Hex Fond Léger | Variable Web | Variable Mobile | Signification dans Tfarhida |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Succès / En Direct** | `#10B981` | `#D1FAE5` | `--color-emerald` | `WIN_COLORS.success` | **Lumière active**, ouvert maintenant, réservation confirmée |
| **Alerte / Attente** | `#F59E0B` | `#FEF3C7` | `--color-amber` | `WIN_COLORS.warning` | Affluence modérée, validation en cours |
| **Danger / Rouge Tunisie** | `#E11D48` / `#EF4444` | `#FFE4E6` | `--color-tunisian-red` | `WIN_COLORS.danger` | Fermé, alerte coupure, annulation |
| **Information / Action** | `#3B82F6` / `#0284C7` | `#E0F2FE` | `--color-primary` | `WIN_COLORS.info` | Conseils, filtres appliqués, WhatsApp direct |
| **WhatsApp Officiel** | `#25D366` | `#DCFCE7` | N/A | `#25D366` | Bouton direct WhatsApp gérant |

---

### 2.5 Palettes Thématiques Identitaires Tunisiennes

Dans l'application mobile (`APP_PALETTES`), l'utilisateur peut basculer entre 5 thèmes identitaires tunisiens :

1. **WIN Signature (`win_original`)** :
   - *Ambiance* : Pastel, Cyan électrique (`#00D2FF`) et Violet iconique (`#9865F0`).
2. **Sidi Bou Saïd (`sidi_bou_said`)** :
   - *Ambiance* : Bleu cobalt méditerranéen (`#0284C7`), blanc pur et falaises turquoise (`#38BDF8`).
3. **Carthage Sunset (`sunset_carthage`)** :
   - *Ambiance* : Coucher de soleil doré, ambre chaud (`#EA580C`) et terracotta crépusculaire (`#F59E0B`).
4. **Oasis de Tozeur (`oasis_tozeur`)** :
   - *Ambiance* : Émeraude luxuriant des palmeraies (`#059669`) et fraîcheur mentholée du Sud (`#10B981`).
5. **Flamant Rose (`rose_flamingo`)** :
   - *Ambiance* : Féerie des lacs salés de Chott El Jerid, rose magenta vibrant (`#DB2777` & `#EC4899`).

---

## 3. Typographie & Styles d'Écriture

### 3.1 Polices Web & Mobile

#### Web (CSS Stack)
- **Police Display (Grandes Accroches / Hero)** :
  `'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif`
  *(Donne un aspect tech, moderne et ultra-propre)*.
- **Police Titres & Headings** :
  `'Outfit', -apple-system, BlinkMacSystemFont, sans-serif`
  *(Typographie géométrique, ronde et vivante)*.
- **Police de Corps (Body / Textes courants)** :
  `'Inter', -apple-system, BlinkMacSystemFont, sans-serif`
  *(Clarté de lecture maximale, haute lisibilité des petits caractères)*.
- **Police Arabe Officielle** :
  `'Noto Kufi Arabic', -apple-system, BlinkMacSystemFont, sans-serif`
  *(Kufi moderne, équilibré, géométrie harmonieuse avec Outfit et Inter)*.

#### Mobile (Expo Google Fonts 100% Unifié avec le Web)
- **Police Titres & Accroches** :
  `Outfit` (via `@expo-google-fonts/outfit` : `Outfit_600SemiBold`, `Outfit_700Bold`, `Outfit_800ExtraBold`, `Outfit_900Black`).
  *(Même identité ronde, géométrique et dynamique que le site web)*.
- **Police de Corps, Tarifs & Détails** :
  `Inter` (via `@expo-google-fonts/inter` : `Inter_400Regular`, `Inter_500Medium`, `Inter_600SemiBold`, `Inter_700Bold`).
  *(Lisibilité chirurgicale des chiffres, prix en DT et adresses)*.
- **Police Arabe Officielle Mobile** :
  `Noto Kufi Arabic` (via `@expo-google-fonts/noto-kufi-arabic` : `NotoKufiArabic_600SemiBold`, `NotoKufiArabic_700Bold`, `NotoKufiArabic_800ExtraBold`).
  *(Calligraphie contemporaine haut de gamme en Arabe / RTL)*.
- **Composant & Tokens Mobile Dédiés** :
  - Tokens et helper : [`c:/AT/activitytn/src/theme/typography.ts`](file:///c:/AT/activitytn/src/theme/typography.ts) (`FONTS`, `getAppFont`).
  - Composant de texte unifié : [`c:/AT/activitytn/src/components/ui/AppText.tsx`](file:///c:/AT/activitytn/src/components/ui/AppText.tsx).

---

### 3.2 Échelle Typographique (Type Scale)

| Niveau | Taille Web (CSS clamp / px) | Taille Mobile (px) | Graisse (Weight) | Hauteur de ligne (Line-height) | Rôle dans l'application |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Hero Display** | `clamp(2.5rem, 5vw, 4rem)` (40-64px) | `32 - 38px` | `800` à `900` | `1.10 - 1.15` | Slogan principal d'atterrissage |
| **Heading 1 (H1)** | `clamp(2rem, 4vw, 3rem)` (32-48px) | `26 - 30px` | `800` | `1.20` | Titre de section majeure, nom d'établissement |
| **Heading 2 (H2)** | `clamp(1.5rem, 3vw, 2.2rem)` (24-35px) | `20 - 24px` | `700` ou `800` | `1.25` | Titres de cartes, modals, filtres |
| **Heading 3 (H3)** | `1.25rem - 1.5rem` (20-24px) | `17 - 19px` | `700` | `1.30` | Sous-titres de cartes, catégories |
| **Body Large** | `1.05rem - 1.15rem` (17-18px) | `16px` | `400` ou `500` | `1.60` | Descriptions d'activités, intro hero |
| **Body Base** | `1rem` (16px) | `14 - 15px` | `400` ou `500` | `1.50` | Texte courant, tarifs, avis |
| **Body Small** | `0.875rem` (14px) | `12 - 13px` | `500` ou `600` | `1.40` | Méta-informations, horaires, ville |
| **Caption / Badge**| `0.75rem - 0.8125rem` (12-13px)| `11 - 12px` | `700` ou `800` | `1.20` | Badges "En vedette", statut "Lumière active", pills |

---

### 3.3 Ton Rédactionnel & Multilinguisme (FR / AR RTL / EN)

- **Gestion du RTL Arabe** :
  - Sur le Web : l'attribut `dir="rtl"` bascule dynamiquement l'orientation et applique `'Noto Kufi Arabic'` automatiquement.
  - Sur Mobile : `I18nManager.isRTL` gère l'inversion des listes et alignements.
  - **Règle absolue d'inversion** : Les flèches de navigation directionnelles s'inversent (`<ArrowLeft>` en LTR devient `<ArrowRight>` en RTL), mais les icônes de symboles universels (téléphone, WhatsApp, étoile, horloge) restent fixes.
- **Micro-copies Clés à toujours privilégier** :
  - *Ne dites pas* : "Acheter un ticket" ou "Prendre un abonnement payant".
  - *Dites plutôt* : "Réserver par WhatsApp", "Sortie vérifiée", "Accès Gratuit", "En vedette".
  - *Monnaie* : Toujours **DT** (Dinar Tunisien), ex : `25 DT`, `Dès 8 DT`, jamais de devises étrangères.

---

## 4. Rayons de Courbure, Ombres & Élévation

### 4.1 Rayons (Border Radius)

| Token | Valeur Web | Valeur Mobile | Utilisation |
| :--- | :--- | :--- | :--- |
| `--radius-sm` | `8px` | `6 - 8px` | Petits badges, inputs simples, boutons de filtres denses |
| `--radius-md` | `12px` | `12 - 14px` | Cartes d'activités compactes, bannières d'alerte, boutons standards |
| `--radius-lg` | `18px` | `18 - 20px` | Cartes principales d'activités, conteneurs de formulaire |
| `--radius-xl` | `26px` | `26 - 32px` | Grandes modales d'activités, sections hero arrondies, popups |
| `--radius-full` | `9999px` | `9999px` | Badges pilules (Pills), puces de catégories, avatars |

---

### 4.2 Ombres & Effets de Lueur (Shadows & Glows)

```css
/* Mode Clair (Ombres teintées Cyan/Bleu pour éviter l'effet gris terne) */
--shadow-sm: 0 1px 3px 0 rgba(2, 132, 199, 0.08);
--shadow-md: 0 4px 6px -1px rgba(2, 132, 199, 0.1), 0 2px 4px -2px rgba(2, 132, 199, 0.06);
--shadow-lg: 0 10px 15px -3px rgba(2, 132, 199, 0.12), 0 4px 6px -4px rgba(2, 132, 199, 0.08);
--shadow-xl: 0 20px 25px -5px rgba(11, 21, 40, 0.12), 0 8px 10px -6px rgba(11, 21, 40, 0.08);
--shadow-glow: 0 0 28px rgba(0, 210, 255, 0.45);

/* Mode Sombre (Ombres profondes et lueurs néon immersives) */
--shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.4);
--shadow-md: 0 4px 10px rgba(0, 0, 0, 0.55);
--shadow-lg: 0 10px 25px rgba(0, 0, 0, 0.65);
--shadow-xl: 0 20px 35px rgba(0, 0, 0, 0.8);
```

---

### 4.3 Glassmorphism & Translucidité

Pour les en-têtes flottants, la barre de navigation et les pilules de statut :
- **Web** :
  ```css
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-bottom: 1px solid var(--border-subtle);
  ```
- **Mobile** :
  ```typescript
  pillBgLight: 'rgba(255, 255, 255, 0.22)',
  pillBorderLight: 'rgba(255, 255, 255, 0.35)',
  surfaceGlassDark: 'rgba(15, 23, 42, 0.85)',
  cyanGlow: 'rgba(0, 210, 255, 0.3)',
  violetGlow: 'rgba(124, 58, 237, 0.25)'
  ```

---

## 5. Directives Ergonomie, Composants & UX Patterns

### 5.1 Modales & Feuilles d'Édition
- **Règle absolue Mobile** : Toujours utiliser [`ScrollableModal`](file:///c:/AT/activitytn/src/components/ui/ScrollableModal.tsx).
  - Inclut le glissement vers le bas (*swipe down* avec PanResponder), le tap sur l'arrière-plan (*backdrop dismiss*), la gestion du bouton physique retour Android, et son propre `<ScrollView>` fluide sans double barre.
- **Règle absolue Web** :
  - Touche `Échap` (Escape) pour fermer instantanément.
  - Verrouillage du scroll du corps de page (`document.body.style.overflow = 'hidden'`) à l'ouverture pour éliminer tout défilement résiduel.

### 5.2 Iconographie 100% Vectorielle
- **Strictement ZÉRO emoji** dans les composants d'interface, boutons et données de production.
- **Bibliothèque Web** : `lucide-react` (traits de `1.5` à `2px`, formats 14px, 16px, 18px, 20px, 24px).
- **Bibliothèque Mobile** : `@expo/vector-icons` (`Ionicons`, `MaterialCommunityIcons`, `Feather`).

### 5.3 Recherche, Filtres & Suggestions
- Dès que l'utilisateur commence à saisir dans la barre de recherche :
  - Affichage instantané du menu déroulant de suggestions.
  - Support des touches clavier `↑` / `↓` / `Entrée` avec mise en surbrillance visible de l'item actif (`bg-primary-light` ou `var(--color-pale-blue)`).
  - Clic direct sur une suggestion ouvrant immédiatement la fiche modale de l'établissement sans étape intermédiaire inutile.
  - Synchronisation en direct avec la grille d'activités pour refléter le filtre.

### 5.4 Zéro Scrollbar Parasite & Règles Responsive
- **Interdiction des barres de défilement horizontales** sur smartphone et tablette :
  - Utilisation systématique de `overflow-x: clip;` ou `overflow: hidden;` sur les sections hôtes.
  - Masquage des scrollbars décoratives via `scrollbar-width: none;` et `::-webkit-scrollbar { display: none; }` sur les listes horizontales de catégories.
- **Zones tactiles minimales** : Chaque bouton, puce de catégorie ou action clickable doit respecter un minimum de **44 × 44 px** de zone d'interaction tactile.

---

> 📝 **Maintenance** : Toute nouvelle couleur, police ou directive ajoutée dans [`variables.css`](file:///c:/AT/landing/src/styles/variables.css) ou [`colors.ts`](file:///c:/AT/activitytn/src/theme/colors.ts) doit être répercutée dans ce Brand Book.

