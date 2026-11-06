/**
 * Extrait des faits structurés d'une fiche. Aucune phrase ici : la couche `responses/` formate.
 */
export function extractActivityFacts(intent, activity) {
  if (!activity) return { available: false, values: {} };
  const pick = (obj) => {
    const values = Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && !v.length)));
    return { available: Object.keys(values).length > 0, values };
  };
  switch (intent) {
    case "ASK_OPENING_HOURS":
      return pick({ openingTime: activity.openingTime, closingTime: activity.closingTime, openDays: activity.openDays });
    case "ASK_MENU_OR_PRICE":
      return pick({ menuUrl: activity.menuUrl, menuImageUrl: activity.menuImageUrl, price: activity.price });
    case "ASK_LOCATION_OR_MAPS":
      return pick({ address: activity.address, city: activity.city, mapsUrl: activity.mapsUrl, locationName: activity.locationName });
    case "ASK_CONTACT_OR_SOCIAL":
      return pick({ phone: activity.phone, whatsapp: activity.whatsapp ? String(activity.whatsapp).replace(/[^0-9]/g, "") : undefined, instagram: activity.instagram });
    default:
      return { available: false, values: {} };
  }
}

