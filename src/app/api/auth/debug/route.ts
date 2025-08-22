import { NextResponse } from "next/server";
import { adminApp } from "@/lib/firebase-admin-app";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    adminProjectId: adminApp.options.projectId || null,
    emulator: !!process.env.FIREBASE_AUTH_EMULATOR_HOST,
    FIREBASE_AUTH_EMULATOR_HOST: process.env.FIREBASE_AUTH_EMULATOR_HOST || null,
  });
}
