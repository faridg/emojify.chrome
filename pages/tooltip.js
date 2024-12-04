const images = document.querySelectorAll("img");
const tip = document.querySelector(".tip");

for (const image of images) {
  image.addEventListener("click", () => {
    tip.setAttribute("class", "tip tip--visible");
    setTimeout(() => tip.setAttribute("class", "tip"), 5000);
  });
}
