import { auth, db } from "../firebase/config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  doc, setDoc, getDoc, runTransaction
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/* -------------------------
MODAL CONTROLS
--------------------------*/
const registerBtn = document.querySelector(".left-btn");
const loginBtn = document.querySelector(".right-btn");
const registerModal = document.getElementById("registerModal");
const loginModal = document.getElementById("loginModal");
const closeRegister = document.getElementById("closeRegister");
const closeLogin = document.getElementById("closeLogin");

registerBtn.onclick = () => registerModal.style.display = "flex";
loginBtn.onclick = () => loginModal.style.display = "flex";
closeRegister.onclick = () => registerModal.style.display = "none";
closeLogin.onclick = () => loginModal.style.display = "none";

/* -------------------------
VOTER REGISTRATION
--------------------------*/
const registerSubmitBtn = document.getElementById("registerSubmit");

document.getElementById("registerSubmit").addEventListener("click", async () => {
  const fullname = document.getElementById("fullname").value.trim();
  const password = document.getElementById("regPassword").value;
  const errorEl = document.getElementById("registerError");

  errorEl.style.color = "red";
  errorEl.textContent = "";

  if (!fullname || !password) {
    errorEl.textContent = "Please fill in all fields.";
    return;
  }

  if (password.length < 6) {
    errorEl.textContent = "Password must be at least 6 characters.";
    return;
  }

  // Loading state
  registerSubmitBtn.disabled = true;
  registerSubmitBtn.textContent = "Registering...";

  try {
    const counterRef = doc(db, "meta", "voterCounter");
    let newCount;

    await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      newCount = counterDoc.data().count + 1;
      transaction.update(counterRef, { count: newCount });
    });

    const voterID = String(newCount).padStart(4, "0");
    const fakeEmail = `${voterID}@heshima.voter`;

    const userCredential = await createUserWithEmailAndPassword(auth, fakeEmail, password);

    await setDoc(doc(db, "users", userCredential.user.uid), {
      fullname,
      voterID,
      role: "voter",
      hasVoted: false,
      createdAt: new Date()
    });

    errorEl.style.color = "green";
    errorEl.textContent = `✔ Registration successful! Your Voter ID is: ${voterID} — write this down!`;
    registerSubmitBtn.textContent = "Done ✔";

  } catch (err) {
    console.error(err);
    errorEl.style.color = "red";

    if (err.code === "auth/weak-password") {
      errorEl.textContent = "Password too weak. Use at least 6 characters.";
    } else {
      errorEl.textContent = "Registration failed. Please try again.";
    }

    registerSubmitBtn.disabled = false;
    registerSubmitBtn.textContent = "Register";
  }
});

/* -------------------------
SMART LOGIN
--------------------------*/
const loginSubmitBtn = document.getElementById("loginSubmit");

document.getElementById("loginSubmit").addEventListener("click", async () => {
  const input = document.getElementById("loginAdmNo").value.trim();
  const password = document.getElementById("loginPassword").value;
  const errorEl = document.getElementById("loginError");

  errorEl.style.color = "red";
  errorEl.textContent = "";

  if (!input || !password) {
    errorEl.textContent = "Please fill in all fields.";
    return;
  }

  // Loading state
  loginSubmitBtn.disabled = true;
  loginSubmitBtn.textContent = "Logging in...";

  try {
    let email;
    const isAdminAttempt = input.includes("@");

    if (isAdminAttempt) {
      email = input;
    } else {
      const padded = input.padStart(4, "0");
      email = `${padded}@heshima.voter`;
    }

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
    const userData = userDoc.data();

    if (userData.role === "admin") {
      window.location.href = "results.html";
    } else if (userData.role === "voter") {
      if (userData.hasVoted) {
        errorEl.style.color = "orange";
        errorEl.textContent = "You have already voted. Thank you!";
        loginSubmitBtn.disabled = false;
        loginSubmitBtn.textContent = "Login";
      } else {
        window.location.href = "vote.html";
      }
    }

  } catch (err) {
    console.error(err);
    errorEl.style.color = "red";

    if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found") {
      errorEl.textContent = "Invalid Voter ID or password.";
    } else {
      errorEl.textContent = "Login failed. Please try again.";
    }

    loginSubmitBtn.disabled = false;
    loginSubmitBtn.textContent = "Login";
  }
});

/* -------------------------
PASSWORD TOGGLE
--------------------------*/
document.querySelectorAll(".toggle-password").forEach(toggle => {
  toggle.addEventListener("click", () => {
    const input = document.getElementById(toggle.dataset.target);
    const isHidden = input.type === "password";
    input.type = isHidden ? "text" : "password";
    toggle.textContent = isHidden ? "🙈" : "👁️";
  });
});