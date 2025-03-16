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

        // Preserve existing buttons by not clearing the entire container
        // Instead, clear or create the slides and dots containers specifically
        let slidesContainer = this.container.querySelector('.slides-container');
        if (!slidesContainer) {
            slidesContainer = document.createElement('div');
            slidesContainer.className = 'slides-container relative w-full h-full';
            // Insert before the buttons (assumes buttons are direct children)
            this.container.insertBefore(slidesContainer, this.container.querySelector('button'));
        } else {
            slidesContainer.innerHTML = '';
        }
        this.slidesContainer = slidesContainer;

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

        // Create or update dots navigation container
        let dotsContainer = this.container.querySelector('.dots-container');
        if (!dotsContainer) {
            dotsContainer = document.createElement('div');
            dotsContainer.className = 'absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-20 dots-container';
            this.container.appendChild(dotsContainer);
        } else {
            dotsContainer.innerHTML = '';
        }
        this.dotsContainer = dotsContainer;

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

    destroy() {
        this.slideContainers.forEach(container => {
            if (this.unloadTimeouts.has(container)) {
                clearTimeout(this.unloadTimeouts.get(container));
            }
            this.unloadIframe(container);
        });
        this.unloadTimeouts.clear();
    }
}