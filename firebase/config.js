// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA_7zOM4N7uri2bG0TMZAb52cuyhK37oOw",
  authDomain: "heshima-election.firebaseapp.com",
  projectId: "heshima-election",
  storageBucket: "heshima-election.firebasestorage.app",
  messagingSenderId: "1044214919539",
  appId: "1:1044214919539:web:2cef93c8a0cb2b63d39506",
  measurementId: "G-QW2SC6F1XN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);