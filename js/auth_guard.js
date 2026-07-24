import { auth } from "./firebase_config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";

const home = document.querySelector("#home");
const collection = document.querySelector("#collection");
const log_out = document.querySelector("#log_out");

export function guardPage() {
    onAuthStateChanged(auth, (user) => {
        if (!user) {
            window.location.href = "https://remi-f930.github.io/Album_collection/";
        } else {
            if (home) {
                home.style.display = "block";
            }
            else {
                collection.style.display = "block";
            }
        }
    });
}

if (log_out) {
    log_out.addEventListener("click", () => {
        if (confirm("Do you really want to sign-out ?")) {
            signOut(auth);
        }
        return;
    });
}

guardPage();