const toggle = document.querySelector('.hamburger');
const menu = document.querySelector('#menu');

toggle.addEventListener('click', function toggleClick() {
  toggle.classList.toggle('is-active');

  if (menu.classList.contains('is-active')) {
    this.setAttribute('aria-expanded', 'false');
    menu.classList.remove('is-active');
  } else {
    menu.classList.add('is-active');
    this.setAttribute('aria-expanded', 'true');
  }
});
