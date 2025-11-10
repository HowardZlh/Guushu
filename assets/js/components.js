// Reusable component functions
const Components = {
    // Create fashion card
    createFashionCard: function(title, description, image, link, tags = []) {
        const tagsHtml = tags.map(tag => `<span class="tag">${tag}</span>`).join('');

        return `
            <div class="fashion-card">
                <img src="${image}" alt="${title}" loading="lazy">
                <div class="fashion-card-content">
                    <h3>${title}</h3>
                    <p>${description}</p>
                    ${tagsHtml ? `<div class="card-tags">${tagsHtml}</div>` : ''}
                    <a href="${link}" class="btn btn-outline">了解更多</a>
                </div>
            </div>
        `;
    },

    // Create trend item
    createTrendItem: function(title, description, season, growth = '') {
        const growthHtml = growth ? `<strong>增长：</strong> ${growth}` : '';

        return `
            <div class="trend-item">
                <h3>${title}</h3>
                <p>${description}</p>
                <small><strong>季节：</strong> ${season} ${growthHtml}</small>
            </div>
        `;
    },

    // Create newsletter form
    createNewsletterForm: function() {
        return `
            <div class="newsletter-section">
                <h3>订阅时尚资讯</h3>
                <p>获取最新的时尚趋势和独家优惠</p>
                <form class="newsletter-form">
                    <input type="email" placeholder="请输入您的邮箱" required>
                    <button type="submit" class="btn">订阅</button>
                </form>
            </div>
        `;
    },

    // Create pagination
    createPagination: function(currentPage, totalPages, baseUrl) {
        let html = '<div class="pagination">';

        if (currentPage > 1) {
            html += `<a href="${baseUrl}page${currentPage - 1}/" class="pagination-link">上一页</a>`;
        }

        html += `<span class="pagination-info">第 ${currentPage} 页，共 ${totalPages} 页</span>`;

        if (currentPage < totalPages) {
            html += `<a href="${baseUrl}page${currentPage + 1}/" class="pagination-link">下一页</a>`;
        }

        html += '</div>';
        return html;
    },

    // Create loading spinner
    createLoadingSpinner: function() {
        return `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>加载中...</p>
            </div>
        `;
    },

    // Create modal
    createModal: function(id, title, content) {
        return `
            <div id="${id}" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>${title}</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        ${content}
                    </div>
                </div>
            </div>
        `;
    },

    // Create search results
    createSearchResults: function(results, query) {
        if (results.length === 0) {
            return `
                <div class="search-no-results">
                    <p>未找到与 "${query}" 相关的内容</p>
                </div>
            `;
        }

        let html = '<div class="search-results-list">';
        results.forEach(result => {
            html += `
                <div class="search-result-item">
                    <h4><a href="${result.url}">${result.title}</a></h4>
                    <p>${result.excerpt}</p>
                </div>
            `;
        });
        html += '</div>';
        return html;
    },

    // Initialize components
    init: function() {
        console.log('Components initialized');
    }
};

// Search functionality
function performSearch(query) {
    // 模拟搜索功能
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

    const searchResults = document.querySelector('.search-results');
    if (searchResults) {
        searchResults.innerHTML = Components.createSearchResults(mockResults, query);
        searchResults.style.display = 'block';
    }
}

// CSS for components
const componentStyles = `
    .card-tags {
        margin: 1rem 0;
    }

    .tag {
        display: inline-block;
        background: var(--secondary-color);
        padding: 0.25rem 0.5rem;
        border-radius: 12px;
        font-size: 0.75rem;
        margin-right: 0.5rem;
        margin-bottom: 0.5rem;
    }

    .newsletter-section {
        background: var(--secondary-color);
        padding: 2rem;
        border-radius: 8px;
        text-align: center;
        margin: 2rem 0;

        h3 {
            margin-bottom: 0.5rem;
        }

        p {
            margin-bottom: 1.5rem;
        }

        .newsletter-form {
            display: flex;
            gap: 1rem;
            max-width: 400px;
            margin: 0 auto;

            input {
                flex: 1;
                padding: 0.75rem;
                border: 1px solid var(--border-color);
                border-radius: 4px;
                font-size: 1rem;
            }

            button {
                flex-shrink: 0;
            }
        }
    }

    .loading-spinner {
        text-align: center;
        padding: 2rem;

        .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid var(--border-color);
            border-top: 4px solid var(--accent-color);
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 1rem;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    }

    .modal {
        display: none;
        position: fixed;
        z-index: 2000;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);

        .modal-content {
            background: white;
            margin: 10% auto;
            padding: 0;
            border-radius: 8px;
            width: 90%;
            max-width: 500px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }

        .modal-header {
            padding: 1rem 1.5rem;
            border-bottom: 1px solid var(--border-color);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .modal-body {
            padding: 1.5rem;
        }

        .modal-close {
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: var(--text-light);
        }
    }

    .search-results {
        background: white;
        border: 1px solid var(--border-color);
        border-radius: 8px;
        margin-top: 1rem;
        display: none;

        .search-results-list {
            padding: 1rem;
        }

        .search-result-item {
            padding: 1rem 0;
            border-bottom: 1px solid var(--border-color);

            &:last-child {
                border-bottom: none;
            }

            h4 {
                margin-bottom: 0.5rem;

                a {
                    color: var(--primary-color);
                }
            }

            p {
                color: var(--text-light);
                font-size: 0.9rem;
                margin: 0;
            }
        }

        .search-no-results {
            padding: 2rem;
            text-align: center;
            color: var(--text-light);
        }
    }
`;

// 添加组件样式
document.head.insertAdjacentHTML('beforeend', `<style>${componentStyles}</style>`);

// 导出供其他脚本使用
window.Components = Components;