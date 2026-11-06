export const APP_HELP_TOPICS = Object.freeze({
  HELP_GENERAL: ["discover", "details", "plan"],
  PARTNER_MANAGE_ACTIVITY: ["partner_space", "menu", "amenities"],
  PARTNER_HOURS_HELP: ["partner_hours"],
  PARTNER_PROMOTION_HELP: ["partner_promotion"],
});

export const getHelpTopics = (intent) => APP_HELP_TOPICS[intent] || APP_HELP_TOPICS.HELP_GENERAL;

