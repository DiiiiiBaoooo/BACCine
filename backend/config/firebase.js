// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDugowkMCgR3hFw1X2AaKh9uAqlasphn_o",
  authDomain: "baccine-5319e.firebaseapp.com",
  projectId: "baccine-5319e",
  databaseURL: "https://baccine-5319e-default-rtdb.asia-southeast1.firebasedatabase.app",

  storageBucket: "baccine-5319e.firebasestorage.app",
  messagingSenderId: "1022670866759",
  appId: "1:1022670866759:web:e279d1f62b9b2d23eaa462",
  measurementId: "G-TH9X15Y383"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const database  = getDatabase(app);
export default app;
