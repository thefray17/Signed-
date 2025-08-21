
"use server";

import { revalidatePath } from "next/cache";
import { addDoc, collection, serverTimestamp, Timestamp } from "firebase/firestore";
import { z } from "zod";
import { db } from "@/lib/firebase-app";
import type { DocumentLog } from "@/types";

const addDocumentSchema = z.object({
    title: z.string().min(5, "Title must be at least 5 characters long."),
    userId: z.string(),
    userOfficeId: z.string(),
    userOfficeName: z.string(),
    workflow: z.array(z.object({
        destinationOfficeId: z.string().min(1, "Please select an office."),
        destinationOfficeName: z.string(),
        recipientRole: z.string().min(2, "Role must be at least 2 characters."),
    })).min(1, "At least one routing step is required."),
});

export async function createDocumentAction(values: z.infer<typeof addDocumentSchema>) {
  const validatedFields = addDocumentSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      error: "Invalid fields!",
    };
  }

  const { 
    title, 
    userId, 
    userOfficeId, 
    userOfficeName, 
    workflow,
  } = validatedFields.data;

  try {
    const now = Timestamp.now();
    
    // Build the history array
    const history: DocumentLog[] = [
        {
            timestamp: now,
            status: 'draft',
            officeId: userOfficeId,
            officeName: userOfficeName,
            notes: 'Document created.',
        },
    ];

    workflow.forEach((step, index) => {
        history.push({
            timestamp: now,
            status: index === 0 ? 'in_transit' : 'pending_transit',
            officeId: step.destinationOfficeId,
            officeName: step.destinationOfficeName,
            recipientRole: step.recipientRole,
            notes: index === 0 ? `Forwarded for signature.` : `Queued for signature.`,
        })
    });
    
    const firstStep = workflow[0];

    const docRef = await addDoc(collection(db, "documents"), {
        title: title,
        ownerId: userId,
        createdAt: serverTimestamp(),
        currentStatus: 'in_transit', // Document is now in transit to the first step
        currentOfficeId: firstStep.destinationOfficeId,
        history: history, // Save the full workflow history
    });

    revalidatePath("/dashboard");
    return {
      data: { id: docRef.id },
      error: null
    };

  } catch (error) {
    console.error("Error creating document:", error);
    return {
      data: null,
      error: "Could not create the document. Please try again.",
    };
  }
}
