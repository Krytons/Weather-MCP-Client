import { AuthResponse } from "~/types/AuthTypes";
import { appSessionStorage } from "../session/AppSessionStorage";

export class AuthService {
    public static async authenticateClient(): Promise<boolean> {
        try {
            //STEP 1 -- Call the authenticate method of AuthClient
            const response = await fetch(`${process.env.AUTH_API_URL}/v1/users/auth`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: process.env.API_SERVER_EMAIL,
                    apiKey: process.env.API_SERVER_KEY,
                }),
            });
            if (!response.ok) {
                console.warn("[AUTH-SERVICE] Failed to authenticate client. Response not OK.");
                return false;
            }

            const authResponseData = await response.json() as AuthResponse;

            //STEP 2 -- Save jwt inside session
            const session = await appSessionStorage.getSession();
            session.set("jwt", authResponseData.token);
            session.set("expiresAt", authResponseData.expiresAt);
            return true;
        } 
        catch (error) {
            throw new Error("Authentication failed");
        }
    }
}