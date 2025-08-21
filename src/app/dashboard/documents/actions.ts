"use server";

import { revalidatePath } from "next/cache";
import { doc, updateDoc, getDoc, Timestamp } from "firebase/firestore";
import { z } from "zod";
import { db } from "@/lib/firebase-app";
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
  const docRef = doc(db, "documents", docId);

  try {
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return { error: "Document not found." };
    }

    const document = docSnap.data() as DocumentType;
    const history: DocumentLog[] = document.history || [];
    const now = Timestamp.now();

    // Find the index of the current step in the workflow history
    const currentStepIndex = history.findIndex(
      (log) => log.officeId === userOfficeId && (log.status === 'in_transit' || log.status === 'pending_transit')
    );

    if (currentStepIndex === -1) {
      return { error: "Current workflow step could not be determined." };
    }

    // Update the log for the current step
    history[currentStepIndex].status = newStatus;
    history[currentStepIndex].timestamp = now;
    history[currentStepIndex].notes = newStatus === 'signed' ? `Signed by ${userDisplayName}.` : `Rejected by ${userDisplayName}.`;
    history[currentStepIndex].signedBy = { uid: userId, name: userDisplayName };


    let finalStatus = document.currentStatus;
    let finalOfficeId = document.currentOfficeId;

    if (newStatus === 'rejected') {
      finalStatus = 'rejected';
      // The document stops here unless a resubmission process is implemented.
    } else if (newStatus === 'signed') {
      const nextStepIndex = currentStepIndex + 1;
      const nextStep = history[nextStepIndex];

      if (nextStep) {
        // There is a next step, so move it to 'in_transit'
        finalStatus = 'in_transit';
        finalOfficeId = nextStep.officeId;
        history[nextStepIndex].status = 'in_transit';
        history[nextStepIndex].timestamp = now;
        history[nextStepIndex].notes = `Forwarded for signature.`;
      } else {
        // This was the last step
        finalStatus = 'completed';
        finalOfficeId = userOfficeId; // Stays at the last office
      }
    }

    await updateDoc(docRef, {
      currentStatus: finalStatus,
      currentOfficeId: finalOfficeId,
      history: history,
    });
    
    // Revalidate paths to reflect the changes immediately
    revalidatePath("/dashboard/documents");
    revalidatePath("/dashboard");

    return { data: { success: true }, error: null };
  } catch (error) {
    console.error("Error updating document status:", error);
    return { error: "Could not update the document status. Please try again." };
  }
}
