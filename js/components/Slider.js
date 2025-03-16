// js/components/Slider.js
import { viewerConfig } from './config.js';

export class Slider {
    constructor(containerId, options = {}) {
        this.viewers = options.viewers || viewerConfig.viewers;
        this.currentSlide = 0;
        this.container = document.getElementById(containerId);
        this.loadingSlides = new Set();
        this.unloadTimeouts = new Map();
        this.unloadDelay = 5000;
        this.autoAdvanceDelay = options.autoAdvanceDelay || null;
        this.autoAdvanceInterval = null;

        if (!this.container) {
            console.error(`Slider container with ID "${containerId}" not found`);
            return;
        }

        this.init();
    }

    init() {
        if (this.viewers.length === 0) {
            console.error('No viewers defined in config');
            this.container.innerHTML = '<p>No 3D viewers available</p>';
            return;
        }
        // Clear existing content and set up the slider structure
        this.container.innerHTML = '';
        
        // Create slides container
        this.slidesContainer = document.createElement('div');
        this.slidesContainer.className = 'slides-container relative w-full h-full';
        this.container.appendChild(this.slidesContainer);

        // Generate slide containers
        this.slideContainers = [];
        this.viewers.forEach((_, index) => {
            const slide = document.createElement('div');
            slide.className = 'w-full h-full absolute transition-opacity duration-500';
            slide.style.opacity = index === 0 ? '1' : '0';
            slide.style.zIndex = index === 0 ? '1' : '0';
            slide.dataset.index = index;
            this.slidesContainer.appendChild(slide);
            this.slideContainers.push(slide);
        });

        // Create dots navigation container
        this.dotsContainer = document.createElement('div');
        this.dotsContainer.className = 'absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-20';
        this.container.appendChild(this.dotsContainer);

        // Generate dots
        this.dots = [];
        this.viewers.forEach((_, index) => {
            const dot = document.createElement('button');
            dot.className = `w-3 h-3 rounded-full ${index === 0 ? 'bg-white' : 'bg-white/50'} hover:bg-white/75 transition-colors pointer-events-auto`;
            dot.addEventListener('click', () => this.goToSlide(index));
            this.dotsContainer.appendChild(dot);
            this.dots.push(dot);
        });

        // Load the first slide
        this.loadIframe(this.slideContainers[0], this.viewers[0]);

        // Start auto-advance if delay is set
        if (this.autoAdvanceDelay) {
            this.startAutoAdvance();
        }

        // Add mouse event listeners to pause/resume auto-advance
        this.container.addEventListener('mouseenter', () => this.pauseAutoAdvance());
        this.container.addEventListener('mouseleave', () => this.resumeAutoAdvance());
    }

    loadIframe(container, src) {
        if (this.loadingSlides.has(container)) {
            console.warn('Slide already loading:', src);
            return;
        }

        if (this.unloadTimeouts.has(container)) {
            clearTimeout(this.unloadTimeouts.get(container));
            this.unloadTimeouts.delete(container);
        }

        container.innerHTML = '';
        this.loadingSlides.add(container);

        const iframe = document.createElement('iframe');
        iframe.className = 'w-full h-full';
        iframe.allow = 'fullscreen; xr-spatial-tracking';
        iframe.style.pointerEvents = 'auto';
        iframe.style.border = 'none';
        iframe.src = src;

        iframe.onload = () => {
            console.log('Iframe loaded:', src);
            this.loadingSlides.delete(container);
        };
        iframe.onerror = () => {
            console.error('Iframe failed to load:', src);
            this.loadingSlides.delete(container);
        };

        container.appendChild(iframe);
        console.log('Iframe appended:', iframe);
    }

    unloadIframe(container) {
        container.innerHTML = '';
        console.log('Iframe unloaded from container:', container);
    }

    showSlide(index) {
        if (index === this.currentSlide) return;

        this.slideContainers.forEach((container, i) => {
            if (i === index) {
                container.style.opacity = '1';
                container.style.zIndex = '1';
                if (!container.querySelector('iframe')) {
                    this.loadIframe(container, this.viewers[i]);
                }
            } else {
                container.style.opacity = '0';
                container.style.zIndex = '0';

                if (container.querySelector('iframe')) {
                    const timeoutId = setTimeout(() => {
                        this.unloadIframe(container);
                        this.unloadTimeouts.delete(container);
                    }, this.unloadDelay);
                    this.unloadTimeouts.set(container, timeoutId);
                }
            }
        });

        this.dots.forEach((dot, i) => {
            dot.classList.toggle('bg-white', i === index);
            dot.classList.toggle('bg-white/50', i !== index);
        });

        this.currentSlide = index;
    }

    nextSlide() {
        const next = (this.currentSlide + 1) % this.slideContainers.length;
        this.showSlide(next);
    }

    prevSlide() {
        const prev = (this.currentSlide - 1 + this.slideContainers.length) % this.slideContainers.length;
        this.showSlide(prev);
    }

    goToSlide(index) {
        this.showSlide(index);
    }

    startAutoAdvance() {
        if (this.autoAdvanceDelay && !this.autoAdvanceInterval) {
            this.autoAdvanceInterval = setInterval(() => this.nextSlide(), this.autoAdvanceDelay);
        }
    }

    pauseAutoAdvance() {
        if (this.autoAdvanceInterval) {
            clearInterval(this.autoAdvanceInterval);
            this.autoAdvanceInterval = null;
        }
    }

    resumeAutoAdvance() {
        if (this.autoAdvanceDelay) {
            this.startAutoAdvance();
        }
    }

    destroy() {
        this.pauseAutoAdvance();
        
        this.slideContainers.forEach(container => {
            if (this.unloadTimeouts.has(container)) {
                clearTimeout(this.unloadTimeouts.get(container));
            }
            this.unloadIframe(container);
        });
        
        this.unloadTimeouts.clear();
        this.container.removeEventListener('mouseenter', () => this.pauseAutoAdvance());
        this.container.removeEventListener('mouseleave', () => this.resumeAutoAdvance());
    }
}