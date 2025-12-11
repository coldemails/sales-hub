import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_WORKSPACE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = process.env.GOOGLE_WORKSPACE_PRIVATE_KEY?.replace(/\\n/g, '\n').replace(/^"|"$/g, '');
const ADMIN_EMAIL = process.env.GOOGLE_WORKSPACE_ADMIN_EMAIL;
const CUSTOMER_ID = process.env.GOOGLE_WORKSPACE_CUSTOMER_ID || 'my_customer';

// Debug logging
console.log('[Google Workspace] Config loaded:');
console.log('- Service Account Email:', SERVICE_ACCOUNT_EMAIL);
console.log('- Admin Email:', ADMIN_EMAIL);
console.log('- Customer ID:', CUSTOMER_ID);
console.log('- Private Key exists:', !!PRIVATE_KEY);
console.log('- Private Key length:', PRIVATE_KEY?.length);
console.log('- Private Key starts with:', PRIVATE_KEY?.substring(0, 50));
console.log('- Private Key ends with:', PRIVATE_KEY?.substring(PRIVATE_KEY.length - 50));

// Create JWT client
function getAuthClient() {
  try {
    console.log('[Google Workspace] Creating JWT auth client...');
    
    // Create credentials object
    const credentials = {
      type: 'service_account',
      project_id: 'electric-rhino-461319-s4',
      private_key_id: 'e348760acfd3b55d0821d6cd6ca5f1b80611b4d2',
      private_key: PRIVATE_KEY,
      client_email: SERVICE_ACCOUNT_EMAIL,
      client_id: '112372506130678807887',
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
      universe_domain: 'googleapis.com'
    };
    
    const auth = new google.auth.JWT({
      email: SERVICE_ACCOUNT_EMAIL,
      key: PRIVATE_KEY,
      scopes: ['https://www.googleapis.com/auth/admin.directory.user'],
      subject: ADMIN_EMAIL
    });
    
    console.log('[Google Workspace] ✅ JWT client created');
    return auth;
  } catch (error) {
    console.error('[Google Workspace] ❌ Error creating JWT client:', error);
    throw error;
  }
}

// Get Admin SDK client
async function getAdminClient() {
  try {
    const auth = getAuthClient();
    console.log('[Google Workspace] Getting admin client...');
    
    // Authorize the client
    await auth.authorize();
    console.log('[Google Workspace] ✅ Authorization successful');
    
    return google.admin({ version: 'directory_v1', auth });
  } catch (error) {
    console.error('[Google Workspace] ❌ Error getting admin client:', error);
    throw error;
  }
}

// Get user by email
async function getUserByEmail(email) {
  try {
    console.log(`[Google Workspace] Fetching user: ${email}`);
    const admin = await getAdminClient();
    
    const response = await admin.users.get({
      userKey: email
    });

    return response.data;
  } catch (error) {
    if (error.code === 404 || error.response?.status === 404) {
      console.log(`[Google Workspace] User not found: ${email}`);
      return null;
    }
    console.error('[Google Workspace] Error fetching user:', error.message);
    throw error;
  }
}

// Check if email exists
async function emailExists(email) {
  try {
    const user = await getUserByEmail(email);
    return user !== null;
  } catch (error) {
    return false;
  }
}

// Generate unique email using format: firstname-lastnameInitial@tjr-trades.com
async function generateUniqueEmail(firstName, lastName) {
  const domain = 'tjr-trades.com';
  const baseEmail = `${firstName.toLowerCase()}-${lastName.charAt(0).toLowerCase()}@${domain}`;
  
  console.log(`[Google Workspace] Checking availability for: ${baseEmail}`);
  
  // Check if base email is available
  const baseExists = await emailExists(baseEmail);
  if (!baseExists) {
    console.log(`[Google Workspace] ✅ Email available: ${baseEmail}`);
    return baseEmail;
  }
  
  // If taken, try with numbers: firstname-lastnameInitial2@domain, firstname-lastnameInitial3@domain, etc.
  console.log(`[Google Workspace] Base email taken, trying numbered variants...`);
  for (let i = 2; i <= 20; i++) {
    const numberedEmail = `${firstName.toLowerCase()}-${lastName.charAt(0).toLowerCase()}${i}@${domain}`;
    const exists = await emailExists(numberedEmail);
    
    if (!exists) {
      console.log(`[Google Workspace] ✅ Email available: ${numberedEmail}`);
      return numberedEmail;
    }
  }
  
  // If all numbered variants are taken (unlikely), throw error
  throw new Error(`Unable to generate unique email for ${firstName} ${lastName} - all variants taken`);
}

