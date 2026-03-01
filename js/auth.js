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
VOTER ID POPUP
--------------------------*/
function showVoterIDPopup(voterID) {
  const popup = document.createElement("div");
  popup.className = "voter-id-popup";
  popup.innerHTML = `
    <div class="voter-id-box">
      <div class="tick">✅</div>
      <h2>Registration Successful!</h2>
      <p>Your Voter ID is:</p>
      <div class="voter-id-number">${voterID}</div>
      <div class="voter-id-warning">
        ⚠️ Write this number down carefully. You will need it to log in and vote. It cannot be recovered if lost.
      </div>
      <button class="voter-id-confirm-btn" id="popupConfirmBtn">
        I have written it down ✔
      </button>
    </div>
  `;

  document.body.appendChild(popup);

  document.getElementById("popupConfirmBtn").addEventListener("click", () => {
    popup.remove();
    document.getElementById("registerModal").style.display = "none";
    document.getElementById("fullname").value = "";
    document.getElementById("regPassword").value = "";
    document.getElementById("registerError").textContent = "";
    registerSubmitBtn.disabled = false;
    registerSubmitBtn.textContent = "Register";
  });
}

/* -------------------------
VOTER REGISTRATION
--------------------------*/
const registerSubmitBtn = document.getElementById("registerSubmit");

document.getElementById("registerSubmit").addEventListener("click", async () => {
  const fullname = document.getElementById("fullname").value.trim();
  const errorEl = document.getElementById("registerError");

  errorEl.style.color = "red";
  errorEl.textContent = "";

  if (!fullname) {
    errorEl.textContent = "Please enter your full name.";
    return;
  }

  registerSubmitBtn.disabled = true;
  registerSubmitBtn.textContent = "Registering...";

  try {
    const counterRef = doc(db, "meta", "voterCounter");
    let userCredential = null;
    let voterID = null;
    let attempts = 0;
    const MAX_ATTEMPTS = 10;

    while (!userCredential && attempts < MAX_ATTEMPTS) {
      attempts++;

      let newCount;
      await runTransaction(db, async (transaction) => {
        const counterDoc = await transaction.get(counterRef);
        newCount = counterDoc.data().count + 1;
        transaction.update(counterRef, { count: newCount });
      });

      voterID = String(newCount).padStart(4, "0");
      const fakeEmail = `${voterID}@heshima.voter`;
      const internalPassword = `heshima_${voterID}`; // 13 chars, Firebase happy

      try {
        userCredential = await createUserWithEmailAndPassword(auth, fakeEmail, internalPassword);
      } catch (innerErr) {
        if (innerErr.code === "auth/email-already-in-use") {
          console.warn(`Voter ID ${voterID} already taken, trying next...`);
          userCredential = null;
        } else {
          throw innerErr;
        }
      }
    }

    if (!userCredential) {
      throw new Error("Could not assign a voter ID after multiple attempts.");
    }

    await setDoc(doc(db, "users", userCredential.user.uid), {
      fullname,
      voterID,
      role: "voter",
      hasVoted: false,
      createdAt: new Date()
    });

    showVoterIDPopup(voterID);

  } catch (err) {
    console.error("FULL ERROR:", err);
    errorEl.style.color = "red";
    errorEl.textContent = "Registration failed. Please try again.";

    registerSubmitBtn.disabled = false;
    registerSubmitBtn.textContent = "Register";
  }
});

/* -------------------------
ROLE TOGGLE
--------------------------*/
const voterRoleBtn = document.getElementById("voterRoleBtn");
const adminRoleBtn = document.getElementById("adminRoleBtn");
const voterFields = document.getElementById("voterFields");
const adminFields = document.getElementById("adminFields");

let currentRole = "voter";

voterRoleBtn.addEventListener("click", () => {
  currentRole = "voter";
  voterRoleBtn.classList.add("active");
  adminRoleBtn.classList.remove("active");
  voterFields.style.display = "flex";
  adminFields.style.display = "none";
});

adminRoleBtn.addEventListener("click", () => {
  currentRole = "admin";
  adminRoleBtn.classList.add("active");
  voterRoleBtn.classList.remove("active");
  adminFields.style.display = "flex";
  voterFields.style.display = "none";
});

/* -------------------------
SMART LOGIN
--------------------------*/
const loginSubmitBtn = document.getElementById("loginSubmit");

document.getElementById("loginSubmit").addEventListener("click", async () => {
  const errorEl = document.getElementById("loginError");
  errorEl.style.color = "red";
  errorEl.textContent = "";

  loginSubmitBtn.disabled = true;
  loginSubmitBtn.textContent = "Logging in...";

  try {
    if (currentRole === "admin") {
      // Admin login - email + password
      const email = document.getElementById("loginEmail").value.trim();
      const password = document.getElementById("loginPassword").value;

      if (!email || !password) {
        errorEl.textContent = "Please fill in all fields.";
        loginSubmitBtn.disabled = false;
        loginSubmitBtn.textContent = "Login";
        return;
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
      const userData = userDoc.data();

      if (userData.role !== "admin") {
        errorEl.textContent = "You are not authorized as admin.";
        loginSubmitBtn.disabled = false;
        loginSubmitBtn.textContent = "Login";
        return;
      }

      window.location.href = "results.html";

    } else {
      // Voter login - name + voter ID only
      const name = document.getElementById("loginName").value.trim().toLowerCase();
      const voterID = document.getElementById("loginVoterID").value.trim();

      if (!name || !voterID) {
        errorEl.textContent = "Please fill in all fields.";
        loginSubmitBtn.disabled = false;
        loginSubmitBtn.textContent = "Login";
        return;
      }

      const padded = voterID.padStart(4, "0");
      const fakeEmail = `${padded}@heshima.voter`;

      // Voter ID is used as the password behind the scenes
      const internalPassword = `heshima_${padded}`;
      const userCredential = await signInWithEmailAndPassword(auth, fakeEmail, internalPassword);
      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
      const userData = userDoc.data();

      // Verify name matches
      if (userData.fullname.toLowerCase() !== name) {
        errorEl.textContent = "Name does not match this Voter ID.";
        loginSubmitBtn.disabled = false;
        loginSubmitBtn.textContent = "Login";
        return;
      }

      if (userData.hasVoted) {
        errorEl.style.color = "orange";
        errorEl.textContent = "You have already voted. Thank you!";
        loginSubmitBtn.disabled = false;
        loginSubmitBtn.textContent = "Login";
        return;
      }

      window.location.href = "vote.html";
    }

  } catch (err) {
    console.error(err);
    errorEl.style.color = "red";

    if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found") {
      errorEl.textContent = "Invalid name or Voter ID. Please check and try again.";
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