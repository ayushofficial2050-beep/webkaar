/**
 * WebKaar - Professional Web Application
 * Main Logic Controller (Final V7.0 - Lag Free + Auto Slide Fixed)
 * @author Ayush Tiwari
 */

'use strict';

/* ==========================================================================
   1. INTERNAL DATA (TOOLS DATABASE)
   ========================================================================== */

const APP_CONFIG = {
    version: '7.0.0',
    localStorageKeys: { theme: 'webkaar_theme_pref' },
    searchDebounce: 250,
    sliderInterval: 3000 // 3 Seconds Auto Slide Speed
};

const TOOLS_DB = [
    // --- 1. IMAGE TOOLS ---
    { id: 'image-compressor', title: 'Image Compressor', category: 'design', desc: 'Reduce file size instantly', tags: ['photo', 'jpg', 'png', 'reduce'], url: 'tools/image-compressor/index.html', featured: true, badge: 'hot' },
    { id: 'image-resizer', title: 'Image Resizer', category: 'design', desc: 'Resize images to dimensions', tags: ['photo', 'scale', 'dimension'], url: 'tools/image-resizer/index.html', featured: true, badge: null },
    { id: 'img-to-pdf', title: 'Image to PDF', category: 'converter', desc: 'Convert JPG/PNG to PDF', tags: ['photo', 'document', 'convert'], url: 'tools/img-to-pdf/index.html', featured: false, badge: 'hot' },
    { id: 'aspect-ratio', title: 'Aspect Ratio Calc', category: 'design', desc: 'Calculate dimensions based on ratio', tags: ['screen', 'width', 'scale'], url: 'tools/aspect-ratio/index.html', featured: false, badge: null },
    { id: 'color-picker', title: 'Color Picker', category: 'design', desc: 'Get HEX, RGB, HSL codes', tags: ['palette', 'paint', 'css'], url: 'tools/color-picker/index.html', featured: true, badge: null },
    { id: 'gradient-generator', title: 'Gradient Generator', category: 'design', desc: 'Create CSS gradients', tags: ['css', 'color', 'background'], url: 'tools/gradient-generator/index.html', featured: true, badge: 'new' },

    // --- 2. UTILITY & TEXT ---
    { id: 'speed-test', title: 'Internet Speed Test', category: 'utility', desc: 'Check internet speed', tags: ['speed', 'internet', 'wifi'], url: 'tools/speed-test/index.html', featured: true, badge: 'hot' },
    { id: 'typing-test', title: 'Typing Speed Test', category: 'utility', desc: 'Check typing WPM', tags: ['typing', 'speed', 'game'], url: 'tools/typing-test/index.html', featured: true, badge: 'hot' },
    { id: 'signature-generator', title: 'Signature Generator', category: 'utility', desc: 'Draw digital signatures', tags: ['sign', 'draw', 'pdf'], url: 'tools/signature-generator/index.html', featured: true, badge: 'new' },
    { id: 'qr-generator', title: 'QR Code Generator', category: 'utility', desc: 'Create custom QR codes', tags: ['barcode', 'scan', 'link'], url: 'tools/qr-generator/index.html', featured: true, badge: 'hot' },
    { id: 'password-gen', title: 'Password Generator', category: 'utility', desc: 'Generate strong passwords', tags: ['security', 'lock', 'privacy'], url: 'tools/password-gen/index.html', featured: true, badge: 'hot' },
    { id: 'stopwatch', title: 'Stopwatch', category: 'utility', desc: 'Online stopwatch with laps', tags: ['time', 'clock', 'timer'], url: 'tools/stopwatch/index.html', featured: true, badge: null },
    { id: 'word-counter', title: 'Word Counter', category: 'utility', desc: 'Count words and chars', tags: ['text', 'write', 'seo'], url: 'tools/word-counter/index.html', featured: true, badge: null },
    { id: 'my-ip', title: 'What is My IP', category: 'utility', desc: 'Check public IP address', tags: ['network', 'address', 'wifi'], url: 'tools/my-ip/index.html', featured: false, badge: null },
    { id: 'unit-converter', title: 'Unit Converter', category: 'converter', desc: 'Convert length, weight', tags: ['math', 'measure', 'metric'], url: 'tools/unit-converter/index.html', featured: true, badge: null },
    { id: 'bmi-calculator', title: 'BMI Calculator', category: 'utility', desc: 'Calculate Body Mass Index', tags: ['health', 'weight', 'medical'], url: 'tools/bmi-calculator/index.html', featured: false, badge: null },
    { id: 'duplicate-remover', title: 'Duplicate Remover', category: 'text', desc: 'Remove duplicate lines', tags: ['text', 'clean', 'list'], url: 'tools/duplicate-remover/index.html', featured: false, badge: 'new' },
    { id: 'text-diff', title: 'Text Diff Checker', category: 'utility', desc: 'Compare two texts', tags: ['compare', 'difference', 'git'], url: 'tools/text-diff/index.html', featured: false, badge: null },
    { id: 'lorem-ipsum', title: 'Lorem Ipsum', category: 'utility', desc: 'Generate dummy text', tags: ['dummy', 'text', 'design'], url: 'tools/lorem-ipsum/index.html', featured: false, badge: null },
    { id: 'case-converter', title: 'Case Converter', category: 'utility', desc: 'Convert text case', tags: ['text', 'caps', 'format'], url: 'tools/case-converter/index.html', featured: false, badge: null },
    { id: 'markdown-editor', title: 'Markdown Editor', category: 'utility', desc: 'Write and preview Markdown', tags: ['md', 'write', 'preview'], url: 'tools/markdown-editor/index.html', featured: false, badge: null },
    { id: 'steganography', title: 'Secret Hider', category: 'utility', desc: 'Hide text in images', tags: ['spy', 'secret', 'image'], url: 'tools/steganography/index.html', featured: true, badge: 'hot' },

    // --- 3. PDF TOOLS ---
    { id: 'pdf-compressor', title: 'PDF Compressor', category: 'utility', desc: 'Reduce PDF file size', tags: ['pdf', 'compress', 'size'], url: 'tools/pdf-compressor/index.html', featured: true, badge: 'new' },
    { id: 'pdf-merger', title: 'PDF Merger', category: 'utility', desc: 'Combine PDFs', tags: ['document', 'combine', 'join'], url: 'tools/pdf-merger/index.html', featured: false, badge: 'hot' },

    // --- 4. DEV TOOLS ---
    { id: 'json-formatter', title: 'JSON Formatter', category: 'dev', desc: 'Beautify & minify JSON', tags: ['code', 'developer', 'json'], url: 'tools/json-formatter/index.html', featured: true, badge: 'hot' },
    { id: 'base64', title: 'Base64 Tool', category: 'dev', desc: 'Encode/Decode Base64', tags: ['decoder', 'encoder', 'text'], url: 'tools/base64/index.html', featured: false, badge: null },
    { id: 'url-encoder', title: 'URL Encoder', category: 'dev', desc: 'Encode/Decode URLs', tags: ['link', 'escape', 'web'], url: 'tools/url-encoder/index.html', featured: false, badge: null },
    { id: 'css-minifier', title: 'CSS Minifier', category: 'dev', desc: 'Minify CSS code', tags: ['style', 'optimize', 'web'], url: 'tools/css-minifier/index.html', featured: false, badge: null },
    { id: 'html-formatter', title: 'HTML Formatter', category: 'dev', desc: 'Beautify HTML code', tags: ['markup', 'web', 'clean'], url: 'tools/html-formatter/index.html', featured: false, badge: null },
    { id: 'uuid-generator', title: 'UUID Generator', category: 'dev', desc: 'Generate unique UUIDs', tags: ['guid', 'id', 'unique'], url: 'tools/uuid-generator/index.html', featured: false, badge: null },
    { id: 'unix-time', title: 'Unix Timestamp', category: 'dev', desc: 'Convert Unix time', tags: ['date', 'epoch', 'time'], url: 'tools/unix-time/index.html', featured: false, badge: null },
// --- VIDEO TOOLS (Add New) ---
    { 
        id: 'video-compressor', 
        title: 'Video Compressor', 
        category: 'converter', 
        desc: 'Reduce video size efficiently (MP4/MOV)', 
        tags: ['video', 'mp4', 'compress', 'size', 'reduce'], 
        url: 'tools/video-compressor/index.html', 
        featured: true, 
        badge: 'new' 
    }
];

