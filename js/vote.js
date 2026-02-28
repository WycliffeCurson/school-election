import { auth, db } from "../firebase/config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, getDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/* -------------------------
ROUTE GUARD - Voters only
--------------------------*/
let currentUser = null;

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
    // Already voted - show message instead of ballot
    document.querySelector(".voting-section").innerHTML = `
      <div style="text-align:center; padding:4rem;">
        <h1 style="color:#615335; font-size:2rem;">You have already voted.</h1>
        <p style="margin-top:1rem; color:#555;">Thank you for participating, ${userData.fullname}!</p>
      </div>
    `;
    document.body.style.visibility = "visible";
    return;
  }

  currentUser = user;
  document.body.style.visibility = "visible";
});

/* -------------------------
TABS
--------------------------*/
const tabs = document.querySelectorAll(".tab");
const groups = document.querySelectorAll(".group");
const underline = document.querySelector(".underline");

tabs.forEach((tab, index) => {
  tab.addEventListener("click", () => {
    const votedCount = document.querySelectorAll(".group .vote-btn.voted").length;
    if (index > votedCount) return;

    tabs.forEach(t => t.classList.remove("active"));
    groups.forEach(g => g.classList.remove("active"));

    tab.classList.add("active");
    document.getElementById(tab.dataset.target).classList.add("active");
    underline.style.left = index * 33.33 + "%";
  });
});

/* -------------------------
VOTING + FIREBASE SAVE
--------------------------*/
const voteButtons = document.querySelectorAll(".vote-btn");
const votes = {}; // stores { chair: candidateId, vice: candidateId, speaker: candidateId }

voteButtons.forEach(btn => {
  btn.addEventListener("click", async () => {
    const card = btn.closest(".chair-card");
    const group = card.closest(".group");
    const position = group.id; // "chair", "vice", or "speaker"
    const candidateId = card.dataset.candidateId; // we'll add this to HTML next

    // Mark voted visually
    btn.classList.add("voted");
    group.querySelectorAll(".chair-card").forEach(c => {
      if (c !== card) c.classList.add("disabled");
    });

    // Store the vote locally
    votes[position] = candidateId;

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
      // All three positions voted - save to Firebase
      setTimeout(async () => {
        try {
          // Save each vote as a separate document
          await setDoc(doc(db, "votes", `${currentUser.uid}_chair`), {
            voterUID: currentUser.uid,
            position: "chair",
            candidateId: votes["chair"],
            timestamp: new Date()
          });

          await setDoc(doc(db, "votes", `${currentUser.uid}_vice`), {
            voterUID: currentUser.uid,
            position: "vice",
            candidateId: votes["vice"],
            timestamp: new Date()
          });

          await setDoc(doc(db, "votes", `${currentUser.uid}_speaker`), {
            voterUID: currentUser.uid,
            position: "speaker",
            candidateId: votes["speaker"],
            timestamp: new Date()
          });

          // Mark user as having voted
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
      }, 700);
    }
  });
});