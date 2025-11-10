// Main JavaScript functionality
const MainJS = {
    // Mobile navigation toggle
    toggleMobileNav: function() {
        const navLinks = document.querySelector('.nav-links');
        const mobileBtn = document.querySelector('.mobile-menu-btn');

        if (navLinks && mobileBtn) {
            navLinks.classList.toggle('active');
            mobileBtn.innerHTML = navLinks.classList.contains('active') ? '✕' : '☰';
        }
    },

    // Smooth scrolling for anchor links
    initSmoothScrolling: function() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    },

    // Header scroll effect
    initHeaderScroll: function() {
        const header = document.querySelector('header');
        if (header) {
            let lastScroll = 0;

            window.addEventListener('scroll', () => {
                const currentScroll = window.pageYOffset;

                if (currentScroll > 100) {
                    header.style.background = 'rgba(255, 255, 255, 0.98)';
                    header.style.boxShadow = '0 2px 20px rgba(0,0,0,0.1)';
                } else {
                    header.style.background = 'rgba(255, 255, 255, 0.95)';
                    header.style.boxShadow = 'none';
                }

                lastScroll = currentScroll;
            });
        }
    },

    // Image lazy loading
    initLazyLoading: function() {
        if ('IntersectionObserver' in window) {
            const images = document.querySelectorAll('img[data-src]');
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.classList.remove('lazy');
                        imageObserver.unobserve(img);
                    }
                });
            });

            images.forEach(img => imageObserver.observe(img));
        }
    },

    // Animation on scroll
    initScrollAnimations: function() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        // Observe elements for animation
        document.querySelectorAll('.fashion-card, .trend-item, .brand-story-content').forEach(el => {
            observer.observe(el);
        });
    },

    // Newsletter signup
    initNewsletter: function() {
        const newsletterForm = document.querySelector('.newsletter-form');
        if (newsletterForm) {
            newsletterForm.addEventListener('submit', function(e) {
                e.preventDefault();
                const email = this.querySelector('input[type="email"]').value;

                if (email && email.includes('@')) {
                    // Simulate newsletter signup
                    alert('感谢订阅！您将收到最新的时尚资讯。');
                    this.reset();
                } else {
                    alert('请输入有效的邮箱地址。');
                }
            });
        }
    },

    // Search functionality
    initSearch: function() {
        const searchInput = document.querySelector('.search-input');
        const searchResults = document.querySelector('.search-results');

        if (searchInput && searchResults) {
            let searchTimeout;

            searchInput.addEventListener('input', function() {
                clearTimeout(searchTimeout);
                const query = this.value.trim();

                if (query.length > 2) {
                    searchTimeout = setTimeout(() => {
                        performSearch(query);
                    }, 300);
                } else {
                    searchResults.innerHTML = '';
                    searchResults.style.display = 'none';
                }
            });
        }
    },

    // Initialize all functionality
    init: function() {
        this.initSmoothScrolling();
        this.initHeaderScroll();
        this.initLazyLoading();
        this.initScrollAnimations();
        this.initNewsletter();
        this.initSearch();

        // Bind mobile menu button
        const mobileBtn = document.querySelector('.mobile-menu-btn');
        if (mobileBtn) {
            mobileBtn.addEventListener('click', this.toggleMobileNav);
        }

        console.log('Guushu website initialized successfully!');
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    MainJS.init();
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    .fashion-card, .trend-item, .brand-story-content {
        opacity: 0;
        transform: translateY(30px);
        transition: opacity 0.6s ease, transform 0.6s ease;
    }

    .animate-in {
        opacity: 1 !important;
        transform: translateY(0) !important;
    }

    img.lazy {
        opacity: 0;
        transition: opacity 0.3s ease;
    }

    img:not(.lazy) {
        opacity: 1;
    }
`;
document.head.appendChild(style);