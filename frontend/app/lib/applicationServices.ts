import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../lib/firebaseClient";
import type { ApplicationRow } from "@/app/applications/data";

export type ApplicationPatch = Partial<Omit<ApplicationRow, "id">>;

export async function updateApplication(id: string, patch: ApplicationPatch) {
    const ref = doc(db, "applications", id);

    const clean: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(patch)) {
        if (v !== undefined) clean[k] = v; 
    }

    clean.updateAt = serverTimestamp();
    await updateDoc(ref, clean);
}