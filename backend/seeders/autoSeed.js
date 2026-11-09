import { User } from "../models/User.js";
import { Activity } from "../models/Activity.js";
import { getDevelopmentAdminSeed } from "./developmentAdminSeed.js";

// Liste des utilisateurs de démo
const demoUsers = [
  getDevelopmentAdminSeed(),
  {
    name: "Le Moulin Cafe & Lounge",
    email: "partner.moulin@activitytn.tn",
    password: "Partner123456!",
    role: "partner",
    establishmentName: "Le Moulin Cafe & Lounge",
    city: "صفاقس (Sfax)",
    bio: "Espace café gourmand, lounge convivial et organisation de soirées acoustiques.",
    avatar: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=200",
  },
  {
    name: "Chef Amine (Restaurant Le Pirate)",
    email: "restaurant.pirate@activitytn.tn",
    password: "Partner123456!",
    role: "partner",
    establishmentName: "Restaurant Le Pirate",
    city: "صفاقس (Sfax)",
    phone: "+216 74 200 100",
    bio: "Restaurant gastronomique en bord de mer, spécialités poissons frais, dorade royale et cuisine méditerranéenne.",
    avatar: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=200",
  },
  {
    name: "Youssef Sfaxi",
    email: "user.sfax@activitytn.tn",
    password: "User123456!",
    role: "user",
    city: "صفاقس (Sfax)",
    bio: "Passionné d'activités outdoor, de sorties entre amis et de bons cafés à Sfax.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
  },
].filter(Boolean);

