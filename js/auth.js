import { auth } from "./firebase_config.js";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";

const status_message = document.querySelector("#status_message");
const login_button = document.querySelector("#login_button");
const register_button = document.querySelector("#register_button");

async function login(email, password) {
    try {
        await signInWithEmailAndPassword(auth, email, password);
        status_message.style.color = "green";
        status_message.textContent = "Welcome back";
        window.location.href = "html/home.html";
    } catch (err) {
        status_message.style.color = "red";
        status_message.textContent = err.code;
    }
}

async function register(email, password) {
    try {
        await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(auth.currentUser);
        status_message.style.color = "green";
        status_message.textContent = `Account created, verification mail sent to ${email}`;
    } catch (err) {
        status_message.style.color = "red";
        status_message.textContent = err.code;
    }
}

login_button.addEventListener("click", () => {
    const email = document.querySelector("#email").value;
    const password = document.querySelector("#password").value;
    login(email, password);
});

register_button.addEventListener("click", () => {
    const email = document.querySelector("#email").value;
    const password = document.querySelector("#password").value;
    register(email, password);
});