// Jekyll 兼容的语言检测器
const LanguageManager = {
    supportedLanguages: ['zh', 'en'],
    defaultLanguage: 'zh',

    detectUserLanguage: function() {
        const savedLanguage = localStorage.getItem('guushu_language');
        if (savedLanguage && this.supportedLanguages.includes(savedLanguage)) {
            return savedLanguage;
        }

        const browserLang = navigator.language || navigator.userLanguage;
        const primaryLang = browserLang.split('-')[0].toLowerCase();

        if (this.supportedLanguages.includes(primaryLang)) {
            return primaryLang;
        }

        if (browserLang.startsWith('zh')) {
            return 'zh';
        }

        return this.defaultLanguage;
    },

    switchLanguage: function(lang) {
        if (!this.supportedLanguages.includes(lang)) {
            return;
        }

        localStorage.setItem('guushu_language', lang);
        document.documentElement.lang = lang;

        // Jekyll 页面切换 - 重定向到对应语言页面
        const currentPath = window.location.pathname;
        const isEnglish = currentPath.startsWith('/en/');
        const isChinese = currentPath.startsWith('/zh/') || (!isEnglish && !currentPath.startsWith('/en/'));

        if (lang === 'en' && !isEnglish) {
            // 切换到英文版本
            const newPath = '/en' + (currentPath === '/' ? '' : currentPath);
            window.location.href = newPath;
        } else if (lang === 'zh' && isEnglish) {
            // 切换到中文版本
            const newPath = currentPath.replace('/en/', '/');
            window.location.href = newPath === '/en' ? '/' : newPath;
        }

        this.updateLanguageSwitcher(lang);
    },

    updateLanguageSwitcher: function(lang) {
        const switcher = document.querySelector('.language-switcher');
        if (switcher) {
            switcher.querySelectorAll('.lang-option').forEach(option => {
                option.classList.remove('active');
                if (option.dataset.lang === lang) {
                    option.classList.add('active');
                }
            });
        }
    },

    init: function() {
        const userLang = this.detectUserLanguage();
        this.updateLanguageSwitcher(userLang);

        // 绑定语言切换器事件
        this.bindLanguageSwitcherEvents();

        // 检查当前页面语言是否与用户偏好匹配
        const currentLang = document.documentElement.lang;
        if (userLang !== currentLang && currentLang !== 'undefined') {
            // 页面已经根据URL正确加载，只需更新UI状态
            this.updateLanguageSwitcher(currentLang);
        }
    },

    bindLanguageSwitcherEvents: function() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('lang-option')) {
                e.preventDefault();
                const lang = e.target.dataset.lang;
                this.switchLanguage(lang);
            }
        });
    }
};

document.addEventListener('DOMContentLoaded', function() {
    LanguageManager.init();
});

window.LanguageManager = LanguageManager;