/* 纸上仙途官网：卷首导航。不参与游戏缓存。 */
(function () {
  var top = document.querySelector('.top');
  var links = document.querySelectorAll('.nav a');
  var secs = [];
  var i;
  for (i = 0; i < links.length; i++) {
    var id = (links[i].getAttribute('href') || '').slice(1);
    var el = document.getElementById(id);
    if (el) secs.push({ link: links[i], el: el });
  }
  function mark() {
    var y = window.scrollY || document.documentElement.scrollTop || 0;
    var line = y + 120;
    var cur = secs.length ? secs[0] : null;
    for (i = 0; i < secs.length; i++) {
      if (secs[i].el.offsetTop <= line) cur = secs[i];
    }
    for (i = 0; i < secs.length; i++) {
      if (secs[i] === cur) secs[i].link.setAttribute('aria-current', 'true');
      else secs[i].link.removeAttribute('aria-current');
    }
    if (top) {
      if (y > 8) top.classList.add('is-ink');
      else top.classList.remove('is-ink');
    }
  }
  window.addEventListener('scroll', mark, { passive: true });
  mark();
})();