/* ==========================================================================
   2. ICON REPOSITORY
   ========================================================================== */
const ICON_LIBRARY = {
    'default': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>',
    'image-compressor': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>',
    'image-resizer': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h6v6"></path><path d="M9 21H3v-6"></path><path d="M21 3l-7 7"></path><path d="M3 21l7-7"></path></svg>',
    'img-to-pdf': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>',
    'qr-generator': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>',
    'password-gen': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>',
    'stopwatch': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>',
    'word-counter': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>',
    'my-ip': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10z"></path></svg>',
    'unit-converter': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16v5h-5"></path><path d="M4 20L21 3"></path><path d="M15 15l-5 5"></path><path d="M4 4l5 5"></path></svg>',
    'bmi-calculator': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>',
    'pdf-merger': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><path d="M14 2v6h6"></path><path d="M10 13l2 2 2-2"></path><line x1="12" y1="15" x2="12" y2="9"></line></svg>',
    'text-diff': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>',
    'lorem-ipsum': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>',
    'case-converter': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 7 4 4 20 4 20 7"></polyline><line x1="9" y1="20" x2="15" y2="20"></line><line x1="12" y1="4" x2="12" y2="20"></line></svg>',
    'markdown-editor': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19l7-7 3 3-7 7-3-3z"></path><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path></svg>',
    'json-formatter': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>',
    'base64': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>',
    'url-encoder': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>',
    'css-minifier': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 18l6-6-6-6"></path><path d="M8 6l-6 6 6 6"></path></svg>',
    'html-formatter': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>',
    'uuid-generator': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>',
    'unix-time': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>',
    'color-picker': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg>',
    'aspect-ratio': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
    'pdf-compressor': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 14 10 14 10 20"></polyline><polyline points="20 10 14 10 14 4"></polyline><line x1="14" y1="10" x2="21" y2="3"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>',
    'gradient-generator': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="21" x2="21" y2="3"></line></svg>',
    'duplicate-remover': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>',
    'speed-test': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12A10 10 0 0 0 12 2v10zM2 12a10 10 0 0 1 10-10v10z"></path><path d="M12 22a10 10 0 0 0 10-10H2a10 10 0 0 0 10 10z"></path></svg>',
    'typing-test': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="12" rx="2"></rect><path d="M6 16v4"></path><path d="M10 16v4"></path><path d="M14 16v4"></path><path d="M18 16v4"></path><path d="M2 20h20"></path></svg>',
    'signature-generator': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 3l5 5L8 21H3v-5L16 3z"></path><path d="M12 18l-4 4"></path><path d="M20 22h-6"></path></svg>',
    'steganography': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12l5 5L22 3"></path><path d="M12 17a5 5 0 0 0-5-5"></path><path d="M12 7a5 5 0 0 1 5 5"></path></svg>',
'video-compressor': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="2" y1="7" x2="7" y2="7"></line><line x1="2" y1="17" x2="7" y2="17"></line><line x1="17" y1="17" x2="22" y2="17"></line><line x1="17" y1="7" x2="22" y2="7"></line></svg>'
};

