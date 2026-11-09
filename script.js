(function () {
  'use strict';

  var nav = document.getElementById('nav');
  var menuBtn = document.getElementById('menuBtn');

  /* 移动端菜单 */
  function closeMenu() {
    if (!nav || !menuBtn) return;
    nav.classList.remove('open');
    menuBtn.classList.remove('is-open');
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.setAttribute('aria-label', '打开菜单');
  }

  if (nav && menuBtn) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      menuBtn.classList.toggle('is-open', open);
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? '关闭菜单' : '打开菜单');
    });

    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeMenu();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });
  }

  /* 首屏高度：确保进入页面时只露出首屏，不露出下一部分 */
  var hero = document.querySelector('.hero');
  var siteHeader = document.querySelector('.site-header');
  function fitHero() {
    if (!hero || !siteHeader) return;
    var headerH = siteHeader.getBoundingClientRect().height;
    var target = Math.round(window.innerHeight - headerH);
    hero.style.minHeight = Math.max(0, target) + 'px';
  }
  fitHero();
  window.addEventListener('resize', fitHero);
  window.addEventListener('orientationchange', fitHero);
  window.addEventListener('load', fitHero);
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', fitHero);
  }

  /* 首屏代码卡片：代码 / 运行模拟 两个标签切换 */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.code-tab'));
  var panes = tabs.map(function (tab) {
    return document.getElementById(tab.getAttribute('aria-controls'));
  });

  /* 代码卡源码（由独立文件 cat-source.js 提供） */
  var CODE_SOURCE = window.CAT_SOURCE || '';

  function escapeCode(text) {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function highlightLine(line) {
    var s = escapeCode(line);
    s = s.replace(/"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'/g, function (m) { return '<span class="tc-s">' + m + '</span>'; });
    s = s.replace(/(&lt;\/?[a-zA-Z][\s\S]*?&gt;)/g, function (m) { return '<span class="tc-t">' + m + '</span>'; });
    s = s.replace(/(&lt;!doctype[^&]*?&gt;)/g, function (m) { return '<span class="tc-t">' + m + '</span>'; });
    s = s.replace(/(&lt;!--[\s\S]*?--&gt;)/g, function (m) { return '<span class="tc-c">' + m + '</span>'; });
    return s;
  }

  function renderCode() {
    var pane = document.getElementById('paneHtml');
    if (!pane) return;
    if (!CODE_SOURCE) {
      pane.innerHTML = '<code><span class="lc">源码加载失败：请确认 cat-source.js 与 index.html 在同一目录。</span></code>';
      return;
    }
    var lines = CODE_SOURCE.replace(/\r\n/g, '\n').split('\n');
    var html = '';
    for (var i = 0; i < lines.length; i += 1) {
      html += '<div class="cl"><span class="ln">' + (i + 1) + '</span><span class="lc">' + highlightLine(lines[i]) + '</span></div>';
    }
    pane.innerHTML = '<code>' + html + '</code>';
  }

  renderCode();

  /* 运行模拟：直接用桌宠源码生成 iframe，不需要外部页面 */
  var previewFrame = document.querySelector('.preview-frame');
  var previewLoaded = false;

  function runPreview() {
    if (!previewFrame || previewLoaded || !CODE_SOURCE) return;
    /* 强制进入 embed 模式：隐藏猫咪页自己的标题和提示，只留舞台 */
    var code = CODE_SOURCE.replace("new URLSearchParams(location.search).has('embed')", 'true');
    previewFrame.srcdoc = code;
    previewLoaded = true;
  }

  function selectTab(index) {
    tabs.forEach(function (tab, i) {
      var active = i === index;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      if (panes[i]) panes[i].hidden = !active;
    });
    if (panes[index] && panes[index].classList.contains('code-preview')) runPreview();
  }

  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () { selectTab(i); });
    tab.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        var next = (i + 1) % tabs.length;
        selectTab(next);
        tabs[next].focus();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        var prev = (i - 1 + tabs.length) % tabs.length;
        selectTab(prev);
        tabs[prev].focus();
      }
    });
  });

  /* 复制代码卡里的完整源码（不含行号） */
  var codeCopyBtn = document.getElementById('codeCopy');
  var codeCopyLabel = document.getElementById('codeCopyLabel');
  var codeCopyTimer = null;
  if (codeCopyBtn && codeCopyLabel) {
    codeCopyBtn.addEventListener('click', function () {
      var text = CODE_SOURCE || '';

      function done() {
        codeCopyLabel.textContent = '已复制';
        codeCopyBtn.classList.add('is-done');
        clearTimeout(codeCopyTimer);
        codeCopyTimer = setTimeout(function () {
          codeCopyLabel.textContent = '复制';
          codeCopyBtn.classList.remove('is-done');
        }, 1700);
      }

      function fallback() {
        var area = document.createElement('textarea');
        area.value = text;
        area.style.position = 'fixed';
        area.style.opacity = '0';
        document.body.appendChild(area);
        area.select();
        try { document.execCommand('copy'); done(); } catch (err) {}
        document.body.removeChild(area);
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, fallback);
      } else {
        fallback();
      }
    });
  }

  /* 元素进入视口时淡入 */
  var revealItems = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
    );
    revealItems.forEach(function (el) { io.observe(el); });
  } else {
    revealItems.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* 关于我们：数据滚动增长 */
  var statNumbers = Array.prototype.slice.call(document.querySelectorAll('.stat strong[data-count]'));
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (statNumbers.length && !reduceMotion) {
    var statsCard = document.querySelector('.stats-card');

    function animateStat(el) {
      var target = parseInt(el.getAttribute('data-count'), 10) || 0;
      var suffix = el.getAttribute('data-suffix') || '';
      var duration = parseInt(el.getAttribute('data-duration'), 10) || (target > 100 ? 1400 : 900);
      var startTime = null;
      function step(now) {
        if (!startTime) startTime = now;
        var progress = Math.min(1, (now - startTime) / duration);
        var eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = String(Math.round(target * eased)) + suffix;
        if (progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    statNumbers.forEach(function (el) {
      el.textContent = '0' + (el.getAttribute('data-suffix') || '');
    });

    if ('IntersectionObserver' in window && statsCard) {
      var statObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              statNumbers.forEach(function (el, index) {
                setTimeout(function () { animateStat(el); }, index * 120);
              });
              statObserver.disconnect();
            }
          });
        },
        { threshold: 0.35 }
      );
      statObserver.observe(statsCard);
    } else {
      statNumbers.forEach(animateStat);
    }
  }

  /* 悬浮回到顶部（DSH 风格） */
  var backTop = document.getElementById('backTop');
  if (backTop) {
    var backTopShown = false;
    function updateBackTop() {
      var show = window.scrollY > Math.max(420, window.innerHeight * 0.6);
      if (show !== backTopShown) {
        backTopShown = show;
        backTop.classList.toggle('is-visible', show);
      }
    }
    window.addEventListener('scroll', updateBackTop, { passive: true });
    window.addEventListener('resize', updateBackTop);
    window.addEventListener('load', updateBackTop);
    updateBackTop();
    backTop.addEventListener('click', function () {
      var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    });
  }

  /* 主站专属滚动条（隐藏浏览器原生滚动条） */
  var pageBar = document.getElementById('pageScrollbar');
  var pageThumb = document.getElementById('pageScrollThumb');
  if (pageBar && pageThumb) {
    var barHideTimer = null;
    var barDragging = false;
    var barDragY = 0;
    var barDragScroll = 0;

    function updatePageBar() {
      var doc = document.documentElement;
      var viewH = window.innerHeight;
      var total = doc.scrollHeight;
      var max = total - viewH;
      if (max <= 8) {
        pageBar.classList.remove('is-visible');
        return;
      }
      pageBar.classList.add('is-visible');
      var trackH = pageBar.clientHeight;
      var thumbH = Math.max(44, Math.round(trackH * viewH / total));
      var top = (window.scrollY / max) * (trackH - thumbH);
      pageThumb.style.height = thumbH + 'px';
      pageThumb.style.top = Math.max(0, Math.min(trackH - thumbH, top)) + 'px';
    }

    function flashPageBar() {
      pageBar.classList.add('is-active');
      clearTimeout(barHideTimer);
      barHideTimer = setTimeout(function () {
        if (!barDragging) pageBar.classList.remove('is-active');
      }, 1300);
    }

    window.addEventListener('scroll', function () {
      updatePageBar();
      flashPageBar();
    }, { passive: true });
    window.addEventListener('resize', updatePageBar);
    window.addEventListener('load', updatePageBar);
    if ('ResizeObserver' in window) {
      new ResizeObserver(updatePageBar).observe(document.body);
    }
    updatePageBar();

    pageThumb.addEventListener('pointerenter', function () {
      pageBar.classList.add('is-active');
    });
    pageThumb.addEventListener('pointerleave', function () {
      if (!barDragging) pageBar.classList.remove('is-active');
    });

    pageThumb.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      barDragging = true;
      barDragY = e.clientY;
      barDragScroll = window.scrollY;
      pageThumb.classList.add('is-dragging');
      pageBar.classList.add('is-active');
      document.documentElement.style.scrollBehavior = 'auto';
      try { pageThumb.setPointerCapture(e.pointerId); } catch (err) {}
    });

    pageThumb.addEventListener('pointermove', function (e) {
      if (!barDragging) return;
      var trackH = pageBar.clientHeight;
      var thumbH = pageThumb.offsetHeight;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var ratio = (e.clientY - barDragY) / Math.max(1, trackH - thumbH);
      window.scrollTo(0, barDragScroll + ratio * max);
    });

    function endBarDrag(e) {
      if (!barDragging) return;
      barDragging = false;
      pageThumb.classList.remove('is-dragging');
      document.documentElement.style.scrollBehavior = '';
      flashPageBar();
      try { pageThumb.releasePointerCapture(e.pointerId); } catch (err) {}
    }
    pageThumb.addEventListener('pointerup', endBarDrag);
    pageThumb.addEventListener('pointercancel', endBarDrag);
  }

  /* 页脚年份自动更新 */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
