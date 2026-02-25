const tabs = document.querySelectorAll(".tab");
const groups = document.querySelectorAll(".group");
const underline = document.querySelector(".underline");

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