const demoActivities = [
  {
    name: "Escape Room Sfax",
    category: "fun",
    type: "activity",
    city: "Sfax",
    locationName: "طريق الأفران كم 3، صفاقس",
    address: "Route Afrane Km 3, Sfax",
    description: "تجربة فريدة من نوعها مع أصحابك! حل الألغاز واهرب من الغرفة المظلمة قبل ما يوفى الوقت. أنشطة مليئة بالتحدي والتسلية.",
    price: 25,
    currency: "TND",
    rating: 4.8,
    reviewsCount: 142,
    distanceKm: 2.4,
    imageUrl: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80",
    badge: "10-30 DT",
    coordinates: { latitude: 34.74056, longitude: 10.76028 },
    isPopular: true,
    isFeatured: true,
    duration: "1h 30",
    durationMinutes: 90,
  },
  {
    name: "Karting Hergla Sousse",
    category: "sport",
    type: "activity",
    city: "Sousse",
    locationName: "طريق هرقلة، سوسة",
    address: "Route de Hergla, Sousse",
    description: "أسرع حلبة كارتينغ في تونس! عش تجربة السباق مع أصحابك في أجواء من التشويق والحماس مع السلامة التامة.",
    price: 35,
    currency: "TND",
    rating: 4.9,
    reviewsCount: 210,
    distanceKm: 4.1,
    imageUrl: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80",
    badge: "30-50 DT",
    coordinates: { latitude: 35.987, longitude: 10.512 },
    isPopular: true,
    isFeatured: true,
    duration: "1h",
    durationMinutes: 60,
  },
  {
    name: "جولة البحر الشاطئ الأزرق",
    category: "outdoor",
    type: "activity",
    city: "Hammamet",
    locationName: "الشاطئ الشمالي، الحمامات",
    address: "Plage Nord, Hammamet",
    description: "تمتع بمشية هادئة على شاطئ البحر في Hammamet مع رؤية الغروب، فرصة ممتازة لتفريغ الطاقة السلبية وتصوير صور رائعة.",
    price: 0,
    currency: "TND",
    rating: 4.6,
    reviewsCount: 88,
    distanceKm: 3.2,
    imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
    badge: "Gratuit",
    coordinates: { latitude: 36.4, longitude: 10.61 },
    isPopular: false,
    isFeatured: false,
    duration: "1h",
    durationMinutes: 60,
  },
  {
    name: "Bowling City Tunis",
    category: "fun",
    type: "activity",
    city: "Tunis",
    locationName: "المركز العمراني الشمالي، تونس",
    address: "Centre Urbain Nord, Tunis",
    description: "صالة بولينغ حديثة ومكيفة مع موسيقى وألعاب arcade. مكان مثالي لسهرية ممتعة مع الأصدقاء أو العائلة.",
    price: 18,
    currency: "TND",
    rating: 4.5,
    reviewsCount: 320,
    distanceKm: 5.5,
    imageUrl: "https://images.unsplash.com/photo-1538388149866-71294d1f0b54?auto=format&fit=crop&w=800&q=80",
    badge: "10-30 DT",
    coordinates: { latitude: 36.84, longitude: 10.19 },
    isPopular: true,
    isFeatured: false,
    duration: "2h",
    durationMinutes: 120,
  },
  {
    name: "سهرة قهوة وشيشة بالرباط",
    category: "food",
    type: "cafe",
    city: "Monastir",
    locationName: "الرباط التاريخي، المنستير",
    address: "Ribat de Monastir",
    description: "قعدة تقليدية مزيانة مطلة على بحر المنستير والرباط. مشروبات ساخنة وعصائر طازجة في أجواء ساحرة.",
    price: 12,
    currency: "TND",
    rating: 4.7,
    reviewsCount: 175,
    distanceKm: 1.8,
    imageUrl: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80",
    badge: "10-30 DT",
    coordinates: { latitude: 35.77, longitude: 10.83 },
    isPopular: false,
    isFeatured: false,
    duration: "2h",
    durationMinutes: 120,
  },
  {
    name: "ورشة الفخار التقليدي",
    category: "creative",
    type: "activity",
    city: "Bizerte",
    locationName: "المدينة القديمة، بنزرت",
    address: "Médina de Bizerte",
    description: "تعلم صناعة الفخار بيدك مع حرفيين محترفين واصنع قطعتك الفنية الخاصة بك لتأخذها معك كذكريات.",
    price: 20,
    currency: "TND",
    rating: 4.9,
    reviewsCount: 65,
    distanceKm: 6.0,
    imageUrl: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=800&q=80",
    badge: "10-30 DT",
    coordinates: { latitude: 37.27, longitude: 9.87 },
    isPopular: true,
    isFeatured: true,
    duration: "1h 30",
    durationMinutes: 90,
  },
  {
    name: "Kayak Cap Zebib",
    category: "outdoor",
    type: "activity",
    city: "Bizerte",
    locationName: "كاب زبيب، بنزرت",
    address: "Cap Zebib, Bizerte",
    description: "جولة كاواك بين المغارات والمياه الفيروزية الصافية في كاب زبيب. تجربة مغامرة لا تُنسى في طبيعة تونس.",
    price: 45,
    currency: "TND",
    rating: 5.0,
    reviewsCount: 95,
    distanceKm: 12.0,
    imageUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80",
    badge: "30-50 DT",
    coordinates: { latitude: 37.26, longitude: 10.04 },
    isPopular: true,
    isFeatured: true,
    duration: "3h",
    durationMinutes: 180,
  },
  {
    name: "Cinema Pathé Tunis",
    category: "fun",
    type: "activity",
    city: "Tunis",
    locationName: "تونس سيتي، أريانة",
    address: "Géant Tunis City, Ariana",
    description: "شاهد أحدث الأفلام العالمية والعربية في قاعات سينما فخمة وتقنيات صوت وشاشة ثلاثية الأبعاد حديثة.",
    price: 16,
    currency: "TND",
    rating: 4.7,
    reviewsCount: 540,
    distanceKm: 7.8,
    imageUrl: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80",
    badge: "10-30 DT",
    coordinates: { latitude: 36.88, longitude: 10.12 },
    isPopular: false,
    isFeatured: false,
    duration: "2h",
    durationMinutes: 120,
  },
];

export const autoSeedIfEmpty = async () => {
  if (process.env.NODE_ENV !== "development") return;
  try {
    const count = await Activity.countDocuments();
    if (count > 0) {
      console.log(`ℹ️ [DB AutoSeed] La base contient déjà ${count} activités.`);
      return;
    }

    console.log("🌱 [DB AutoSeed] Base vide détectée, initialisation automatique...");

    const createdUsersMap = {};
    for (const userData of demoUsers) {
      let user = await User.findOne({ email: userData.email });
      if (!user) {
        user = await User.create(userData);
      }
      createdUsersMap[userData.role] = user;
    }

    const adminUser = createdUsersMap["admin"];
    const partnerUser = createdUsersMap["partner"];

    for (const actData of demoActivities) {
      const owner = (actData.type === "cafe" || actData.city === "Sfax") ? partnerUser : (adminUser || partnerUser);
      await Activity.create({
        ...actData,
        createdBy: owner._id,
      });
    }

    console.log(`✨ [DB AutoSeed] ${demoActivities.length} activités insérées avec succès dans MongoDB !`);
  } catch (error) {
    console.warn("⚠️ [DB AutoSeed] Erreur lors de l'auto-seed :", error.message);
  }
};
