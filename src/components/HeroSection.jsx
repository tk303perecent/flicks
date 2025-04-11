import React, { useRef, useEffect } from 'react';
import FadeInWhenVisible from './FadeInWhenVisible'; // Ensure this component exists or replace as needed

const HeroSection = () => {
    const canvasRef = useRef(null);
    const particles = useRef([]);
    const animationFrameId = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        // --- Settings ---
        const particleColor = 'rgba(255, 255, 255, 0.7)'; // Base particle color (white with some opacity)
        const lineColor = 'rgba(255, 255, 255, 0.1)';  // Base line color (very faint white)
        const particleDensity = 0.00007; // Adjust density based on desired count per screen area
        const minRadius = 0.5;
        const maxRadius = 1.2;
        const pulseSpeedFactor = 0.005; // How fast particles pulse
        const maxPulseRadius = 0.5;    // How much bigger radius gets at peak pulse
        const driftSpeed = 0.3;        // Max speed particles drift
        const connectionDistance = 120; // Max distance to draw connecting lines
        const lineWidth = 0.5;

        let canvasWidth = 0;
        let canvasHeight = 0;

        // --- Particle Class --- (Using a class can help organize properties)
        class Particle {
            constructor() {
                this.x = Math.random() * canvasWidth;
                this.y = Math.random() * canvasHeight;
                this.vx = (Math.random() - 0.5) * driftSpeed * 2;
                this.vy = (Math.random() - 0.5) * driftSpeed * 2;
                this.baseRadius = minRadius + Math.random() * (maxRadius - minRadius);
                this.radius = this.baseRadius;
                // Unique pulse offset for each particle
                this.pulseOffset = Math.random() * Math.PI * 2;
                this.pulseSpeed = (0.5 + Math.random() * 0.5) * pulseSpeedFactor;
            }

            update(time) {
                // Pulsing effect using sine wave
                const pulse = (Math.sin(this.pulseOffset + time * this.pulseSpeed) + 1) / 2; // Oscillates 0 to 1
                this.radius = this.baseRadius + pulse * maxPulseRadius;

                // Movement
                this.x += this.vx;
                this.y += this.vy;

                // Screen Wrap
                if (this.x < -this.radius) this.x = canvasWidth + this.radius;
                else if (this.x > canvasWidth + this.radius) this.x = -this.radius;
                if (this.y < -this.radius) this.y = canvasHeight + this.radius;
                else if (this.y > canvasHeight + this.radius) this.y = -this.radius;
            }

            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fillStyle = particleColor; // Opacity is baked into the color string
                ctx.fill();
            }
        }

        // --- Helper: Initialize Particles ---
        const initializeParticles = () => {
            particles.current = [];
            const count = Math.floor(canvasWidth * canvasHeight * particleDensity);
            for (let i = 0; i < count; i++) {
                particles.current.push(new Particle());
            }
             console.log(`Initialized ${count} particles.`);
        };

        // --- Helper: Draw Connecting Lines ---
        const drawConnections = () => {
            ctx.lineWidth = lineWidth;
            for (let i = 0; i < particles.current.length; i++) {
                for (let j = i + 1; j < particles.current.length; j++) {
                    const p1 = particles.current[i];
                    const p2 = particles.current[j];
                    const dx = p1.x - p2.x;
                    const dy = p1.y - p2.y;
                    const distSq = dx * dx + dy * dy; // Use squared distance for efficiency

                    if (distSq < connectionDistance * connectionDistance) {
                        const distance = Math.sqrt(distSq);
                        // Calculate opacity based on distance (fades out)
                        const opacity = Math.max(0, (1 - distance / connectionDistance)) * 0.2; // Keep overall opacity low

                        if (opacity > 0) {
                             // Use the base lineColor which already has low alpha, and modulate further
                            ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
                            ctx.beginPath();
                            ctx.moveTo(p1.x, p1.y);
                            ctx.lineTo(p2.x, p2.y);
                            ctx.stroke();
                        }
                    }
                }
            }
        };

        // --- Animation Loop ---
        let lastTimestamp = 0;
        const animate = (timestamp) => {
             // Use actual time elapsed for smoother animation, especially for pulsing
             const elapsedTime = timestamp - lastTimestamp;
             lastTimestamp = timestamp;

            ctx.clearRect(0, 0, canvasWidth, canvasHeight); // Use variables

            // Update and draw particles
            particles.current.forEach(p => {
                p.update(timestamp); // Pass time for pulsing calculation
                p.draw();
            });

            // Draw connections
            drawConnections();

            animationFrameId.current = requestAnimationFrame(animate);
        };

        // --- Resize Handler ---
        const handleResize = () => {
            canvasWidth = window.innerWidth;
            canvasHeight = window.innerHeight;
            canvas.width = canvasWidth * window.devicePixelRatio;
            canvas.height = canvasHeight * window.devicePixelRatio;
            canvas.style.width = `${canvasWidth}px`;
            canvas.style.height = `${canvasHeight}px`;
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

            // Re-initialize particles for new dimensions
            initializeParticles();

            // Restart animation if it was stopped
             if (!animationFrameId.current) {
                 lastTimestamp = performance.now(); // Reset timestamp before restarting
                 animate(lastTimestamp);
             }
        };

        // --- Initial Setup & Start ---
        handleResize(); // Call initially to set size and create particles
        lastTimestamp = performance.now();
        animate(lastTimestamp); // Start the loop

        // --- Event Listener for Resize ---
        window.addEventListener('resize', handleResize);

        // --- Cleanup ---
        return () => {
            window.removeEventListener('resize', handleResize);
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
                animationFrameId.current = null; // Clear the ref
            }
        };
    }, []); // Empty dependency array

    return (
        // Main container
        <main className="relative container mx-auto px-6 py-16 md:py-24 text-center flex flex-col items-center justify-center min-h-[calc(100vh-64px)] overflow-hidden">

            {/* Canvas Container - Full viewport background */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full"></canvas>
            </div>

            {/* Foreground Text Content Container */}
            <div className="relative z-10 flex flex-col items-center">
                 {/* Your Text and Buttons using FadeInWhenVisible or similar */}
                 <FadeInWhenVisible className="w-full max-w-4xl">
                    <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight mb-4">
                        Streamline Your Legal Workflow with <span className="text-accent-teal">CounselDocs</span>
                    </h1>
                </FadeInWhenVisible>
                 <FadeInWhenVisible className="w-full max-w-3xl">
                    <p className="text-lg md:text-xl text-medium-text mb-8">
                        The intelligent platform designed for legal professionals to manage documents, collaborate securely, and save valuable time.
                    </p>
                </FadeInWhenVisible>
                <FadeInWhenVisible>
                    <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                        <a
                            href="#signup"
                            className="bg-accent-teal hover:bg-accent-teal-hover text-white font-bold py-3 px-8 rounded-lg text-lg transition-all duration-200 ease-out transform hover:scale-105"
                        >
                            Get Started Free
                        </a>
                        <a
                            href="#features"
                            className="border-2 border-medium-text hover:border-light-text hover:text-light-text text-medium-text font-bold py-3 px-8 rounded-lg text-lg transition-all duration-200 ease-out transform hover:scale-105"
                        >
                            Learn More
                        </a>
                    </div>
                </FadeInWhenVisible>
            </div>
        </main>
    );
};

export default HeroSection;