// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage"; // THÊM MỚI

// Your web app's Firebase configuration
// const firebaseConfig = {
//   apiKey: "AIzaSyDugowkMCgR3hFw1X2AaKh9uAqlasphn_o",
//   authDomain: "baccine-5319e.firebaseapp.com",
//   projectId: "baccine-5319e",
//   databaseURL: "https://baccine-5319e-default-rtdb.asia-southeast1.firebasedatabase.app",
//   storageBucket: "baccine-5319e.firebasestorage.app",
//   messagingSenderId: "1022670866759",
//   appId: "1:1022670866759:web:e279d1f62b9b2d23eaa462",
//   measurementId: "G-TH9X15Y383"
// };
const firebaseConfig = {
  apiKey: "AIzaSyDMvFFBnSLMsgrXFXVSQQJGv95tMBrS7BQ",
  authDomain: "todo-app-30eb4.firebaseapp.com",
  projectId: "todo-app-30eb4",
  databaseURL: "https://baccine-5319e-default-rtdb.asia-southeast1.firebasedatabase.app",

  storageBucket: "todo-app-30eb4.firebasestorage.app",
  
  messagingSenderId: "262599136953",
  appId: "1:262599136953:web:8f92c30056cb6d40a8ad68"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const database = getDatabase(app);
export const storage = getStorage(app); // THÊM MỚI

export default app;