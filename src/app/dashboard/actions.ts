
"use server";

import { revalidatePath } from "next/cache";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { z } from "zod";
import { db } from "@/lib/firebase-app";
import { auth } from "@/lib/firebase-client";

const addDocumentSchema = z.object({
    title: z.string().min(5, "Title must be at least 5 characters long."),
    userId: z.string(),
    userOffice: z.string(),
});

export async function createDocumentAction(values: { title: string, userId: string, userOffice: string }) {
  const validatedFields = addDocumentSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      error: "Invalid fields!",
    };
  }

  const { title, userId, userOffice } = validatedFields.data;

  try {
     const docRef = await addDoc(collection(db, "documents"), {
        title: title,
        ownerId: userId,
        createdAt: serverTimestamp(),
        currentStatus: 'draft',
        currentOfficeId: userOffice,
        history: [
            {
                timestamp: serverTimestamp(),
                status: 'draft',
                officeId: userOffice,
                notes: 'Document created.',
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
