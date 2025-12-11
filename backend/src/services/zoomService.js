import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

class ZoomService {
  constructor() {
    this.accountId = process.env.ZOOM_ACCOUNT_ID;
    this.clientId = process.env.ZOOM_CLIENT_ID;
    this.clientSecret = process.env.ZOOM_CLIENT_SECRET;
    this.baseURL = 'https://api.zoom.us/v2';
    this.tokenCache = null;
    this.tokenExpiry = null;
  }

  // Get OAuth access token (Server-to-Server OAuth)
  async getAccessToken() {
    try {
      // Return cached token if still valid
      if (this.tokenCache && this.tokenExpiry && Date.now() < this.tokenExpiry) {
        return this.tokenCache;
      }

      console.log('[Zoom] Fetching new access token...');
      
      const response = await axios.post(
        'https://zoom.us/oauth/token',
        null,
        {
          params: {
            grant_type: 'account_credentials',
            account_id: this.accountId
          },
          auth: {
            username: this.clientId,
            password: this.clientSecret
          }
        }
      );

      this.tokenCache = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000; // Refresh 1min before expiry

      console.log('[Zoom] ✅ Access token obtained');
      return this.tokenCache;
    } catch (error) {
      console.error('[Zoom] Error getting access token:', error.response?.data || error.message);
      throw new Error('Failed to authenticate with Zoom');
    }
  }

  // Get user by email
  async getUserByEmail(email) {
    try {
      console.log(`[Zoom] Fetching user by email: ${email}`);
      const token = await this.getAccessToken();
      
      const response = await axios.get(
        `${this.baseURL}/users/${email}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      console.log(`[Zoom] ✅ Found user: ${response.data.id}`);
      return {
        id: response.data.id,
        email: response.data.email,
        firstName: response.data.first_name,
        lastName: response.data.last_name,
        type: response.data.type,
        status: response.data.status
      };
    } catch (error) {
      if (error.response?.status === 404) {
        console.log(`[Zoom] User not found: ${email}`);
        return null;
      }
      console.error('[Zoom] Error fetching user:', error.response?.data || error.message);
      throw new Error(`Failed to fetch Zoom user: ${error.message}`);
    }
  }

  // Create a new Zoom user
  async createUser(firstName, lastName, email) {
    try {
      console.log(`[Zoom] Creating user: ${email}`);
      const token = await this.getAccessToken();
      
      const response = await axios.post(
        `${this.baseURL}/users`,
        {
          action: 'create',
          user_info: {
            email: email,
            type: 2, // Licensed user
            first_name: firstName,
            last_name: lastName
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(`[Zoom] ✅ User created: ${response.data.id}`);
      
      return {
        success: true,
        userId: response.data.id,
        email: response.data.email
      };
    } catch (error) {
      console.error('[Zoom] Error creating user:', error.response?.data || error.message);
      throw new Error(`Failed to create Zoom user: ${error.response?.data?.message || error.message}`);
    }
  }

  // Delete Zoom user permanently
  async deleteUser(userIdOrEmail, action = 'delete') {
    try {
      console.log(`[Zoom] Deleting user: ${userIdOrEmail} (action: ${action})`);
      const token = await this.getAccessToken();
      
      await axios.delete(
        `${this.baseURL}/users/${userIdOrEmail}`,
        {
          params: { action: action },
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      console.log(`[Zoom] ✅ User deleted successfully`);
      
      return {
        success: true,
        message: 'User deleted from Zoom'
      };
    } catch (error) {
      console.error('[Zoom] Error deleting user:', error.response?.data || error.message);
      throw new Error(`Failed to delete Zoom user: ${error.response?.data?.message || error.message}`);
    }
  }

  // Get user details by ID
  async getUser(userId) {
    try {
      console.log(`[Zoom] Fetching user: ${userId}`);
      const token = await this.getAccessToken();
      
      const response = await axios.get(
        `${this.baseURL}/users/${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      return {
        success: true,
        userId: response.data.id,
        email: response.data.email,
        status: response.data.status
      };
    } catch (error) {
      console.error('[Zoom] Error getting user:', error.response?.data || error.message);
      throw new Error(`Failed to get Zoom user: ${error.message}`);
    }
  }

  // Get license availability information
  async getLicenseInfo() {
    try {
      console.log('[Zoom] Fetching license info...');
      const token = await this.getAccessToken();
      
      // Get list of users with their license types
      const usersResponse = await axios.get(
        `${this.baseURL}/users`,
        {
          params: {
            status: 'active',
            page_size: 300
          },
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      // Count licensed users (type 2 = licensed, type 1 = basic)
      const allUsers = usersResponse.data.users || [];
      const licensedUsers = allUsers.filter(u => u.type === 2);
      
      // Get account settings to find total license count
      let totalLicenses = 0;
      try {
        const settingsResponse = await axios.get(
          `${this.baseURL}/accounts/${this.accountId}/settings`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        // Try to get license count from settings
        totalLicenses = settingsResponse.data.feature?.meeting_capacity || 0;
      } catch (error) {
        console.log('[Zoom] Could not fetch settings, using user count');
      }
      
      // If we couldn't get total from settings, try getting from billing/plan
      if (totalLicenses === 0) {
        try {
          const billingResponse = await axios.get(
            `${this.baseURL}/accounts/${this.accountId}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }
          );
          
          // Some accounts expose plan_base_purchased in account info
          totalLicenses = billingResponse.data.options?.host_limit || billingResponse.data.host_limit || 0;
        } catch (error) {
          console.log('[Zoom] Could not fetch billing info');
        }
      }
      
      // If still 0, assume the total is the current count + some buffer
      // This prevents false "no licenses" when we can't determine the limit
      if (totalLicenses === 0) {
        totalLicenses = Math.max(licensedUsers.length + 5, 25); // At least 5 free or minimum 25
        console.log(`[Zoom] Could not determine license limit, assuming ${totalLicenses}`);
      }

      const usedLicenses = licensedUsers.length;
      const availableLicenses = Math.max(0, totalLicenses - usedLicenses);
      const usagePercentage = totalLicenses > 0 ? Math.round((usedLicenses / totalLicenses) * 100) : 0;

      console.log(`[Zoom] ✅ License info: ${usedLicenses}/${totalLicenses} used (${usagePercentage}%)`);

      return {
        platform: 'zoom',
        total: totalLicenses,
        used: usedLicenses,
        available: availableLicenses,
        percentage: usagePercentage,
        hasAvailableLicenses: availableLicenses > 0
      };
    } catch (error) {
      console.error('[Zoom] Error getting license info:', error.response?.data || error.message);
      
      // Return a permissive response on error so onboarding isn't blocked
      return {
        platform: 'zoom',
        total: 25,
        used: 0,
        available: 25,
        percentage: 0,
        hasAvailableLicenses: true,
        error: error.message
      };
    }
  }
}

export default new ZoomService();