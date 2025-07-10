import { AuthResponse } from "~/types/AuthTypes";

export class AuthService {
    public static async authenticateClient(): Promise<AuthResponse | undefined> {
        try {
            console.log("[AUTH-SERVICE] API_SERVER_URL:", process.env.API_SERVER_URL);
            console.log("[AUTH-SERVICE] API_SERVER_EMAIL:", process.env.API_SERVER_EMAIL);
            console.log("[AUTH-SERVICE] API_SERVER_KEY:", process.env.API_SERVER_KEY);
            
            //STEP 1 -- Call the authenticate method of AuthClient            
            const response = await fetch(`${process.env.API_SERVER_URL}/v1/tenants/auth`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: process.env.API_SERVER_EMAIL,
                    apiKey: process.env.API_SERVER_KEY,
                }),
            });
            if (!response.ok) {
                console.warn("[AUTH-SERVICE] Failed to authenticate client. Response not OK.");
                return;
            }
            return await response.json() as AuthResponse;
        } 
        catch (error) {
            throw new Error(`[AUTH-SERVICE] Authentication failed due to internal error: ${error}`);
        }
    }
}