// Create user
async function createUser(firstName, lastName, email, password = null) {
  try {
    console.log(`[Google Workspace] Creating user: ${email}`);
    const admin = await getAdminClient();
    
    const userData = {
      primaryEmail: email,
      name: {
        givenName: firstName,
        familyName: lastName
      },
      password: password || generateRandomPassword(),
      changePasswordAtNextLogin: true
    };
    
    const response = await admin.users.insert({
      requestBody: userData
    });
    
    console.log(`[Google Workspace] ✅ User created: ${email}`);
    return response.data;
  } catch (error) {
    console.error('[Google Workspace] Error creating user:', error.message);
    throw new Error(`Failed to create Google Workspace user: ${error.message}`);
  }
}

// Delete user
async function deleteUser(email) {
  try {
    console.log(`[Google Workspace] Deleting user: ${email}`);
    const admin = await getAdminClient();
    
    await admin.users.delete({
      userKey: email
    });
    
    console.log(`[Google Workspace] ✅ User deleted: ${email}`);
    return { success: true, message: 'User deleted from Google Workspace' };
  } catch (error) {
    if (error.code === 404) {
      console.log(`[Google Workspace] User not found: ${email}`);
      return { success: true, message: 'User not found in Google Workspace' };
    }
    console.error('[Google Workspace] Error deleting user:', error.message);
    throw new Error(`Failed to delete Google Workspace user: ${error.message}`);
  }
}

// Suspend user
async function suspendUser(email) {
  try {
    console.log(`[Google Workspace] Suspending user: ${email}`);
    const admin = await getAdminClient();
    
    await admin.users.update({
      userKey: email,
      requestBody: {
        suspended: true
      }
    });
    
    console.log(`[Google Workspace] ✅ User suspended: ${email}`);
    return { success: true, message: 'User suspended' };
  } catch (error) {
    console.error('[Google Workspace] Error suspending user:', error.message);
    throw error;
  }
}

// List all users
async function listUsers() {
  try {
    console.log('[Google Workspace] Listing all users');
    const admin = await getAdminClient();
    
    const response = await admin.users.list({
      customer: CUSTOMER_ID,
      maxResults: 500,
      orderBy: 'email'
    });
    
    console.log(`[Google Workspace] ✅ Found ${response.data.users?.length || 0} users`);
    return response.data.users || [];
  } catch (error) {
    console.error('[Google Workspace] Error listing users:', error.message);
    throw error;
  }
}

// Generate random password
function generateRandomPassword(length = 16) {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

// For backwards compatibility with old code
class GoogleWorkspaceService {
  async createAccount(firstName, lastName, emailOrNull = null, password = null) {
    // If no email provided, generate unique one
    const email = emailOrNull || await generateUniqueEmail(firstName, lastName);
    return await createUser(firstName, lastName, email, password);
  }

  async deleteAccount(email) {
    return await deleteUser(email);
  }

  async getAccount(email) {
    return await getUserByEmail(email);
  }

  // New method to check email availability
  async checkEmailAvailable(email) {
    return !(await emailExists(email));
  }

  // New method to generate unique email
  async generateEmail(firstName, lastName) {
    return await generateUniqueEmail(firstName, lastName);
  }
}

export default new GoogleWorkspaceService();
export { getUserByEmail, createUser, deleteUser, suspendUser, listUsers, emailExists, generateUniqueEmail };