import { viewerConfig } from './config.js';

export class Slider {
    constructor(containerId, options = {}) {
        this.viewers = options.viewers || viewerConfig.viewers;
        this.currentSlide = 0;
        this.container = document.getElementById(containerId);
        this.loadingSlides = new Set();
        this.unloadTimeouts = new Map();
        this.unloadDelay = 5000;
        this.isFullscreen = false;

        if (!this.container) {
            console.error(`Slider container with ID "${containerId}" not found`);
            return;
        }

        this.init();
        
        // Add postMessage listener for iOS fullscreen support
        window.addEventListener('message', this.handleMessage = (event) => {
            // Only process messages from our iframe viewers
            const currentIframe = this.getCurrentIframe();
            if (!currentIframe || event.source !== currentIframe.contentWindow) {
                return;
            }
            
            console.log('Message received from iframe:', event.data);
            
            if (event.data === 'requestFullscreen') {
                this.handleFullscreen(true);
            } else if (event.data === 'exitFullscreen') {
                this.handleFullscreen(false);
            }
        });
    }

    getCurrentIframe() {
        const currentContainer = this.slideContainers[this.currentSlide];
        return currentContainer ? currentContainer.querySelector('iframe') : null;
    }
    
    handleFullscreen(enterFullscreen) {
        const iframe = this.getCurrentIframe();
        
        if (!iframe) {
            console.error('No active iframe found');
            return;
        }
        
        if (enterFullscreen && !this.isFullscreen) {
            console.log('Entering fullscreen mode');
            
            // Create a new fullscreen container
            const fullscreenContainer = document.createElement('div');
            fullscreenContainer.className = 'fullscreen-container';
            fullscreenContainer.style.position = 'fixed';
            fullscreenContainer.style.top = '0';
            fullscreenContainer.style.left = '0';
            fullscreenContainer.style.width = '100vw';
            fullscreenContainer.style.height = '100vh';
            fullscreenContainer.style.backgroundColor = 'black';
            fullscreenContainer.style.zIndex = '9999';
            document.body.appendChild(fullscreenContainer);
            
            // Clone the iframe
            const fullscreenIframe = document.createElement('iframe');
            fullscreenIframe.src = iframe.src;
            fullscreenIframe.style.width = '100%';
            fullscreenIframe.style.height = '100%';
            fullscreenIframe.style.border = 'none';
            fullscreenIframe.allow = 'fullscreen; xr-spatial-tracking';
            
            // Store the original iframe for later reference
            this.originalIframe = iframe;
            this.fullscreenContainer = fullscreenContainer;
            this.fullscreenIframe = fullscreenIframe;
            
            // Append the cloned iframe to the fullscreen container
            fullscreenContainer.appendChild(fullscreenIframe);
            
            // Store original body overflow
            this.originalBodyOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            
            // Add close button
            const closeBtn = document.createElement('button');
            closeBtn.innerHTML = '✕';
            closeBtn.style.position = 'fixed';
            closeBtn.style.top = '20px';
            closeBtn.style.right = '20px';
            closeBtn.style.zIndex = '10000';
            closeBtn.style.background = 'rgba(0, 0, 0, 0.6)';
            closeBtn.style.color = 'white';
            closeBtn.style.border = 'none';
            closeBtn.style.borderRadius = '50%';
            closeBtn.style.width = '40px';
            closeBtn.style.height = '40px';
            closeBtn.style.fontSize = '20px';
            closeBtn.style.cursor = 'pointer';
            closeBtn.onclick = () => this.handleFullscreen(false);
            fullscreenContainer.appendChild(closeBtn);
            this.closeButton = closeBtn;
            
            this.isFullscreen = true;
            
            // Wait for the iframe to load and then send fullscreenEntered message
            fullscreenIframe.onload = () => {
                try {
                    fullscreenIframe.contentWindow.postMessage('fullscreenEntered', '*');
                    console.log('Sent fullscreenEntered message to new iframe');
                } catch (err) {
                    console.error('Failed to send message to new iframe:', err);
                }
            };
            
        } else if (!enterFullscreen && this.isFullscreen) {
            console.log('Exiting fullscreen mode');
            
            // Remove the fullscreen container and all its children
            if (this.fullscreenContainer) {
                document.body.removeChild(this.fullscreenContainer);
                this.fullscreenContainer = null;
                this.fullscreenIframe = null;
                this.closeButton = null;
            }
            
            // Restore body overflow
            document.body.style.overflow = this.originalBodyOverflow || '';
            
            // Tell the original iframe we've exited fullscreen mode
            try {
                iframe.contentWindow.postMessage('fullscreenExited', '*');
                console.log('Sent fullscreenExited message to original iframe');
            } catch (err) {
                console.error('Failed to send message to iframe:', err);
            }
            
            this.isFullscreen = false;
        }
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
            const firstButton = this.container.querySelector('button');
            if (firstButton) {
                this.container.insertBefore(slidesContainer, firstButton);
            } else {
                this.container.appendChild(slidesContainer);
            }
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

        // Exit fullscreen if active when changing slides
        if (this.isFullscreen) {
            this.handleFullscreen(false);
        }

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
        
        // Clean up fullscreen if active
        if (this.isFullscreen) {
            this.handleFullscreen(false);
        }
        
        // Remove message event listeners
        if (this.handleMessage) {
            window.removeEventListener('message', this.handleMessage);
        }
    }
}