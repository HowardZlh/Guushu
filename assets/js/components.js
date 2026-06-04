// Reusable component functions using tagged template literals
// Dependencies: template-engine.js (must be loaded before this file in browser)

(function () {
    'use strict';

    // Load template engine (browser or Node.js)
    const TE = (typeof window !== 'undefined' && window.TemplateEngine)
        ? window.TemplateEngine
        : require('../assets/js/template-engine');
    const { html, safeHtml } = TE;

    /**
     * Translation helper
     * @param {string} key - Translation key
     * @param {string} fallbackZh - Chinese fallback
     * @param {string} [fallbackEn] - English fallback
     * @returns {string}
     */
    function t(key, fallbackZh, fallbackEn) {
        if (typeof document !== 'undefined' && document.documentElement) {
            const lang = document.documentElement.lang || 'zh';
            if (lang === 'en' && fallbackEn !== undefined) return fallbackEn;
        }
        return fallbackZh;
    }

    const Components = {
        // Create fashion card
        createFashionCard({ title = '', description = '', image = '', link = '#', tags = [] } = {}) {
            const tagsHtml = safeHtml(tags.map(tag => html`<span class="tag">${tag}</span>`).join(''));

            return safeHtml(html`
                <div class="fashion-card">
                    ${image ? html`<img src="${image}" alt="${title}" loading="lazy" onerror="this.style.display='none'">` : ''}
                    <div class="fashion-card-content">
                        <h3>${title}</h3>
                        <p>${description}</p>
                        ${tags.length ? safeHtml(html`<div class="card-tags">${tagsHtml}</div>`) : ''}
                        <a href="${link}" class="btn btn-outline" data-i18n="cta.learn_more">${t('cta.learn_more', '了解更多', 'Learn More')}</a>
                    </div>
                </div>
            `);
        },

        // Create trend item
        createTrendItem({ title = '', description = '', season = '', growth = '' } = {}) {
            const growthHtml = growth
                ? safeHtml(html`<strong>${t('trend.growth', '增长：', 'Growth: ')}</strong> ${growth}`)
                : '';

            return safeHtml(html`
                <div class="trend-item">
                    <h3>${title}</h3>
                    <p>${description}</p>
                    <small><strong>${t('trend.season', '季节：', 'Season: ')}</strong> ${season} ${growthHtml}</small>
                </div>
            `);
        },

        // Create newsletter form
        createNewsletterForm({ lang = 'zh' } = {}) {
            const isEn = lang === 'en';
            const heading = isEn ? 'Subscribe to Fashion News' : '订阅时尚资讯';
            const subtext = isEn ? 'Get the latest trends and exclusive offers' : '获取最新的时尚趋势和独家优惠';
            const placeholder = isEn ? 'Enter your email' : '请输入您的邮箱';
            const btnText = isEn ? 'Subscribe' : '订阅';

            return safeHtml(html`
                <div class="newsletter-section">
                    <h3>${heading}</h3>
                    <p>${subtext}</p>
                    <form class="newsletter-form">
                        <input type="email" placeholder="${placeholder}" required>
                        <button type="submit" class="btn">${btnText}</button>
                    </form>
                </div>
            `);
        },

        // Create pagination
        createPagination({ currentPage = 1, totalPages = 1, baseUrl = '/' } = {}) {
            const prevText = t('pagination.prev', '上一页', 'Previous');
            const nextText = t('pagination.next', '下一页', 'Next');
            const infoText = t('pagination.info',
                `第 ${currentPage} 页，共 ${totalPages} 页`,
                `Page ${currentPage} of ${totalPages}`
            );

            return safeHtml(html`
                <div class="pagination">
                    ${currentPage > 1 ? html`<a href="${baseUrl}page${currentPage - 1}/" class="pagination-link">${prevText}</a>` : ''}
                    <span class="pagination-info">${infoText}</span>
                    ${currentPage < totalPages ? html`<a href="${baseUrl}page${currentPage + 1}/" class="pagination-link">${nextText}</a>` : ''}
                </div>
            `);
        },

        // Create loading spinner
        createLoadingSpinner({ lang = 'zh' } = {}) {
            const text = lang === 'en' ? 'Loading...' : '加载中...';
            return safeHtml(html`
                <div class="loading-spinner">
                    <div class="spinner"></div>
                    <p>${text}</p>
                </div>
            `);
        },

        // Create modal
        createModal({ id = '', title = '', content = '' } = {}) {
            return safeHtml(html`
                <div id="${id}" class="modal">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>${title}</h3>
                            <button class="modal-close" onclick="Components.closeModal('${id}')">&times;</button>
                        </div>
                        <div class="modal-body">
                            ${safeHtml(content)}
                        </div>
                    </div>
                </div>
            `);
        },

        // Close modal helper
        closeModal(id) {
            if (typeof document !== 'undefined') {
                const modal = document.getElementById(id);
                if (modal) modal.style.display = 'none';
            }
        },

        // Create search results
        createSearchResults({ results = [], query = '' } = {}) {
            if (results.length === 0) {
                const prefix = t('search.no_results_prefix', '未找到与', 'No results found for');
                const suffix = t('search.no_results_suffix', '相关的内容', '');
                return safeHtml(html`
                    <div class="search-no-results">
                        <p>${prefix} "${query}" ${suffix}</p>
                    </div>
                `);
            }

            const resultItems = safeHtml(results.map(result => html`
                <div class="search-result-item">
                    <h4><a href="${result.url}">${result.title}</a></h4>
                    <p>${result.excerpt}</p>
                </div>
            `).join(''));

            return safeHtml(html`
                <div class="search-results-list">
                    ${resultItems}
                </div>
            `);
        },

        // Initialize components
        init() {
            console.log('Components initialized');
        }
    };

    // Search functionality
    function performSearch(query) {
        // 模拟搜索功能 - 实际项目中应替换为真实搜索 API
        const mockResults = [
            {
                title: '波西米亚风复兴',
                url: '/fashion-news/index.html#boho',
                excerpt: '麂皮纹理和飘逸廓形正在2025春夏系列中掀起一场时尚革命...'
            },
            {
                title: '黄色调美学',
                url: '/fashion-news/index.html#yellow',
                excerpt: '从柔和的香草黄到浓郁的藏红花黄，黄色正在主导2025年时尚...'
            }
        ];

        if (typeof document !== 'undefined') {
            const searchResults = document.querySelector('.search-results');
            if (searchResults) {
                searchResults.innerHTML = String(Components.createSearchResults({ results: mockResults, query }));
                searchResults.style.display = 'block';
            }
        }
    }

    // Expose to global scope
    if (typeof window !== 'undefined') {
        window.Components = Components;
        window.performSearch = performSearch;
    }

    // Node.js compatibility for tests
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { Components, performSearch };
    }
})();
