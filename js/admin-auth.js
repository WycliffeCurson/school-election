import { auth, db } from "../firebase/config.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  doc, setDoc, collection,
  query, where, getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const btn = document.getElementById("adminRegisterBtn");
const errorEl = document.getElementById("adminError");

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

/* -------------------------
CHECK IF ADMIN ALREADY EXISTS
--------------------------*/
async function checkAdminExists() {
  const q = query(collection(db, "users"), where("role", "==", "admin"));
  const snapshot = await getDocs(q);
  return !snapshot.empty;
}

/* -------------------------
ON PAGE LOAD - lock if admin exists
--------------------------*/
window.addEventListener("load", async () => {
  try {
    const adminExists = await checkAdminExists();
    if (adminExists) {
      document.getElementById("adminRegCard").innerHTML = `
        <div style="text-align:center; padding:2rem;">
          <p style="font-size:3rem;">🔒</p>
          <h3 style="color:#181b4c; margin-bottom:0.5rem;">Access Restricted</h3>
          <p style="color:#555; font-size:14px; line-height:1.6;">
            An admin account already exists.<br>
            Contact the school administrator for access.
          </p>
          <button onclick="window.location.href='index.html'" 
            style="margin-top:1.5rem; padding:10px 24px; background:#181b4c; 
            color:white; border:none; border-radius:8px; cursor:pointer; font-size:14px;">
            Back to Login
          </button>
        </div>
      `;
    }
  } catch (err) {
    console.error("Could not verify admin status:", err);
  }
});

/* -------------------------
ADMIN REGISTRATION
--------------------------*/
btn.addEventListener("click", async () => {
  const name = document.getElementById("adminName").value.trim();
  const email = document.getElementById("adminEmail").value.trim();
  const password = document.getElementById("adminPassword").value;
  const confirmPassword = document.getElementById("adminPasswordConfirm").value;

  errorEl.style.color = "red";
  errorEl.textContent = "";

  if (!name || !email || !password || !confirmPassword) {
    errorEl.textContent = "Please fill in all fields.";
    return;
  }

  if (password.length < 6) {
    errorEl.textContent = "Password must be at least 6 characters.";
    return;
  }

  if (password !== confirmPassword) {
    errorEl.textContent = "Passwords do not match.";
    return;
  }

  const adminExists = await checkAdminExists();
  if (adminExists) {
    errorEl.textContent = "An admin account already exists.";
    return;
  }

  btn.disabled = true;
  btn.textContent = "Creating account...";

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

    await setDoc(doc(db, "users", userCredential.user.uid), {
      fullname: name,
      email,
      role: "admin",
      createdAt: new Date()
    });

    errorEl.style.color = "green";
    errorEl.textContent = "✔ Admin account created successfully! Redirecting...";
    btn.textContent = "Done ✔";

    setTimeout(() => {
      window.location.href = "index.html";
    }, 2000);

  } catch (err) {
    errorEl.style.color = "red";

    if (err.code === "auth/email-already-in-use") {
      errorEl.textContent = "This email is already registered.";
    } else if (err.code === "auth/invalid-email") {
      errorEl.textContent = "Please enter a valid email address.";
    } else {
      errorEl.textContent = "Error: " + err.message;
    }

    btn.disabled = false;
    btn.textContent = "Create Admin Account";
  }
});