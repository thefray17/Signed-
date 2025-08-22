import { cookies } from "next/headers";
import { getRoleFromClaims } from "@/lib/roles";
import { adminApp } from "./firebase-admin-app";

// This is a placeholder for a real session cookie name
const SESSION_COOKIE_NAME = "__session"; 

export async function auth() {
    const sessionCookie = cookies().get(SESSION_COOKIE_NAME)?.value;

    if (!sessionCookie) {
        return null;
    }

    try {
        const decodedClaims = await adminApp.auth().verifySessionCookie(sessionCookie, true);
        return {
            user: {
                ...decodedClaims,
                claims: decodedClaims, // Add claims here to match user's example
            }
        };
    } catch (error) {
        // Session cookie is invalid or expired.
        console.error("Failed to verify session cookie:", error);
        return null;
    }
}
