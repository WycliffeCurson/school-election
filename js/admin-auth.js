import { auth, db } from "../firebase/config.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const btn = document.getElementById("adminRegisterBtn");
const errorEl = document.getElementById("adminError");

document.querySelectorAll(".toggle-password").forEach(toggle => {
  toggle.addEventListener("click", () => {
    const input = document.getElementById(toggle.dataset.target);
    const isHidden = input.type === "password";
    input.type = isHidden ? "text" : "password";
    toggle.textContent = isHidden ? "🙈" : "👁️";
  });
});

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