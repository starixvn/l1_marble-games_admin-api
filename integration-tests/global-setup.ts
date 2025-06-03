import { apiService } from './_stub/api/setup';
import { migrateData } from './_stub/database/setup';
import { setAdminCredentials } from './utils/auth';

export default async function globalSetup(): Promise<void> {
  console.log('🔧 Global setup: initializing test environment');
  
  try {
    await migrateData();
    
    console.log(`✅ Setup complete with ${global.__CREDENTIALS__?.length ?? 0} test credentials available`);
    
    await apiService.start();
    
    console.log('✅ API service started');
    
    global.__API_SERVICE__ = apiService;
    
    await setupAdminAuth();
    
    console.log('✅ Global setup complete');
    
  } catch (error) {
    console.error('❌ Error in global setup:', error);
    throw error;
  }
}

async function setupAdminAuth(): Promise<void> {
  const baseUrl = apiService.getBaseUrl();
  
  try {
    console.log('🔐 Setting up admin authentication...');
    const registerResponse = await fetch(`${baseUrl}/api/auth/oneTimeRegister`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (registerResponse.status !== 200) {
      throw new Error(`Failed to register admin account: ${registerResponse.status}`);
    }

    const adminAccount = await registerResponse.json();
    console.log(`✅ Admin account registered with username: ${adminAccount.username}`);

    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: adminAccount.username,
        password: adminAccount.password
      }),
    });

    if (loginResponse.status !== 200) {
      throw new Error(`Failed to login: ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json();
    console.log('✅ Admin login successful, access token obtained');

    setAdminCredentials({
      username: adminAccount.username,
      password: adminAccount.password,
      access_token: loginData.access_token
    });

    console.log('✅ Admin credentials set globally');
    
  } catch (error) {
    console.error('❌ Failed to setup admin authentication:', error);
    throw error;
  }
} 
