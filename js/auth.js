import { auth, db } from "../firebase/config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  doc, setDoc, getDoc, runTransaction
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Modal controls (keep your existing ones)
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
document.getElementById("registerSubmit").addEventListener("click", async () => {
  const fullname = document.getElementById("fullname").value.trim();
  const password = document.getElementById("regPassword").value;
  const errorEl = document.getElementById("registerError");

  if (!fullname || !password) {
    errorEl.textContent = "Please fill in all fields.";
    return;
  }

  if (password.length < 6) {
    errorEl.textContent = "Password must be at least 6 characters.";
    return;
  }

  try {
    // Get and increment counter atomically
    const counterRef = doc(db, "meta", "voterCounter");
    let newCount;

    await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      newCount = counterDoc.data().count + 1;
      transaction.update(counterRef, { count: newCount });
    });

    // Pad number to 4 digits e.g 0001
    const voterID = String(newCount).padStart(4, "0");

    // Create fake email for Firebase Auth
    const fakeEmail = `${voterID}@heshima.voter`;

    const userCredential = await createUserWithEmailAndPassword(auth, fakeEmail, password);

    // Save to Firestore
    await setDoc(doc(db, "users", userCredential.user.uid), {
      fullname,
      voterID,
      role: "voter",
      hasVoted: false,
      createdAt: new Date()
    });

    errorEl.style.color = "green";
    errorEl.textContent = `Registration successful! Your Voter ID is: ${voterID} — write this down!`;

  } catch (err) {
    errorEl.style.color = "red";
    errorEl.textContent = "Registration failed: " + err.message;
  }
});

/* -------------------------
SMART LOGIN
--------------------------*/
document.getElementById("loginSubmit").addEventListener("click", async () => {
  const input = document.getElementById("loginAdmNo").value.trim();
  const password = document.getElementById("loginPassword").value;
  const errorEl = document.getElementById("loginError");

  if (!input || !password) {
    errorEl.textContent = "Please fill in all fields.";
    return;
  }

  try {
    let email;
    let isAdminAttempt = input.includes("@");

    if (isAdminAttempt) {
      email = input; // admin uses real email
    } else {
      // Voter — pad their number and build fake email
      const padded = input.padStart(4, "0");
      email = `${padded}@heshima.voter`;
    }

    const userCredential = await signInWithEmailAndPassword(auth, email, password);

    // Check role in Firestore
    const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
    const userData = userDoc.data();

    if (userData.role === "admin") {
      window.location.href = "results.html";
    } else if (userData.role === "voter") {
      if (userData.hasVoted) {
        errorEl.style.color = "orange";
        errorEl.textContent = "You have already voted. Thank you!";
      } else {
        window.location.href = "vote.html";
      }
    }

  } catch (err) {
    errorEl.style.color = "red";
    errorEl.textContent = "Login failed. Check your ID and password.";
  }
});