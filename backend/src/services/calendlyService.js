import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const CALENDLY_API_KEY = process.env.CALENDLY_API_KEY;
const CALENDLY_BASE_URL = 'https://api.calendly.com';

const calendlyClient = axios.create({
  baseURL: CALENDLY_BASE_URL,
  headers: {
    'Authorization': `Bearer ${CALENDLY_API_KEY}`,
    'Content-Type': 'application/json'
  }
});

// Get current user info (to get organization URI)
export async function getCurrentUser() {
  try {
    const response = await calendlyClient.get('/users/me');
    return response.data.resource;
  } catch (error) {
    console.error('Error fetching Calendly user:', error.response?.data || error.message);
    throw error;
  }
}

// Get organization
export async function getOrganization() {
  try {
    const user = await getCurrentUser();
    const orgUri = user.current_organization;
    
    const response = await calendlyClient.get(orgUri.replace('https://api.calendly.com', ''));
    return response.data.resource;
  } catch (error) {
    console.error('Error fetching organization:', error.response?.data || error.message);
    throw error;
  }
}

// Get all event types for organization
export async function getEventTypes() {
  try {
    const user = await getCurrentUser();
    const response = await calendlyClient.get('/event_types', {
      params: {
        organization: user.current_organization,
        count: 100
      }
    });
    return response.data.collection;
  } catch (error) {
    console.error('Error fetching event types:', error.response?.data || error.message);
    throw error;
  }
}

// Get scheduled events (bookings)
export async function getScheduledEvents(params = {}) {
  try {
    const user = await getCurrentUser();
    const response = await calendlyClient.get('/scheduled_events', {
      params: {
        organization: user.current_organization,
        count: params.count || 100,
        status: params.status || 'active',
        min_start_time: params.min_start_time, // ISO 8601 format
        max_start_time: params.max_start_time
      }
    });
    return response.data.collection;
  } catch (error) {
    console.error('Error fetching scheduled events:', error.response?.data || error.message);
    throw error;
  }
}

// Get event details
export async function getEvent(eventUri) {
  try {
    const response = await calendlyClient.get(eventUri.replace('https://api.calendly.com', ''));
    return response.data.resource;
  } catch (error) {
    console.error('Error fetching event:', error.response?.data || error.message);
    throw error;
  }
}

// Get invitee (who booked the call)
export async function getInvitee(inviteeUri) {
  try {
    const response = await calendlyClient.get(inviteeUri.replace('https://api.calendly.com', ''));
    return response.data.resource;
  } catch (error) {
    console.error('Error fetching invitee:', error.response?.data || error.message);
    throw error;
  }
}

// Get organization members (your team)
export async function getOrganizationMembers() {
  try {
    const user = await getCurrentUser();
    const response = await calendlyClient.get('/organization_memberships', {
      params: {
        organization: user.current_organization,
        count: 100
      }
    });
    return response.data.collection;
  } catch (error) {
    console.error('Error fetching members:', error.response?.data || error.message);
    throw error;
  }
}