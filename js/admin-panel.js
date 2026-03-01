import { auth, db } from "../firebase/config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  collection, addDoc, getDocs, deleteDoc,
  doc, getDoc, query, where, orderBy
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/* -------------------------
ROUTE GUARD
--------------------------*/
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  const userDoc = await getDoc(doc(db, "users", user.uid));
  const userData = userDoc.data();

  if (!userData || userData.role !== "admin") {
    window.location.href = "index.html";
    return;
  }

  document.body.style.visibility = "visible";
  loadCandidates("all");
});

/* -------------------------
RESULTS (BACK) BUTTON
--------------------------*/

document.getElementById("backBtn").addEventListener("click", () => {
  window.location.href = "results.html";
});

/* -------------------------
LOGOUT
--------------------------*/
document.getElementById("logoutBtn").addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});

/* -------------------------
PHOTO PREVIEW
--------------------------*/
document.getElementById("candidatePhoto").addEventListener("change", (e) => {
  const file = e.target.files[0];
  const preview = document.getElementById("photoPreview");

  if (file) {
    const reader = new FileReader();
    reader.onload = (ev) => {
      preview.innerHTML = `<img src="${ev.target.result}" alt="Preview">`;
    };
    reader.readAsDataURL(file);
  } else {
    preview.innerHTML = `<span>No photo selected</span>`;
  }
});

/* -------------------------
ADD CANDIDATE
--------------------------*/
const addBtn = document.getElementById("addCandidateBtn");

addBtn.addEventListener("click", async () => {
  const name = document.getElementById("candidateName").value.trim();
  const className = document.getElementById("candidateClass").value.trim();
  const position = document.getElementById("candidatePosition").value;
  const photoFile = document.getElementById("candidatePhoto").files[0];
  const errorEl = document.getElementById("candidateError");

  errorEl.style.color = "red";
  errorEl.textContent = "";

  if (!name || !className || !position) {
    errorEl.textContent = "Please fill in all fields.";
    return;
  }

  addBtn.disabled = true;
  addBtn.textContent = "Adding...";

  try {
    let photoBase64 = "";

    // Convert photo to base64 to store in Firestore
    if (photoFile) {
      photoBase64 = await toBase64(photoFile);
    }

    await addDoc(collection(db, "candidates"), {
      name,
      className,
      position,
      photo: photoBase64,
      createdAt: new Date()
    });

    errorEl.style.color = "green";
    errorEl.textContent = `✔ ${name} added successfully!`;

    // Reset form
    document.getElementById("candidateName").value = "";
    document.getElementById("candidateClass").value = "";
    document.getElementById("candidatePosition").value = "";
    document.getElementById("candidatePhoto").value = "";
    document.getElementById("photoPreview").innerHTML = `<span>No photo selected</span>`;

    loadCandidates(currentFilter);

  } catch (err) {
    console.error(err);
    errorEl.textContent = "Failed to add candidate. Try again.";
  }

  addBtn.disabled = false;
  addBtn.textContent = "Add Candidate";
});

/* -------------------------
CONVERT IMAGE TO BASE64
--------------------------*/
function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* -------------------------
LOAD CANDIDATES
--------------------------*/
let currentFilter = "all";

async function loadCandidates(filter) {
  currentFilter = filter;
  const listEl = document.getElementById("candidatesList");
  listEl.innerHTML = `<p class="empty-msg">Loading...</p>`;

  try {
    let q;
    if (filter === "all") {
      q = query(collection(db, "candidates"), orderBy("createdAt"));
    } else {
      q = query(
        collection(db, "candidates"),
        where("position", "==", filter),
        orderBy("createdAt")
      );
    }

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      listEl.innerHTML = `<p class="empty-msg">No candidates found.</p>`;
      return;
    }

    listEl.innerHTML = "";
    snapshot.forEach(docSnap => {
      const c = docSnap.data();
      const id = docSnap.id;

      const positionLabel = {
        chair: "Chair",
        vice: "Vice-Chair",
        speaker: "Speaker"
      }[c.position] || c.position;

      const item = document.createElement("div");
      item.className = "candidate-item";
      item.innerHTML = `
        ${c.photo
          ? `<img src="${c.photo}" alt="${c.name}">`
          : `<div style="width:60px;height:60px;background:#ddd;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:11px;color:#999;">No photo</div>`
        }
        <div class="candidate-item-info">
          <h4>${c.name}</h4>
          <p>${c.className}</p>
          <span class="position-badge ${c.position}">${positionLabel}</span>
        </div>
        <button class="delete-btn" data-id="${id}">Delete</button>
      `;

      listEl.appendChild(item);
    });

    // Delete buttons
    document.querySelectorAll(".delete-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        if (confirm("Delete this candidate?")) {
          await deleteDoc(doc(db, "candidates", id));
          loadCandidates(currentFilter);
        }
      });
    });

  } catch (err) {
    console.error(err);
    listEl.innerHTML = `<p class="empty-msg" style="color:red;">Error loading candidates.</p>`;
  }
}

/* -------------------------
FILTER BUTTONS
--------------------------*/
document.querySelectorAll(".filter-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    loadCandidates(btn.dataset.filter);
  });
});