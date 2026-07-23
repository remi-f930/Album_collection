import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyBJJFmP7TLsmU8Afdb_BFXesvYf-kXebQM",
    authDomain: "cd-collection-91dda.firebaseapp.com",
    projectId: "cd-collection-91dda",
    storageBucket: "cd-collection-91dda.firebasestorage.app",
    messagingSenderId: "268107189524",
    appId: "1:268107189524:web:b86ae355d1d6b71811c601",
    measurementId: "G-M7JKSBKBN2"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const analytics = getAnalytics(app);