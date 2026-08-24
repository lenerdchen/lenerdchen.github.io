// ==================== Initialization ====================

document.addEventListener('DOMContentLoaded', () => {
    // Setup email copy functionality
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

    // Setup smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                window.scrollTo({ top: target.offsetTop, behavior: 'smooth' });
            }
        });
    });
});