/* ==========================================================================
   3. RENDER ENGINE (OPTIMIZED)
   ========================================================================== */

const RenderManager = {
    BATCH_SIZE: 12,
    currentIndex: 0,
    activeFilter: 'all',

    init() {
        this.resetGrid();
    },

    resetGrid() {
        const grid = document.getElementById('tools-grid');
        const loadMore = document.querySelector('.load-more-wrapper');
        
        if (grid) grid.innerHTML = '';
        this.currentIndex = 0;
        
        if (loadMore) loadMore.style.display = 'flex';
        this.loadNextBatch();
    },

    getFilteredTools() {
        if (!TOOLS_DB) return [];
        if (this.activeFilter === 'all') return TOOLS_DB;
        if (this.activeFilter === 'most-used') return TOOLS_DB.filter(t => t.featured);
        return TOOLS_DB.filter(t => t.category === this.activeFilter);
    },

    loadNextBatch() {
        const grid = document.getElementById('tools-grid');
        const loadMoreBtn = document.getElementById('show-more-tools');
        
        if (!grid) return;

        const allTools = this.getFilteredTools();
        const total = allTools.length;
        const nextBatch = allTools.slice(this.currentIndex, this.currentIndex + this.BATCH_SIZE);

        const fragment = document.createDocumentFragment();

        nextBatch.forEach(tool => {
            const cardHTML = this.createCard(tool);
            fragment.appendChild(cardHTML);
        });

        grid.appendChild(fragment);
        this.currentIndex += this.BATCH_SIZE;

        if (loadMoreBtn) {
            if (this.currentIndex < total) {
                loadMoreBtn.style.display = 'block';
                loadMoreBtn.textContent = 'Load More Tools';
                loadMoreBtn.disabled = false;
            } else {
                loadMoreBtn.style.display = 'none';
            }
        }
    },

    createCard(tool) {
        const link = document.createElement('a');
        link.href = tool.url;
        link.className = 'tool-card';
        link.dataset.category = tool.category;
        
        const bgClass = this.getIconColor(tool.category);
        let iconSVG = ICON_LIBRARY[tool.id] || ICON_LIBRARY['default'];

        let badgeHTML = '';
        if (tool.badge) {
            badgeHTML = `<span class="new-badge badge-${tool.badge}">${tool.badge.toUpperCase()}</span>`;
        }

        link.innerHTML = `
            <div class="tool-icon ${bgClass}">
                ${iconSVG}
                ${badgeHTML}
            </div>
            <div class="tool-meta">
                <h3>${tool.title}</h3>
                <span class="category-label">${this.capitalize(tool.category)}</span>
            </div>
        `;
        return link;
    },

    getIconColor(category) {
        const colors = {
            'design': 'purple-bg', 'dev': 'dark-blue-bg', 'utility': 'green-bg',
            'converter': 'orange-bg', 'text': 'red-bg', 'pdf': 'red-bg', 'health': 'blue-bg'
        };
        return colors[category] || 'blue-bg';
    },

    capitalize(str) {
        if(!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
};

/* ==========================================================================
   4. THEME CONTROLLER
   ========================================================================== */

const ThemeManager = {
    init() {
        const themeToggle = document.getElementById('theme-toggle');
        const savedTheme = localStorage.getItem(APP_CONFIG.localStorageKeys.theme);
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (savedTheme === 'dark' || (!savedTheme && systemDark)) {
            this.enableDarkMode();
        } else {
            this.enableLightMode();
        }

        if (themeToggle) {
            themeToggle.addEventListener('change', (e) => {
                if (e.target.checked) this.enableDarkMode();
                else this.enableLightMode();
            });
        }
    },

    enableDarkMode() {
        document.body.classList.add('dark-mode');
        document.body.classList.remove('light-mode');
        const toggle = document.getElementById('theme-toggle');
        if (toggle) toggle.checked = true;
        document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#0f172a');
        localStorage.setItem(APP_CONFIG.localStorageKeys.theme, 'dark');
    },

    enableLightMode() {
        document.body.classList.remove('dark-mode');
        document.body.classList.add('light-mode');
        const toggle = document.getElementById('theme-toggle');
        if (toggle) toggle.checked = false;
        document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#ffffff');
        localStorage.setItem(APP_CONFIG.localStorageKeys.theme, 'light');
    }
};

/* ==========================================================================
   5. NAVIGATION CONTROLLER
   ========================================================================== */

const NavManager = {
    init() {
        const btnOpen = document.getElementById('open-sidebar-btn');
        const btnClose = document.getElementById('close-sidebar-btn');
        const overlay = document.getElementById('app-overlay');

        if (btnOpen) btnOpen.addEventListener('click', () => this.toggleSidebar(true));
        if (btnClose) btnClose.addEventListener('click', () => this.toggleSidebar(false));
        if (overlay) overlay.addEventListener('click', () => this.toggleSidebar(false));
    },

    toggleSidebar(show) {
        const sidebar = document.getElementById('sidebar-drawer');
        const overlay = document.getElementById('app-overlay');
        
        if (show) {
            sidebar.classList.add('active');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        } else {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    }
};

/* ==========================================================================
   6. SEARCH ENGINE
   ========================================================================== */

const SearchManager = {
    debounceTimer: null,

    init() {
        const input = document.getElementById('tool-search');
        const clearBtn = document.getElementById('clear-search');

        if (input) {
            input.addEventListener('input', (e) => this.handleInput(e.target.value));
        }
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                input.value = '';
                this.handleInput('');
            });
        }
    },

    handleInput(query) {
        const clearBtn = document.getElementById('clear-search');
        if (clearBtn) {
            if (query.length > 0) clearBtn.classList.remove('hidden');
            else clearBtn.classList.add('hidden');
        }

        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            this.executeSearch(query.toLowerCase().trim());
        }, APP_CONFIG.searchDebounce);
    },

    executeSearch(query) {
        const loadMore = document.querySelector('.load-more-wrapper');
        const grid = document.getElementById('tools-grid');

        if (query === '') {
            RenderManager.resetGrid();
            return;
        }

        if (loadMore) loadMore.style.display = 'none';
        if (grid) grid.innerHTML = '';
        
        const fragment = document.createDocumentFragment();
        let visibleCount = 0;
        
        TOOLS_DB.forEach(tool => {
            const match = tool.title.toLowerCase().includes(query) || tool.category.includes(query) || tool.tags.join(' ').includes(query);
            if (match) {
                fragment.appendChild(RenderManager.createCard(tool));
                visibleCount++;
            }
        });

        if(visibleCount === 0) {
            const msg = document.createElement('div');
            msg.style.cssText = 'text-align:center; padding:40px; grid-column:1/-1; color:var(--text-muted);';
            msg.innerHTML = `<p>No tools found matching "${query}".</p>`;
            grid.appendChild(msg);
        } else {
            grid.appendChild(fragment);
        }
    }
};

