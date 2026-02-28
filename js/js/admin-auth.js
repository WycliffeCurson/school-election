import { auth, db } from "../firebase/config.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

document.getElementById("adminRegisterBtn").addEventListener("click", async () => {
  const name = document.getElementById("adminName").value.trim();
  const email = document.getElementById("adminEmail").value.trim();
  const password = document.getElementById("adminPassword").value;
  const errorEl = document.getElementById("adminError");

  if (!name || !email || !password) {
    errorEl.textContent = "Please fill in all fields.";
    return;
  }

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

  } catch (err) {
    errorEl.style.color = "red";
    errorEl.textContent = "Error: " + err.message;
  }
});