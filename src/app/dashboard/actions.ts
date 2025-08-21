
"use server";

import { revalidatePath } from "next/cache";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { z } from "zod";
import { db } from "@/lib/firebase-app";

const addDocumentSchema = z.object({
    title: z.string().min(5, "Title must be at least 5 characters long."),
    userId: z.string(),
    userOfficeId: z.string(),
    userOfficeName: z.string(),
    destinationOfficeId: z.string(),
    destinationOfficeName: z.string(),
    recipientRole: z.string(),
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
    destinationOfficeId, 
    destinationOfficeName,
    recipientRole,
  } = validatedFields.data;

  try {
     const docRef = await addDoc(collection(db, "documents"), {
        title: title,
        ownerId: userId,
        createdAt: serverTimestamp(),
        currentStatus: 'in_transit', // Document is now in transit
        currentOfficeId: destinationOfficeId,
        history: [
            {
                timestamp: serverTimestamp(),
                status: 'draft',
                officeId: userOfficeId,
                officeName: userOfficeName,
                notes: 'Document created.',
            },
            {
                timestamp: serverTimestamp(),
                status: 'in_transit',
                officeId: destinationOfficeId,
                officeName: destinationOfficeName,
                recipientRole: recipientRole,
                notes: `Forwarded for signature.`,
            }
        ]
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
