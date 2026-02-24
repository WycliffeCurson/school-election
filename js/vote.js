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


    /* AUTO MOVE NEXT */

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

    }

  });

});