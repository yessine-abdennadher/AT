import * as telemetryService from "../services/telemetry.service.js";

// @desc    Enregistrer un événement de télémétrie (asynchrone / non-bloquant)
// @route   POST /api/telemetry/track
// @access  Public
export const trackEvent = async (req, res, next) => {
  try {
    const { sessionId, eventType, screenName, metadata } = req.body;
    const userId = req.user ? req.user._id : null;
    const userRole = req.user ? req.user.role : "guest";

    const event = await telemetryService.recordTelemetryEvent({
      sessionId,
      eventType,
      screenName,
      userId,
      userRole,
      metadata,
    });

    res.status(201).json({ success: true, eventId: event._id });
  } catch (error) {
    // La télémétrie ne doit jamais planter l'app mobile
    res.status(200).json({ success: false, message: error.message });
  }
};
