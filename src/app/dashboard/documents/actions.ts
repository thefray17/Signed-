
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { adminApp } from "@/lib/firebase-admin-app";
import type { Document as DocumentType, DocumentLog } from "@/types";

const updateStatusSchema = z.object({
  docId: z.string(),
  newStatus: z.enum(['signed', 'rejected']),
  userId: z.string(),
  userDisplayName: z.string(),
  userOfficeId: z.string(),
});

export async function updateDocumentStatusAction(values: z.infer<typeof updateStatusSchema>) {
  const validatedFields = updateStatusSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields provided." };
  }

  const { docId, newStatus, userId, userDisplayName, userOfficeId } = validatedFields.data;
  
  const db = adminApp.firestore();
  const Timestamp = adminApp.firestore.Timestamp;


  try {
    await db.runTransaction(async (tx) => {
      const ref = db.doc(`documents/${docId}`);
      const snap = await tx.get(ref);
      if (!snap.exists) throw new Error("Document not found.");


      const document = snap.data() as DocumentType;
      const history = Array.isArray(document.history) ? (document.history as DocumentLog[]) : [];


      const currentStepIndex = history.findIndex(
      (h) => h.status === "in_transit" && h.officeId === userOfficeId
      );
      if (currentStepIndex === -1) throw new Error("No in-transit step for your office.");


      const now = Timestamp.now();


      // Update current step
      history[currentStepIndex] = {
      ...history[currentStepIndex],
      status: newStatus,
      timestamp: now,
      notes: newStatus === "signed" ? `Signed by ${userDisplayName}.` : `Rejected by ${userDisplayName}.`,
      signedBy: { uid: userId, name: userDisplayName },
      };


      let finalStatus = document.currentStatus;
      let finalOfficeId = document.currentOfficeId;


      if (newStatus === "rejected") {
        finalStatus = "rejected";
      } else if (newStatus === "signed") {
        const nextStepIndex = currentStepIndex + 1;
        const nextStep = history[nextStepIndex];
        if (nextStep) {
          finalStatus = "in_transit";
          finalOfficeId = nextStep.officeId;
          history[nextStepIndex] = {
            ...nextStep,
            status: "in_transit",
            timestamp: now,
            notes: "Forwarded for signature.",
          } as DocumentLog;
        } else {
          finalStatus = "completed";
          finalOfficeId = userOfficeId; // stays at last office
        }
      }


      tx.update(ref, {
        currentStatus: finalStatus,
        currentOfficeId: finalOfficeId,
        history,
      });
    });


    revalidatePath("/dashboard/documents");
    revalidatePath("/dashboard");
    return { data: { success: true }, error: null } as const;
  } catch (error: any) {
    console.error("Error updating document status:", error);
    return { error: error.message || "Could not update the document status. Please try again." } as const;
  }
}
