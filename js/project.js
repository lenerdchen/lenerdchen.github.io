// ==================== Project Page Loader ====================

let cachedProjectData = null;
let currentProjectSlug = null;

document.addEventListener('DOMContentLoaded', async () => {
    // Get project slug from URL
    const urlParams = new URLSearchParams(window.location.search);
    currentProjectSlug = urlParams.get('project');
    
    if (!currentProjectSlug) {
        showError('No project specified');
        return;
    }
    
    await loadProject();
    
    // Setup email copy functionality (same as main.js)
    setupEmailCopy();
    
    // Update footer year
    updateFooterYear();
    
    // Setup password modal
    setupPasswordModal();
});

async function loadProject(password = null) {
    try {
        // Fetch project data
        const response = await fetch(`data/projects/${currentProjectSlug}.json`);
        
        if (!response.ok) {
            throw new Error('Project not found');
        }
        
        const rawData = await response.text();
        
        // Try to parse as JSON first
        try {
            const projectData = JSON.parse(rawData);
            // If it parses successfully and has expected structure, it's not encrypted
            if (projectData.title && projectData.sections) {
                cachedProjectData = projectData;
                renderProject(projectData);
                return;
            }
        } catch (e) {
            // Not valid JSON, might be encrypted
        }
        
        // If we get here, it might be encrypted
        // Check if it looks like encrypted data (starts with "U2FsdGVkX1" which is CryptoJS encrypted format)
        if (rawData.trim().startsWith('"U2FsdGVkX1') || rawData.trim().startsWith('U2FsdGVkX1')) {
            // It's encrypted, show password modal if we don't have a password yet
            if (!password) {
                showPasswordModal();
                return;
            }
            
            // Try to decrypt with provided password
            try {
                const decryptedStr = CryptoJS.AES.decrypt(rawData.replace(/^"|"$/g, ''), password).toString(CryptoJS.enc.Utf8);
                
                if (!decryptedStr) {
                    throw new Error('Decryption failed');
                }
                
                const projectData = JSON.parse(decryptedStr);
                cachedProjectData = projectData;
                hidePasswordModal();
                renderProject(projectData);
            } catch (decryptError) {
                console.error('Decryption error:', decryptError);
                showPasswordError();
            }
        } else {
            // Try parsing one more time as regular JSON
            const projectData = JSON.parse(rawData);
            cachedProjectData = projectData;
            renderProject(projectData);
        }
        
    } catch (error) {
        console.error('Error loading project:', error);
        showError('Project not found. Please check the URL and try again.');
    }
}

function setupPasswordModal() {
    const form = document.getElementById('password-form');
    const input = document.getElementById('password-input');
    const cancelBtn = document.getElementById('password-cancel');
    
    if (form && input) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const password = input.value;
            
            // Validate password is not empty
            if (!password) {
                showPasswordError();
                return;
            }
            
            // Hide any previous errors
            hidePasswordError();
            
            // Try to load with this password
            await loadProject(password);
        });
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            // Redirect to home page
            window.location.href = './';
        });
    }
}

function showPasswordModal() {
    const modal = document.getElementById('password-modal');
    if (modal) {
        modal.classList.add('active');
        // Focus on input
        const input = document.getElementById('password-input');
        if (input) {
            setTimeout(() => input.focus(), 100);
        }
    }
}

