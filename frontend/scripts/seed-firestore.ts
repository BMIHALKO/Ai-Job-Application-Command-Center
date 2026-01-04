import fs from "node:fs";
import path from "node:path";

import { initializeApp, cert, getApps, getApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

import { MOCK_APPLICATIONS } from "../app/applications/data";

function loadServiceAccount() {
    const keyPath = path.resolve(process.cwd(), "serviceAccountKey.json");
    const raw = fs.readFileSync(keyPath, "utf-8");
    return JSON.parse(raw);
}

function ensureAdminApp() {
    const APP_NAME = "seed-script";

    const existing = getApps().find((a) => a.name === APP_NAME);
    if (existing) return getApp(APP_NAME);

    const serviceAccount = loadServiceAccount();
    return initializeApp(
        {
            credential: cert(serviceAccount),
        },
        APP_NAME
    );
}


async function main() {
    const app = ensureAdminApp();
    const db = getFirestore(app);


    const col = db.collection("application");

    if (!Array.isArray(MOCK_APPLICATIONS) || MOCK_APPLICATIONS.length === 0) {
        throw new Error("MOCK_APPLICATIONS is empty or not an array");
    }

    console.log(`Seeding ${MOCK_APPLICATIONS.length} applications . . .`);

    const BATCH_LIMIT = 450;
    let batch = db.batch();
    let batchCount = 0;
    let total = 0;

    for (const app of MOCK_APPLICATIONS) {
        if (!app?.id) {
            console.warn("Skipping row (missing id):", app);
            continue;
        }

        const docRef = col.doc(app.id);

        const { id,  ...data } = app as any;

        batch.set(docRef, data, { merge: true });
        batchCount++;
        total++;

        if (batchCount >= BATCH_LIMIT) {
            await batch.commit();
            console.log(`✅ Commited ${total} so far . . .`);
            batch = db.batch();
            batchCount = 0;
        }
    }

    if (batchCount > 0) {
        await batch.commit();
    }

    console.log(`🎉 Done. Seeded/updated ${total} documents in 'applications'.`)
}

main().catch((err) => {
    console.error("❌ Seed Failed:", err);
    process.exit(1);
});