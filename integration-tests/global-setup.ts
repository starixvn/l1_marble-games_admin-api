import { apiService } from "./_stub/api/setup";
import { migrateData } from "./_stub/database/setup";
import { setAdminCredentials } from "./utils/auth";

export default async function globalSetup(): Promise<void> {
  console.log("🔧 Global setup: initializing test environment");

  try {
    await migrateData();

    console.log(
      `✅ Setup complete with ${global.__CREDENTIALS__?.length ?? 0} test credentials available`,
    );

    await apiService.start();

    console.log("✅ API service started");

    global.__API_SERVICE__ = apiService;

    await setupAdminAuth();

    console.log("✅ Global setup complete");
  } catch (error) {
    console.error("❌ Error in global setup:", error);
    throw error;
  }
}

async function setupAdminAuth(): Promise<void> {
  const baseUrl = apiService.getBaseUrl();

  try {
    console.log("Initializing admin credentials...");

    const registerResponse = await fetch(`${baseUrl}/auth/oneTimeRegister`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (registerResponse.status === 200) {
      const adminAccount = await registerResponse.json();
      console.log("Admin account created with one-time register");

      const loginResponse = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: adminAccount.username,
          password: adminAccount.password,
        }),
      });

      if (loginResponse.status === 200) {
        const loginData = await loginResponse.json();
        const credentials = {
          username: adminAccount.username,
          password: adminAccount.password,
          access_token: loginData.access_token,
        };
        globalThis.__ADMIN_CREDENTIALS__ = credentials;
        setAdminCredentials(credentials);
        console.log("Admin credentials set successfully");
      } else {
        throw new Error("Failed to login with newly created admin account");
      }
    } else if (registerResponse.status === 400) {
      // Admin already exists, try to generate new password via changePassword endpoint
      console.log(
        "Admin account already exists, attempting to generate new password...",
      );

      // First try to login with 'admin' username and get a new password
      // This is a workaround since we know the admin exists but don't know the password
      throw new Error(
        "Admin account already exists. Please clear the database and restart tests.",
      );
    } else {
      throw new Error(
        `Failed to register admin account: ${registerResponse.status}`,
      );
    }
  } catch (error) {
    console.error("Failed to initialize admin credentials:", error);
    throw error;
  }
}
