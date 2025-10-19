/* ==========================================
   ÄLYKONSULTTI - JAVASCRIPT
   Scroll-animaatiot ja lomakkeen toiminta
   ========================================== */

// ==========================================
// SMOOTH SCROLL JA FADE-IN ANIMAATIOT
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    
    // ==========================================
    // MOBILE MENU TOGGLE
    // ==========================================
    
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');
    
    if (hamburger) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
            document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
        });
        
        // Sulje menu kun klikataan linkkiä
        const menuLinks = navLinks.querySelectorAll('a');
        menuLinks.forEach(link => {
            link.addEventListener('click', function() {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
        
        // Sulje menu kun klikataan ulkopuolelle
        document.addEventListener('click', function(e) {
            if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }
    
    // Intersection Observer fade-in animaatioille
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    // Lisää observer kaikille .fade-in elementeille
    const fadeElements = document.querySelectorAll('.fade-in');
    fadeElements.forEach(element => {
        observer.observe(element);
    });

    // Lisää observer myös palvelukorteille
    const serviceCards = document.querySelectorAll('.service-card');
    serviceCards.forEach(card => {
        observer.observe(card);
    });

    // ==========================================
    // SMOOTH SCROLL NAVIGAATIOLLE
    // ==========================================
    
    // Käsittele scroll-linkit etusivulla (esim. /meista, /lomake)
    const scrollLinks = document.querySelectorAll('.scroll-link');
    
    scrollLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('data-target');
            const targetSection = document.getElementById(targetId);
            
            if (targetSection) {
                const navHeight = document.querySelector('.navbar').offsetHeight;
                const targetPosition = targetSection.offsetTop - navHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Käsittele #-linkit (vanha tapa yhteensopivuuden vuoksi)
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    
    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const navHeight = document.querySelector('.navbar').offsetHeight;
                const targetPosition = targetSection.offsetTop - navHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // ==========================================
    // NAVBAR SCROLL EFFECT
    // ==========================================
    
    const navbar = document.querySelector('.navbar');
    let lastScroll = 0;

    window.addEventListener('scroll', function() {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 100) {
            navbar.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
        } else {
            navbar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.05)';
        }
        
        lastScroll = currentScroll;
    });

    // ==========================================
    // LOMAKKEEN KÄSITTELY - FORMSPREE + CALENDLY
    // ==========================================
    
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Näytä latausanimaatio napissa
            const submitButton = contactForm.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            submitButton.textContent = 'Lähetetään...';
            submitButton.disabled = true;
            
            // Lähetä lomakedata Formspreehen
            const formData = new FormData(contactForm);
            
            fetch(contactForm.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            })
            .then(response => {
                if (response.ok) {
                    // Onnistui! Ohjaa Calendlyyn
                    submitButton.textContent = 'Ohjataan ajanvaraukseen...';
                    setTimeout(function() {
                        window.location.href = 'https://calendly.com/teamalykonsultti/30min';
                    }, 1000);
                } else {
                    // Virhe
                    submitButton.textContent = 'Virhe! Yritä uudelleen';
                    submitButton.disabled = false;
                    alert('Lomakkeen lähetys epäonnistui. Yritä uudelleen.');
                }
            })
            .catch(error => {
                submitButton.textContent = originalText;
                submitButton.disabled = false;
                alert('Lomakkeen lähetys epäonnistui. Yritä uudelleen.');
            });
        });
    }

    // ==========================================
    // LOMAKKEEN VALIDOINTI REAALIAJASSA
    // ==========================================
    
    const emailInput = document.getElementById('email');
    
    if (emailInput) {
        emailInput.addEventListener('blur', function() {
            const email = this.value;
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            
            if (email && !emailRegex.test(email)) {
                this.style.borderColor = '#ff4444';
            } else {
                this.style.borderColor = '#E0E0E0';
            }
        });
    }

    // ==========================================
    // PERFORMANCE: LAZY LOADING IMAGES
    // ==========================================
    
    if ('loading' in HTMLImageElement.prototype) {
        const images = document.querySelectorAll('img[loading="lazy"]');
        images.forEach(img => {
            img.src = img.dataset.src;
        });
    } else {
        // Fallback Intersection Observerille vanhemmille selaimille
        const imageObserver = new IntersectionObserver(function(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    imageObserver.unobserve(img);
                }
            });
        });
        
        document.querySelectorAll('img[loading="lazy"]').forEach(img => {
            imageObserver.observe(img);
        });
    }

    // ==========================================
    // CONSOLE VIESTI (Brändäys)
    // ==========================================
    
    console.log('%c💡 Älykonsultti', 'color: #A3D9F0; font-size: 20px; font-weight: bold;');
    console.log('%cTekoälyratkaisut pk-yrityksille', 'color: #F4B88E; font-size: 14px;');
    console.log('%c🔗 info@alykonsultti.fi', 'color: #2C5F7C; font-size: 12px;');
    
});

// ==========================================
// ACCESSIBILITY: ESC KEY CLOSE
// ==========================================

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        // Sulje mahdolliset modaalit/dropdownit tässä
        // (tulevaisuutta varten)
    }
});

// ==========================================
// EXPORT FOR TESTING (Jos tarpeen)
// ==========================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        // Exportaa funktioita testausta varten
    };
}
