document.addEventListener('DOMContentLoaded', () => {
    const backLink = document.querySelector('.back-link');
    const title = document.querySelector('.project-page-title');
    if (!backLink || !title) return;

    const minTop = parseFloat(getComputedStyle(document.documentElement).fontSize);

    function updatePosition() {
        const titleTop = title.getBoundingClientRect().top;
        backLink.style.top = Math.max(minTop, titleTop) + 'px';
    }

    if (title.textContent.trim()) {
        updatePosition();
    } else {
        backLink.style.opacity = '0';
        const observer = new MutationObserver(() => {
            updatePosition();
            backLink.style.opacity = '1';
            observer.disconnect();
        });
        observer.observe(title, { childList: true, characterData: true, subtree: true });
    }

    window.addEventListener('scroll', updatePosition, { passive: true });
});
