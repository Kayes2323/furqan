import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD1PCvioSmIYswJStU273uTxXQ8IIQ-FAc",
  authDomain: "furqan-82cb3.firebaseapp.com",
  projectId: "furqan-82cb3",
  storageBucket: "furqan-82cb3.firebasestorage.app",
  messagingSenderId: "1025091878159",
  appId: "1:1025091878159:web:01c7a98c527e1043c4127a",
  measurementId: "G-WQWNPGWGPG"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);