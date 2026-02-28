import { auth, db } from "../firebase/config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  collection, getDocs, query,
  where, orderBy, doc, getDoc,
  setDoc, updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/* -------------------------
STATE
--------------------------*/
let currentUser = null;
let votes = {};

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

  if (!userData || userData.role !== "voter") {
    window.location.href = "index.html";
    return;
  }

  if (userData.hasVoted) {
    document.querySelector(".voting-section").innerHTML = `
      <div style="text-align:center; padding:4rem;">
        <h1 style="color:#615335; font-size:2rem;">You have already voted.</h1>
        <p style="margin-top:1rem; color:#555;">
          Thank you for participating, ${userData.fullname}!
        </p>
      </div>
    `;
    document.body.style.visibility = "visible";
    return;
  }

  currentUser = user;
  await loadCandidates();
  document.body.style.visibility = "visible";
});

/* -------------------------
LOAD CANDIDATES FROM FIRESTORE
--------------------------*/
async function loadCandidates() {
  const positions = ["chair", "vice", "speaker"];

  for (const position of positions) {
    const box = document.getElementById(`${position}-box`);

    try {
      const q = query(
        collection(db, "candidates"),
        where("position", "==", position),
        orderBy("createdAt")
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        box.innerHTML = `<p class="no-candidates-msg">No candidates registered for this position yet.</p>`;
        continue;
      }

      box.innerHTML = "";

      snapshot.forEach(docSnap => {
        const c = docSnap.data();
        const id = docSnap.id;

        const card = document.createElement("div");
        card.className = "chair-card";
        card.dataset.candidateId = id;

        card.innerHTML = `
          ${c.photo
            ? `<img src="${c.photo}" alt="${c.name}">`
            : `<div class="no-photo">No Photo</div>`
          }
          <h1>${c.name}</h1>
          <p class="title">${c.className}</p>
          <button class="vote-btn">Vote</button>
        `;

        box.appendChild(card);
      });

      // Attach vote listeners for this position's cards
      attachVoteListeners(box, position);

    } catch (err) {
      console.error(`Error loading ${position} candidates:`, err);
      box.innerHTML = `<p class="no-candidates-msg">Error loading candidates. Please refresh.</p>`;
    }
  }
}

/* -------------------------
TABS
--------------------------*/
const tabs = document.querySelectorAll(".tab");
const groups = document.querySelectorAll(".group");
const underline = document.querySelector(".underline");

tabs.forEach((tab, index) => {
  tab.addEventListener("click", () => {
    const votedCount = document.querySelectorAll(".vote-btn.voted").length;
    if (index > votedCount) return;

    tabs.forEach(t => t.classList.remove("active"));
    groups.forEach(g => g.classList.remove("active"));

    tab.classList.add("active");
    document.getElementById(tab.dataset.target).classList.add("active");
    underline.style.left = index * 33.33 + "%";
  });
});

/* -------------------------
VOTE LISTENERS
--------------------------*/
function attachVoteListeners(box, position) {
  box.querySelectorAll(".vote-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const card = btn.closest(".chair-card");
      const candidateId = card.dataset.candidateId;

      // Visual feedback
      btn.classList.add("voted");
      box.querySelectorAll(".chair-card").forEach(c => {
        if (c !== card) c.classList.add("disabled");
      });

      // Store vote locally
      votes[position] = candidateId;

      // Find current group and determine next
      const group = card.closest(".group");
      const currentIndex = Array.from(groups).indexOf(group);
      const nextIndex = currentIndex + 1;

      if (nextIndex < tabs.length) {
        setTimeout(() => {
          tabs.forEach(t => t.classList.remove("active"));
          groups.forEach(g => g.classList.remove("active"));
          tabs[nextIndex].classList.add("active");
          groups[nextIndex].classList.add("active");
          underline.style.left = nextIndex * 33.33 + "%";
        }, 700);

      } else {
        // All positions voted — save to Firebase
        setTimeout(async () => {
          await submitVotes();
        }, 700);
      }
    });
  });
}

/* -------------------------
SUBMIT ALL VOTES
--------------------------*/
async function submitVotes() {
  try {
    const positions = ["chair", "vice", "speaker"];

    for (const position of positions) {
      if (votes[position]) {
        await setDoc(doc(db, "votes", `${currentUser.uid}_${position}`), {
          voterUID: currentUser.uid,
          position,
          candidateId: votes[position],
          timestamp: new Date()
        });
      }
    }

    // Mark user as voted
    await updateDoc(doc(db, "users", currentUser.uid), {
      hasVoted: true
    });

    document.querySelector(".voting-section").innerHTML = `
      <div style="text-align:center; padding:4rem;">
        <h1 style="color:#39a84f; font-size:2.5rem;">✔ Vote Submitted!</h1>
        <p style="margin-top:1rem; color:#615335; font-size:1.2rem;">
          Thank you for participating in the election.
        </p>
      </div>
    `;

  } catch (err) {
    console.error("Vote save failed:", err);
    document.querySelector(".voting-section").innerHTML = `
      <div style="text-align:center; padding:4rem;">
        <h1 style="color:red; font-size:1.5rem;">Something went wrong saving your vote.</h1>
        <p style="color:#555;">Please call a teacher for assistance.</p>
      </div>
    `;
  }
}