// Select all vote buttons
const voteButtons = document.querySelectorAll(".vote-btn");

voteButtons.forEach(btn => {
  btn.addEventListener("click", () => {

    // Get parent card
    const card = btn.closest(".chair-card");
    const group = card.closest(".group"); // current category (chair, vice, speaker)

    // Mark clicked button as voted
    btn.classList.add("voted");

    // Disable all other cards in this group
    const otherCards = group.querySelectorAll(".chair-card");
    otherCards.forEach(c => {
      if (c !== card) {
        c.classList.add("disabled");
      }
    });

  });
});