import { auth, db } from "../firebase/config.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const btn = document.getElementById("adminRegisterBtn");

btn.addEventListener("click", async () => {
  const name = document.getElementById("adminName").value.trim();
  const email = document.getElementById("adminEmail").value.trim();
  const password = document.getElementById("adminPassword").value;
  const errorEl = document.getElementById("adminError");

  errorEl.style.color = "red";
  errorEl.textContent = "";

  if (!name || !email || !password) {
    errorEl.textContent = "Please fill in all fields.";
    return;
  }

  if (password.length < 6) {
    errorEl.textContent = "Password must be at least 6 characters.";
    return;
  }

  // Loading state
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
    errorEl.textContent = "Admin account created successfully!";
    btn.textContent = "Done ✔";

  } catch (err) {
    errorEl.style.color = "red";

    if (err.code === "auth/email-already-in-use") {
      errorEl.textContent = "An admin with this email already exists.";
    } else if (err.code === "auth/invalid-email") {
      errorEl.textContent = "Please enter a valid email address.";
    } else {
      errorEl.textContent = "Error: " + err.message;
    }

    btn.disabled = false;
    btn.textContent = "Create Admin Account";
  }
});