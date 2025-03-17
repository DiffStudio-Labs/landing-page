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
        
        window.addEventListener('message', this.handleMessage = (event) => {
            const currentIframe = this.getCurrentIframe();
            const fullscreenIframe = this.fullscreenIframe;
            
            const isFromCurrentIframe = currentIframe && event.source === currentIframe.contentWindow;
            const isFromFullscreenIframe = fullscreenIframe && event.source === fullscreenIframe.contentWindow;
            
            if (!isFromCurrentIframe && !isFromFullscreenIframe) {
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
            
            const fullscreenContainer = document.createElement('div');
            fullscreenContainer.className = 'fullscreen-container';
            fullscreenContainer.style.position = 'fixed';
            fullscreenContainer.style.top = '0';
            fullscreenContainer.style.left = '0';
            fullscreenContainer.style.width = '100%';
            fullscreenContainer.style.height = '100%';
            fullscreenContainer.style.backgroundColor = 'black';
            fullscreenContainer.style.zIndex = '9999';
            fullscreenContainer.style.overflow = 'hidden';
            document.body.appendChild(fullscreenContainer);
            
            const fullscreenIframe = document.createElement('iframe');
            
            const iframeSrc = new URL(iframe.src);
            iframeSrc.searchParams.set('alreadyFullscreen', 'true');
            
            fullscreenIframe.src = iframeSrc.toString();
            fullscreenIframe.style.width = '100%';
            fullscreenIframe.style.height = '100%';
            fullscreenIframe.style.border = 'none';
            fullscreenIframe.style.margin = '0';
            fullscreenIframe.style.padding = '0';
            fullscreenIframe.style.display = 'block';
            fullscreenIframe.style.overflow = 'hidden';
            fullscreenIframe.allow = 'fullscreen; xr-spatial-tracking';
            
            this.originalIframe = iframe;
            this.fullscreenContainer = fullscreenContainer;
            this.fullscreenIframe = fullscreenIframe;
            
            fullscreenContainer.appendChild(fullscreenIframe);
            
            this.originalBodyOverflow = document.body.style.overflow;
            this.originalBodyPosition = document.body.style.position;
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.width = '100%';
            document.body.style.height = '100%';
            
            this.isFullscreen = true;
            
            this.resizeHandler = () => {
                if (this.fullscreenContainer) {
                    this.fullscreenContainer.style.width = '100%';
                    this.fullscreenContainer.style.height = '100%';
                }
            };
            window.addEventListener('resize', this.resizeHandler);
            
            this.escKeyHandler = (event) => {
                if (event.key === 'Escape' && this.isFullscreen) {
                    this.handleFullscreen(false);
                }
            };
            document.addEventListener('keydown', this.escKeyHandler);
            
        } else if (!enterFullscreen && this.isFullscreen) {
            console.log('Exiting fullscreen mode');
            
            if (this.resizeHandler) {
                window.removeEventListener('resize', this.resizeHandler);
                this.resizeHandler = null;
            }
            
            if (this.escKeyHandler) {
                document.removeEventListener('keydown', this.escKeyHandler);
                this.escKeyHandler = null;
            }
            
            if (this.fullscreenContainer) {
                document.body.removeChild(this.fullscreenContainer);
                this.fullscreenContainer = null;
                this.fullscreenIframe = null;
            }
            
            document.body.style.overflow = this.originalBodyOverflow || '';
            document.body.style.position = this.originalBodyPosition || '';
            document.body.style.width = '';
            document.body.style.height = '';
            
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

        let slidesContainer = this.container.querySelector('.slides-container');
        if (!slidesContainer) {
            slidesContainer = document.createElement('div');
            slidesContainer.className = 'slides-container relative w-full h-full';
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

        let dotsContainer = this.container.querySelector('.dots-container');
        if (!dotsContainer) {
            dotsContainer = document.createElement('div');
            dotsContainer.className = 'absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-20 dots-container';
            this.container.appendChild(dotsContainer);
        } else {
            dotsContainer.innerHTML = '';
        }
        this.dotsContainer = dotsContainer;

        this.dots = [];
        this.viewers.forEach((_, index) => {
            const dot = document.createElement('button');
            dot.className = `w-3 h-3 rounded-full ${index === 0 ? 'bg-white' : 'bg-white/50'} hover:bg-white/75 transition-colors pointer-events-auto`;
            dot.addEventListener('click', () => this.goToSlide(index));
            this.dotsContainer.appendChild(dot);
            this.dots.push(dot);
        });

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
        
        if (this.isFullscreen) {
            this.handleFullscreen(false);
        }
        
        if (this.handleMessage) {
            window.removeEventListener('message', this.handleMessage);
        }
        
        if (this.resizeHandler) {
            window.removeEventListener('resize', this.resizeHandler);
        }
        
        if (this.escKeyHandler) {
            document.removeEventListener('keydown', this.escKeyHandler);
        }
    }
}