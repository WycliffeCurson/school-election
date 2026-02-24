// Tabs + groups
const tabs = document.querySelectorAll(".tab");
const groups = document.querySelectorAll(".group");
const underline = document.querySelector(".underline");

// Vote buttons
const voteButtons = document.querySelectorAll(".vote-btn");


/* -------------------------
TAB CLICK (Manual Navigation)
--------------------------*/

tabs.forEach((tab, index) => {

  tab.addEventListener("click", () => {

    // Prevent skipping ahead
    const votedCount = document.querySelectorAll(".group .vote-btn.voted").length;
    if (index > votedCount) return;


    // Normal tab behavior
    tabs.forEach(t => t.classList.remove("active"));
    groups.forEach(g => g.classList.remove("active"));

    tab.classList.add("active");

    const target = tab.dataset.target;
    document.getElementById(target).classList.add("active");

    underline.style.left = index * 33.33 + "%";

  });

});


/* -------------------------
VOTING
--------------------------*/

voteButtons.forEach(btn => {

  btn.addEventListener("click", () => {

    const card = btn.closest(".chair-card");
    const group = card.closest(".group");

    // Mark voted
    btn.classList.add("voted");

    // Disable others
    const otherCards = group.querySelectorAll(".chair-card");

    otherCards.forEach(c => {
      if (c !== card) {
        c.classList.add("disabled");
      }
    });


    // ============================
    // MOVE TO NEXT TAB OR FINISH
    // ============================

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

      // All positions voted
      setTimeout(() => {

        document.querySelector(".voting-section").innerHTML = `
          <div style="text-align:center; padding: 4rem;">
            <h1 style="color:#39a84f; font-size: 2.5rem;">
              ✔ Vote Submitted!
            </h1>
    
            <p style="margin-top:1rem; color:#615335; font-size:1.2rem;">
              Thank you for participating in the election.
            </p>
    
          </div>
        `;

      }, 700);

    }

  });

});