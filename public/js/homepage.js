const slides = [
  {
    title: "Big savings are here",
    subtitle: "Discover amazing deals on your favorite products.",
    image:
      "https://images.unsplash.com/photo-1607082349566-187342175e2f?auto=format&fit=crop&w=1400&q=80",
  },
  {
    title: "Upgrade your lifestyle",
    subtitle: "Shop electronics, fashion, and more at great prices.",
    image:
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1400&q=80",
  },
];

let currentSlide = 0;

const hero = document.querySelector(".hero");
const title = document.querySelector("#hero-title");
const subtitle = document.querySelector("#hero-subtitle");
const dotsContainer = document.querySelector(".dots");

slides.forEach((_, index) => {
  const dot = document.createElement("button");
  dot.className = "dot";
  dot.addEventListener("click", () => showSlide(index));
  dotsContainer.appendChild(dot);
});

function showSlide(index) {
  currentSlide = (index + slides.length) % slides.length;

  hero.style.backgroundImage = `
    linear-gradient(90deg, #111b, #1112),
    url("${slides[currentSlide].image}")
  `;

  title.textContent = slides[currentSlide].title;
  subtitle.textContent = slides[currentSlide].subtitle;

  document.querySelectorAll(".dot").forEach((dot, dotIndex) => {
    dot.classList.toggle("active", dotIndex === currentSlide);
  });
}

document
  .querySelector(".previous")
  .addEventListener("click", () => showSlide(currentSlide - 1));

document
  .querySelector(".next")
  .addEventListener("click", () => showSlide(currentSlide + 1));

document.querySelectorAll(".cart-button").forEach((button) => {
  button.addEventListener("click", () => {
    button.textContent = "Added ✓";
    setTimeout(() => {
      button.textContent = "Add to Cart";
    }, 1500);
  });
});

showSlide(0);