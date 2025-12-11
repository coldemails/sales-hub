import express from 'express';
import * as calendlyService from '../services/calendlyService.js';

const router = express.Router();

router.get('/user', async (req, res) => {
  try {
    const user = await calendlyService.getCurrentUser();
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/organization', async (req, res) => {
  try {
    const org = await calendlyService.getOrganization();
    res.json({ organization: org });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/members', async (req, res) => {
  try {
    const members = await calendlyService.getOrganizationMembers();
    res.json({ members });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/event-types', async (req, res) => {
  try {
    const eventTypes = await calendlyService.getEventTypes();
    res.json({ eventTypes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get event types with team classification
router.get('/event-types/with-team-info', async (req, res) => {
  try {
    console.log('[Calendly API] Fetching event types with team info...');
    const eventTypes = await calendlyService.getEventTypesWithTeamInfo();
    res.json({ 
      eventTypes,
      count: eventTypes.length,
      teamCount: eventTypes.filter(et => et.isTeamEvent).length,
      personalCount: eventTypes.filter(et => !et.isTeamEvent).length
    });
  } catch (error) {
    console.error('[Calendly API] Error fetching event types with team info:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get event type details by URI
router.get('/event-type-details', async (req, res) => {
  try {
    const { uri } = req.query;
    
    if (!uri) {
      return res.status(400).json({ error: 'Event type URI is required' });
    }
    
    console.log(`[Calendly API] Fetching event type details for: ${uri}`);
    const eventTypeDetails = await calendlyService.getEventTypeDetails(uri);
    
    res.json({ eventType: eventTypeDetails });
  } catch (error) {
    console.error('[Calendly API] Error fetching event type details:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get all scheduled events with optional filters
router.get('/scheduled-events', async (req, res) => {
  try {
    const { min_start_time, max_start_time, status, count } = req.query;
    
    const events = await calendlyService.getScheduledEvents({
      min_start_time,
      max_start_time,
      status,
      count
    });
    
    res.json({ events });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get today's scheduled events
router.get('/scheduled-events/today', async (req, res) => {
  try {
    console.log('[Calendly API] Fetching today\'s events...');
    
    // Get today's date range (start of day to end of day in ISO format)
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    
    const minStartTime = startOfDay.toISOString();
    const maxStartTime = endOfDay.toISOString();
    
    console.log(`[Calendly API] Date range: ${minStartTime} to ${maxStartTime}`);
    
    const events = await calendlyService.getScheduledEvents({
      min_start_time: minStartTime,
      max_start_time: maxStartTime,
      status: 'active',
      count: 100
    });
    
    console.log(`[Calendly API] ✅ Found ${events.length} events today`);
    
    // Enrich events with invitee information if available
    const enrichedEvents = await Promise.all(
      events.map(async (event) => {
        try {
          const invitees = event.event_memberships || [];
          return {
            ...event,
            invitee_email: invitees[0]?.user_email || null,
            invitee_name: invitees[0]?.user_name || null
          };
        } catch (error) {
          console.error(`[Calendly API] Error enriching event ${event.uri}:`, error.message);
          return event;
        }
      })
    );
    
    res.json({ 
      events: enrichedEvents,
      count: enrichedEvents.length,
      date: now.toISOString().split('T')[0]
    });
  } catch (error) {
    console.error('[Calendly API] Error fetching today\'s events:', error.message);
    res.status(500).json({ error: error.message });
  }
});

router.get('/health', async (req, res) => {
  try {
    await calendlyService.getCurrentUser();
    res.json({ status: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', error: error.message });
  }
});

export default router;