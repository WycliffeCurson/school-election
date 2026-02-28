import { auth, db } from "../firebase/config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/* -------------------------
ROUTE GUARD - Admin only
--------------------------*/
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    // Not logged in at all
    window.location.href = "index.html";
    return;
  }

  const userDoc = await getDoc(doc(db, "users", user.uid));
  const userData = userDoc.data();

  if (!userData || userData.role !== "admin") {
    // Logged in but not admin
    window.location.href = "index.html";
    return;
  }

  // Is admin - show the page
  document.body.style.visibility = "visible";
});

/* -------------------------
TAB NAVIGATION
--------------------------*/
const tabs = document.querySelectorAll(".tab");
const groups = document.querySelectorAll(".group");
const underline = document.querySelector(".underline");

tabs.forEach((tab, index) => {
  tab.addEventListener("click", () => {
    tabs.forEach(t => t.classList.remove("active"));
    groups.forEach(g => g.classList.remove("active"));

    tab.classList.add("active");
    document.getElementById(tab.dataset.target).classList.add("active");
    underline.style.left = index * 33.33 + "%";
  });
});

/* -------------------------
LOGOUT
--------------------------*/
document.getElementById("logoutBtn").addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});