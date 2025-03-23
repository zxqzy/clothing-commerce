import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDr9rIEBoMc569Nod8_3vD2X1H_MllfBTI",
    authDomain: "clothing-commerce-25bb0.firebaseapp.com",
    projectId: "clothing-commerce-25bb0",
    storageBucket: "clothing-commerce-25bb0.firebasestorage.app",
    messagingSenderId: "335542080650",
    appId: "1:335542080650:web:ff0d3e8d9cd6014bc6c973",
    measurementId: "G-YN33PTHXVB"
}

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