function hidePasswordModal() {
    const modal = document.getElementById('password-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function showPasswordError() {
    const error = document.getElementById('password-error');
    if (error) {
        error.classList.add('active');
    }
}

function hidePasswordError() {
    const error = document.getElementById('password-error');
    if (error) {
        error.classList.remove('active');
    }
}

function renderProject(data) {
    // Render title and summary
    document.getElementById('project-title').textContent = data.title;
    document.getElementById('project-summary').textContent = data.summary;
    
    // Update page title
    document.title = `${data.title} | Leonard Chen`;
    
    if (data.headerImage) {
        const headerImageContainer = document.getElementById('project-header-image');
        const block = createContentBlock('image', data.headerImage);
        headerImageContainer.appendChild(block);
    }
    
    // Render sections
    const sectionsContainer = document.getElementById('project-sections');
    data.sections.forEach(section => {
        const sectionElement = createSection(section);
        sectionsContainer.appendChild(sectionElement);
    });
    
}

function createSection(section) {
    const sectionEl = document.createElement('section');
    sectionEl.className = 'project-section';
    
    const container = document.createElement('div');
    container.className = 'container';
    
    // Add section title
    const title = document.createElement('h2');
    title.className = 'section-title';
    title.textContent = section.title;
    container.appendChild(title);
    
    // Add content blocks
    section.blocks.forEach(block => {
        const blockElement = createContentBlock(block.type, block);
        container.appendChild(blockElement);
    });
    
    sectionEl.appendChild(container);
    return sectionEl;
}

function createContentBlock(type, data) {
    const blockDiv = document.createElement('div');
    blockDiv.className = 'content-block';
    
    if (type === 'text') {
        // Add subsection title if provided
        if (data.subsectionTitle) {
            const subsectionTitle = document.createElement('h3');
            subsectionTitle.className = 'subsection-title';
            subsectionTitle.textContent = data.subsectionTitle;
            blockDiv.appendChild(subsectionTitle);
        }
        
        // Handle paragraph breaks (\n\n)
        const paragraphs = data.content.split('\n\n');
        paragraphs.forEach(paragraphText => {
            const p = document.createElement('p');
            p.textContent = paragraphText.trim();
            blockDiv.appendChild(p);
        });
        
    } else if (type === 'image') {
        const img = document.createElement('img');
        img.src = data.src;
        img.alt = data.alt;
        img.className = 'content-image';
        blockDiv.appendChild(img);
        
        if (data.caption) {
            const caption = document.createElement('p');
            caption.className = 'image-caption';
            caption.textContent = data.caption;
            blockDiv.appendChild(caption);
        }
    } else if (type === 'carousel') {
        blockDiv.className = 'content-block carousel-block';
        const carousel = createCarousel(data.images);
        blockDiv.appendChild(carousel);
    }
    
    return blockDiv;
}

// ==================== Carousel ====================

function createCarousel(images) {
    const wrapper = document.createElement('div');
    wrapper.className = 'carousel';

    const viewport = document.createElement('div');
    viewport.className = 'carousel-viewport';

    const slidesTrack = document.createElement('div');
    slidesTrack.className = 'carousel-slides';

    images.forEach((imgData, i) => {
        const slide = document.createElement('div');
        slide.className = 'carousel-slide' + (i === 0 ? ' active' : '');
        const bg = document.createElement('div');
        bg.className = 'carousel-slide-bg';
        bg.style.backgroundImage = `url(${imgData.poster || imgData.src})`;
        slide.appendChild(bg);

        const isVideoItem = imgData.type === 'video' || /\.mp4($|\?)/i.test(imgData.src || '');
        const img = document.createElement(isVideoItem ? 'video' : 'img');
        img.src = imgData.src;
        img.className = 'content-image';

        if (isVideoItem) {
            img.poster = imgData.poster || '';
            img.muted = true;
            img.autoplay = true;
            img.loop = true;
            img.playsInline = true;
            img.preload = 'metadata';
            img.setAttribute('aria-label', imgData.alt || 'Carousel video');
        } else {
            img.alt = imgData.alt || '';
            img.addEventListener('click', () => openLightbox(images, i));
        }
        slide.appendChild(img);
        slidesTrack.appendChild(slide);
    });

    viewport.appendChild(slidesTrack);
    wrapper.appendChild(viewport);

    if (images.length > 1) {
        const prevBtn = document.createElement('button');
        prevBtn.className = 'carousel-arrow carousel-prev';
        prevBtn.setAttribute('aria-label', 'Previous image');
        prevBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

        const nextBtn = document.createElement('button');
        nextBtn.className = 'carousel-arrow carousel-next';
        nextBtn.setAttribute('aria-label', 'Next image');
        nextBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

        const dots = document.createElement('div');
        dots.className = 'carousel-dots';
        images.forEach((_, i) => {
            const dot = document.createElement('button');
            dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
            dot.setAttribute('aria-label', `Go to image ${i + 1}`);
            dots.appendChild(dot);
        });
        wrapper.appendChild(dots);

        const caption = document.createElement('p');
        caption.className = 'image-caption carousel-caption';
        caption.textContent = images[0].caption || '';
        wrapper.appendChild(caption);

        let current = 0;

        function goTo(index) {
            const slides = viewport.querySelectorAll('.carousel-slide');
            const dotEls = dots.querySelectorAll('.carousel-dot');
            const currentVideo = slides[current].querySelector('video');
            if (currentVideo) currentVideo.pause();
            slides[current].classList.remove('active');
            dotEls[current].classList.remove('active');
            current = (index + images.length) % images.length;
            slides[current].classList.add('active');
            dotEls[current].classList.add('active');
            caption.textContent = images[current].caption || '';
            const nextVideo = slides[current].querySelector('video');
            if (nextVideo) nextVideo.play().catch(() => {});
        }

        viewport.appendChild(prevBtn);
        viewport.appendChild(nextBtn);

        prevBtn.addEventListener('click', () => goTo(current - 1));
        nextBtn.addEventListener('click', () => goTo(current + 1));
        dots.querySelectorAll('.carousel-dot').forEach((dot, i) => {
            dot.addEventListener('click', () => goTo(i));
        });
    } else {
        const caption = document.createElement('p');
        caption.className = 'image-caption carousel-caption';
        caption.textContent = images[0].caption || '';
        wrapper.appendChild(caption);

        viewport.querySelector('img').addEventListener('click', () => openLightbox(images, 0));
    }

    return wrapper;
}

// ==================== Lightbox ====================

let lightboxEl = null;
let lightboxImages = [];
let lightboxIndex = 0;

function ensureLightbox() {
    if (lightboxEl) return;

    lightboxEl = document.createElement('div');
    lightboxEl.className = 'lightbox';
    lightboxEl.innerHTML = `
        <div class="lightbox-backdrop"></div>
        <button class="lightbox-close" aria-label="Close lightbox">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        </button>
        <button class="lightbox-arrow lightbox-prev" aria-label="Previous image">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <button class="lightbox-arrow lightbox-next" aria-label="Next image">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M9 6L15 12L9 18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <div class="lightbox-content">
            <img class="lightbox-image" src="" alt="">
            <p class="lightbox-caption"></p>
        </div>
        <div class="lightbox-dots"></div>
    `;
    document.body.appendChild(lightboxEl);

    lightboxEl.querySelector('.lightbox-backdrop').addEventListener('click', closeLightbox);
    lightboxEl.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
    lightboxEl.querySelector('.lightbox-prev').addEventListener('click', () => lightboxGoTo(lightboxIndex - 1));
    lightboxEl.querySelector('.lightbox-next').addEventListener('click', () => lightboxGoTo(lightboxIndex + 1));

    document.addEventListener('keydown', (e) => {
        if (!lightboxEl.classList.contains('active')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') lightboxGoTo(lightboxIndex - 1);
        if (e.key === 'ArrowRight') lightboxGoTo(lightboxIndex + 1);
    });
}

function openLightbox(images, startIndex) {
    ensureLightbox();
    lightboxImages = images;
    lightboxIndex = startIndex;

    const dotsContainer = lightboxEl.querySelector('.lightbox-dots');
    dotsContainer.innerHTML = '';
    if (images.length > 1) {
        images.forEach((_, i) => {
            const dot = document.createElement('button');
            dot.className = 'lightbox-dot' + (i === startIndex ? ' active' : '');
            dot.setAttribute('aria-label', `Go to image ${i + 1}`);
            dot.addEventListener('click', () => lightboxGoTo(i));
            dotsContainer.appendChild(dot);
        });
    }

    const arrows = lightboxEl.querySelectorAll('.lightbox-arrow');
    arrows.forEach(a => a.style.display = images.length > 1 ? '' : 'none');

    lightboxRender();
    lightboxEl.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    if (!lightboxEl) return;
    lightboxEl.classList.remove('active');
    document.body.style.overflow = '';
}

function lightboxGoTo(index) {
    lightboxIndex = (index + lightboxImages.length) % lightboxImages.length;
    lightboxRender();
    const dots = lightboxEl.querySelectorAll('.lightbox-dot');
    dots.forEach((d, i) => d.classList.toggle('active', i === lightboxIndex));
}

function lightboxRender() {
    const img = lightboxEl.querySelector('.lightbox-image');
    const caption = lightboxEl.querySelector('.lightbox-caption');
    const data = lightboxImages[lightboxIndex];
    img.src = data.src;
    img.alt = data.alt || '';
    caption.textContent = data.caption || '';
    caption.style.display = data.caption ? '' : 'none';
}

function showError(message) {
    const titleEl = document.getElementById('project-title');
    const summaryEl = document.getElementById('project-summary');
    
    if (titleEl) titleEl.textContent = 'Project Not Found';
    if (summaryEl) summaryEl.textContent = message;
}

function setupEmailCopy() {
    const emailLink = document.getElementById('email-link');
    if (emailLink) {
        emailLink.addEventListener('click', (e) => {
            e.preventDefault();
            const email = 'chen.junhuo@gmail.com';
            
            navigator.clipboard.writeText(email).then(() => {
                const originalText = emailLink.textContent;
                emailLink.textContent = 'copied!';
                setTimeout(() => {
                    emailLink.textContent = originalText;
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy email:', err);
                window.location.href = `mailto:${email}`;
            });
        });
    }
}

function updateFooterYear() {
    const footer = document.querySelector('.footer p');
    if (footer) {
        const year = new Date().getFullYear();
        footer.innerHTML = footer.innerHTML.replace('2026', year);
    }
}
