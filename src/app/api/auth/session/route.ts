
import { NextResponse, type NextRequest } from "next/server";
import { adminApp } from "@/lib/firebase-admin-app";

// The session cookie will be stored for 5 days.
const expiresIn = 60 * 60 * 24 * 5 * 1000;

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();
    if (!idToken) {
      return new NextResponse("ID token is required", { status: 400 });
    }

    const decodedIdToken = await adminApp.auth().verifyIdToken(idToken);
    
    // Only process if the user just signed in in the last 5 minutes.
    if (new Date().getTime() / 1000 - decodedIdToken.auth_time > 5 * 60) {
      return new NextResponse("Recent sign-in required.", { status: 401 });
    }

    const sessionCookie = await adminApp.auth().createSessionCookie(idToken, { expiresIn });
    const options = { name: "session", value: sessionCookie, maxAge: expiresIn, httpOnly: true, secure: true };
    const response = new NextResponse("Session created", { status: 200 });
    response.cookies.set(options);
    
    return response;

  } catch (error) {
    console.error("Error creating session cookie:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE() {
  const options = { name: "session", value: "", maxAge: -1 };
  const response = new NextResponse("Session cleared", { status: 200 });
  response.cookies.set(options);

  return response;
}
