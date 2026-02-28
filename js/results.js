import { auth, db } from "../firebase/config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  collection, getDocs, query,
  where, orderBy, doc, getDoc, onSnapshot
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
  startLiveResults();
});

/* -------------------------
LOGOUT
--------------------------*/
document.getElementById("logoutBtn").addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});

/* -------------------------
TABS
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
LIVE RESULTS
--------------------------*/
function startLiveResults() {
  // Listen to votes collection in real time
  onSnapshot(collection(db, "votes"), async (votesSnapshot) => {

    // Count votes per candidate
    const voteCounts = {};
    votesSnapshot.forEach(docSnap => {
      const { candidateId } = docSnap.data();
      if (candidateId) {
        voteCounts[candidateId] = (voteCounts[candidateId] || 0) + 1;
      }
    });

    // Load and render each position
    const positions = ["chair", "vice", "speaker"];
    for (const position of positions) {
      await renderPosition(position, voteCounts);
    }
  });
}

/* -------------------------
RENDER POSITION RESULTS
--------------------------*/
async function renderPosition(position, voteCounts) {
  const box = document.getElementById(`${position}-box`);
  if (!box) return;

  try {
    // Get candidates for this position
    const q = query(
      collection(db, "candidates"),
      where("position", "==", position),
      orderBy("createdAt")
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      box.innerHTML = `<p style="color:#aaa; text-align:center; padding:2rem;">No candidates registered.</p>`;
      return;
    }

    // Build candidates array with vote counts
    let candidates = [];
    snapshot.forEach(docSnap => {
      const c = docSnap.data();
      const id = docSnap.id;
      candidates.push({
        id,
        name: c.name,
        className: c.className,
        photo: c.photo,
        votes: voteCounts[id] || 0
      });
    });

    // Sort by votes descending
    candidates.sort((a, b) => b.votes - a.votes);

    // Calculate total votes for this position
    const totalVotes = candidates.reduce((sum, c) => sum + c.votes, 0);

    // Color themes per position
    const theme = {
      chair: { fill: "progress-fill", percent: "percent" },
      vice: { fill: "progress-fill green", percent: "percent green" },
      speaker: { fill: "progress-fill gold", percent: "percent gold" }
    }[position];

    const positionTagClass = position;

    // Render cards
    box.innerHTML = "";
    candidates.forEach((c, index) => {
      const percentage = totalVotes > 0
        ? Math.round((c.votes / totalVotes) * 100)
        : 0;

      const isWinner = index === 0 && c.votes > 0;

      const card = document.createElement("div");
      card.className = `result-card${isWinner ? " winner" : ""}`;

      card.innerHTML = `
        <div class="position-tag ${positionTagClass}">${index + 1}.</div>
        <div class="card-content">
          ${c.photo
          ? `<img src="${c.photo}" alt="${c.name}" class="candidate-img">`
          : `<div class="no-photo-result">No Photo</div>`
        }
          <div class="candidate-info">
            <h3>${c.name}</h3>
            <p>${c.className}</p>
            <p class="vote-count">${c.votes} ${c.votes === 1 ? "Vote" : "Votes"}</p>
            <div class="progress-area">
              <div class="progress-bar">
                <div class="${theme.fill}" style="width:${percentage}%; transition: width 0.6s ease;"></div>
              </div>
              <span class="${theme.percent}">${percentage}%</span>
            </div>
          </div>
        </div>
      `;

      box.appendChild(card);
    });

  } catch (err) {
    console.error(`Error rendering ${position} results:`, err);
    box.innerHTML = `<p style="color:red; text-align:center; padding:2rem;">Error loading results.</p>`;
  }
}

// Inside startLiveResults(), add this line after onSnapshot starts:
trackTotalVoters();

// Add this new function:
async function trackTotalVoters() {
  onSnapshot(collection(db, "users"), (snapshot) => {
    let voted = 0;
    snapshot.forEach(doc => {
      if (doc.data().hasVoted) voted++;
    });
    const el = document.getElementById("totalVotesCast");
    if (el) el.textContent = voted;
  });
}