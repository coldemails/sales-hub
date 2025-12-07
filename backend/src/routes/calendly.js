import express from 'express';
import * as calendlyService from '../services/calendlyService.js';

const router = express.Router();

// Get current user
router.get('/user', async (req, res) => {
  try {
    const user = await calendlyService.getCurrentUser();
    res.json({ user });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch Calendly user',
      details: error.message 
    });
  }
});

// Get organization
router.get('/organization', async (req, res) => {
  try {
    const org = await calendlyService.getOrganization();
    res.json({ organization: org });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch organization',
      details: error.message 
    });
  }
});

// Get event types
router.get('/event-types', async (req, res) => {
  try {
    const eventTypes = await calendlyService.getEventTypes();
    res.json({ 
      eventTypes,
      count: eventTypes.length 
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch event types',
      details: error.message 
    });
  }
});

// Get scheduled events (bookings)
router.get('/scheduled-events', async (req, res) => {
  try {
    const { min_start_time, max_start_time, status, count } = req.query;
    
    const events = await calendlyService.getScheduledEvents({
      min_start_time,
      max_start_time,
      status,
      count: count ? parseInt(count) : 100
    });
    
    res.json({ 
      events,
      count: events.length 
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch scheduled events',
      details: error.message 
    });
  }
});

// Get today's events
router.get('/scheduled-events/today', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const events = await calendlyService.getScheduledEvents({
      min_start_time: today.toISOString(),
      max_start_time: tomorrow.toISOString(),
      status: 'active'
    });
    
    res.json({ 
      events,
      count: events.length,
      date: today.toISOString().split('T')[0]
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch today\'s events',
      details: error.message 
    });
  }
});

// Get organization members (closers)
router.get('/members', async (req, res) => {
  try {
    const members = await calendlyService.getOrganizationMembers();
    res.json({ 
      members,
      count: members.length 
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch members',
      details: error.message 
    });
  }
});

// Health check
router.get('/health', async (req, res) => {
  try {
    await calendlyService.getCurrentUser();
    res.json({ 
      status: 'connected',
      message: 'Calendly API is operational' 
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error',
      message: 'Calendly API connection failed',
      details: error.message 
    });
  }
});

export default router;