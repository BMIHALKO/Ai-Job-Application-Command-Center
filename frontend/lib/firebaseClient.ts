import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCepKluapuzFjV-hf3oGsNf1vAyDUvAO54",
  authDomain: "ai-job-application-center.firebaseapp.com",
  projectId: "ai-job-application-center",
  storageBucket: "ai-job-application-center.firebasestorage.app",
  messagingSenderId: "735777964750",
  appId: "1:735777964750:web:3d19cac356e8418d6c469f",
  measurementId: "G-8EV2PTP3QY"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);