/* ==========================================================================
   7. CATEGORY FILTER
   ========================================================================== */

const CategoryManager = {
    init() {
        const tabs = document.querySelectorAll('.tab-chip');
        const searchInput = document.getElementById('tool-search');
        const clearBtn = document.getElementById('clear-search');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                if (searchInput && searchInput.value !== '') {
                    searchInput.value = '';
                    if(clearBtn) clearBtn.classList.add('hidden');
                }

                RenderManager.activeFilter = tab.dataset.filter;
                RenderManager.resetGrid();
            });
        });
    }
};

/* ==========================================================================
   8. HERO SLIDER LOGIC (AUTO SLIDE ENABLED)
   ========================================================================== */

const SliderManager = {
    slider: null,
    interval: null,
    isPaused: false,

    init() {
        this.slider = document.getElementById('hero-slider');
        if (!this.slider) return;

        this.startAutoScroll();

        // Touch interactions (Pause on hold)
        this.slider.addEventListener('touchstart', () => this.pauseScroll());
        this.slider.addEventListener('mousedown', () => this.pauseScroll());
        
        // Resume on release
        this.slider.addEventListener('touchend', () => this.resumeScroll());
        this.slider.addEventListener('mouseup', () => this.resumeScroll());
    },

    startAutoScroll() {
        // Clear any existing interval to prevent double-speed
        if (this.interval) clearInterval(this.interval);
        
        this.interval = setInterval(() => {
            if (!this.isPaused && this.slider) {
                this.scrollNext();
            }
        }, APP_CONFIG.sliderInterval);
    },

    scrollNext() {
        if (!this.slider) return;
        
        // Calculate scroll amount based on card width + gap
        // We look for the first card to get accurate width
        const card = this.slider.querySelector('.hero-card');
        if(!card) return;
        
        // Card width + Gap (16px from CSS)
        const scrollAmount = card.offsetWidth + 16; 
        const maxScroll = this.slider.scrollWidth - this.slider.clientWidth;

        // Reset to start if we reached the end
        if (this.slider.scrollLeft >= maxScroll - 20) {
            this.slider.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
            this.slider.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    },

    pauseScroll() {
        this.isPaused = true;
        if (this.interval) clearInterval(this.interval);
    },

    resumeScroll() {
        // Delay resume slightly to avoid jumpy behavior
        setTimeout(() => {
            this.isPaused = false;
            this.startAutoScroll();
        }, 500); // 0.5s delay before resuming
    }
};

/* ==========================================================================
   9. INTRO SPLASH CONTROLLER
   ========================================================================== */

const IntroManager = {
    init() {
        if (sessionStorage.getItem('intro_shown')) {
            const overlay = document.getElementById('intro-overlay');
            if(overlay) overlay.remove(); 
            return;
        }

        setTimeout(() => {
            this.startIntro();
        }, 800);
    },

    startIntro() {
        const overlay = document.getElementById('intro-overlay');
        const video = document.getElementById('intro-video');
        const skipBtn = document.getElementById('skip-intro-btn');
        const unmuteBtn = document.getElementById('unmute-btn');

        if (!overlay || !video) return;

        overlay.classList.remove('overlay-hidden');
        overlay.classList.add('overlay-visible');

        video.muted = true;
        video.currentTime = 0;
        video.style.pointerEvents = 'none'; 
        video.play().catch(e => console.warn("Autoplay blocked", e));

        if(unmuteBtn) {
            unmuteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                video.muted = false;
                video.volume = 1.0;
                unmuteBtn.innerHTML = `<span>Sound On</span>`;
                unmuteBtn.style.backgroundColor = 'rgba(37, 99, 235, 0.9)';
            });
        }

        this.closeIntro = () => {
            overlay.classList.remove('overlay-visible');
            overlay.classList.add('overlay-hidden');
            setTimeout(() => {
                video.pause();
                sessionStorage.setItem('intro_shown', 'true');
                overlay.remove(); 
            }, 500);
        };

        if(skipBtn) skipBtn.addEventListener('click', (e) => { e.stopPropagation(); this.closeIntro(); });
        video.addEventListener('ended', () => this.closeIntro());
    }
};

// Load More Button
const ContentLoader = {
    init() {
        const btn = document.getElementById('show-more-tools');
        if (btn) {
            btn.addEventListener('click', () => {
                btn.textContent = 'Loading...';
                btn.disabled = true;
                setTimeout(() => {
                    RenderManager.loadNextBatch();
                    btn.textContent = 'Load More Tools';
                    btn.disabled = false;
                }, 300);
            });
        }
    }
};

/* ==========================================================================
   10. APP INIT
   ========================================================================== */

const WebKaarApp = {
    init() {
        console.log(`%c WebKaar v${APP_CONFIG.version} - Loaded`, 'color: #2563eb; font-weight: bold;');
        
        ThemeManager.init();
        RenderManager.init();
        NavManager.init();
        SearchManager.init();
        CategoryManager.init();
        
        // Critical for Auto-Slide
        SliderManager.init(); 
        
        ContentLoader.init();
        IntroManager.init(); 
        
        document.body.classList.add('loaded');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    WebKaarApp.init();
});
