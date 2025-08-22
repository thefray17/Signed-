
import { cookies } from "next/headers";
import { adminApp } from "./firebase-admin-app";
import type { AppUser } from "@/types";

const SESSION_COOKIE_NAME = "__session"; 
const ROOT_ADMIN_EMAIL = "eballeskaye@gmail.com";

export async function getCurrentUserWithRole(): Promise<AppUser | null> {
    const sessionCookie = cookies().get(SESSION_COOKIE_NAME)?.value;
    if (!sessionCookie) return null;

    try {
        const decodedClaims = await adminApp.auth().verifySessionCookie(sessionCookie, true);
        const db = adminApp.firestore();

        const isRoot = decodedClaims.isRoot || decodedClaims.email?.toLowerCase() === ROOT_ADMIN_EMAIL;
        let role = isRoot ? 'root' : decodedClaims.role || 'user';

        const userDoc = await db.collection('users').doc(decodedClaims.uid).get();
        
        if (!userDoc.exists) {
            // This might happen with a delay between auth creation and firestore doc creation.
            // We can return a temporary user object based on claims alone.
            return {
                uid: decodedClaims.uid,
                email: decodedClaims.email || null,
                displayName: decodedClaims.name || null,
                role: role,
                status: 'pending',
                office: null,
            } as AppUser;
        }

        const firestoreData = userDoc.data() as AppUser;

        // Final role determination: claim is authoritative, but firestore is a good fallback.
        // isRoot check is the ultimate override.
        const finalRole = isRoot ? 'root' : (decodedClaims.role || firestoreData.role || 'user');

        return {
            uid: decodedClaims.uid,
            email: decodedClaims.email!,
            displayName: firestoreData.displayName || decodedClaims.name,
            role: finalRole,
            isRoot: isRoot,
            status: firestoreData.status,
            office: firestoreData.office,
            officeName: firestoreData.officeName,
            onboardingSteps: firestoreData.onboardingSteps,
        };

    } catch (error) {
        console.error("Failed to verify session cookie or fetch user role:", error);
        return null;
    }
}
