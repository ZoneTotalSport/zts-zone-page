/**
 * ZTS Includes — Loads header.html and footer.html into pages.
 *
 * Usage:
 *   <div id="zts-header"></div>
 *   <!-- page content here -->
 *   <div id="zts-footer"></div>
 *   <script src="includes.js"></script>
 */
(function () {
    'use strict';

    // Determine base path relative to current page
    // If we're in a subdirectory (e.g., wix/), adjust paths
    var scripts = document.getElementsByTagName('script');
    var basePath = '';
    for (var i = 0; i < scripts.length; i++) {
        var src = scripts[i].getAttribute('src') || '';
        if (src.indexOf('includes.js') !== -1) {
            basePath = src.replace('includes.js', '');
            break;
        }
    }

    function loadFragment(url, targetId, callback) {
        var target = document.getElementById(targetId);
        if (!target) {
            if (callback) callback();
            return;
        }
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200 || xhr.status === 0) {
                    target.innerHTML = xhr.responseText;
                    // Execute any <script> tags in the loaded fragment
                    var scripts = target.querySelectorAll('script');
                    scripts.forEach(function (oldScript) {
                        var newScript = document.createElement('script');
                        // Copy attributes
                        Array.from(oldScript.attributes).forEach(function (attr) {
                            newScript.setAttribute(attr.name, attr.value);
                        });
                        newScript.textContent = oldScript.textContent;
                        oldScript.parentNode.replaceChild(newScript, oldScript);
                    });
                } else {
                    console.warn('ZTS includes: failed to load ' + url + ' (status ' + xhr.status + ')');
                }
                if (callback) callback();
            }
        };
        xhr.send();
    }

    var headerLoaded = false;
    var footerLoaded = false;

    function onAllLoaded() {
        if (!headerLoaded || !footerLoaded) return;

        // Re-initialize Lucide icons
        if (typeof lucide !== 'undefined' && lucide.createIcons) {
            lucide.createIcons();
        }

        // Re-initialize the digital clock
        if (typeof updateClock === 'function') {
            updateClock();
        } else {
            // Fallback: start clock if the function exists in global scope
            var clockEl = document.getElementById('clockTime');
            if (clockEl) {
                function _ztsClock() {
                    var now = new Date();
                    var h = now.getHours().toString().padStart(2, '0');
                    var m = now.getMinutes().toString().padStart(2, '0');
                    var s = now.getSeconds().toString().padStart(2, '0');
                    clockEl.innerHTML = h + '<span class="clock-dot">:</span>' + m + '<span class="clock-dot">:</span>' + s;
                }
                _ztsClock();
                setInterval(_ztsClock, 1000);
            }
        }

        // Re-initialize hamburger menu
        var hamburger = document.getElementById('hamburger');
        var mobileMenu = document.getElementById('mobileMenu');
        if (hamburger && mobileMenu) {
            hamburger.addEventListener('click', function () {
                hamburger.classList.toggle('active');
                mobileMenu.classList.toggle('open');
            });
            window.closeMobile = function () {
                hamburger.classList.remove('active');
                mobileMenu.classList.remove('open');
            };
        }

        // Re-initialize nav scroll behavior
        var nav = document.getElementById('mainNav');
        if (nav) {
            window.addEventListener('scroll', function () {
                nav.classList.toggle('scrolled', window.scrollY > 50);
            });
            // Apply immediately if already scrolled
            if (window.scrollY > 50) nav.classList.add('scrolled');
        }

        // Re-initialize scroll progress bar
        var progressBar = document.getElementById('scrollProgress');
        if (progressBar) {
            window.addEventListener('scroll', function () {
                var progress = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
                progressBar.style.transform = 'scaleX(' + progress + ')';
            });
        }

        // Re-initialize magnetic buttons
        if (typeof gsap !== 'undefined') {
            document.querySelectorAll('.magnetic-btn').forEach(function (btn) {
                btn.addEventListener('mousemove', function (e) {
                    var rect = btn.getBoundingClientRect();
                    var x = e.clientX - rect.left - rect.width / 2;
                    var y = e.clientY - rect.top - rect.height / 2;
                    gsap.to(btn, { x: x * 0.3, y: y * 0.3, duration: 0.3, ease: 'power2.out' });
                });
                btn.addEventListener('mouseleave', function () {
                    gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.4)' });
                });
            });
        }

        // Dispatch a custom event so other scripts can hook in
        document.dispatchEvent(new CustomEvent('zts-includes-loaded'));
    }

    // Load header
    loadFragment(basePath + 'header.html', 'zts-header', function () {
        headerLoaded = true;
        onAllLoaded();
    });

    // Load footer
    loadFragment(basePath + 'footer.html', 'zts-footer', function () {
        footerLoaded = true;
        onAllLoaded();
    });

})();
