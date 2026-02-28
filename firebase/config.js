import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA_7zOM4N7uri2bG0TMZAb52cuyhK37oOw",
  authDomain: "heshima-election.firebaseapp.com",
  projectId: "heshima-election",
  storageBucket: "heshima-election.firebasestorage.app",
  messagingSenderId: "1044214919539",
  appId: "1:1044214919539:web:2cef93c8a0cb2b63d39506"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);