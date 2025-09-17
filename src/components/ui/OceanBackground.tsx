'use client';

import React, { useEffect, useRef } from 'react';

/**
 * Beautiful animated ocean background with particles and gradients
 */

export function OceanBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Particle system
    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;
      fadeSpeed: number;

      constructor(canvasWidth: number, canvasHeight: number) {
        this.x = Math.random() * canvasWidth;
        this.y = Math.random() * canvasHeight;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.5;
        this.speedY = Math.random() * 0.5 + 0.1;
        this.opacity = Math.random() * 0.5 + 0.3;
        this.fadeSpeed = Math.random() * 0.005 + 0.002;
      }

      update(canvasWidth: number, canvasHeight: number) {
        this.x += this.speedX;
        this.y -= this.speedY;
        
        // Fade in and out
        this.opacity += this.fadeSpeed;
        if (this.opacity > 0.8 || this.opacity < 0.1) {
          this.fadeSpeed = -this.fadeSpeed;
        }

        // Reset if out of bounds
        if (this.y < -10) {
          this.y = canvasHeight + 10;
          this.x = Math.random() * canvasWidth;
        }
        if (this.x < -10) this.x = canvasWidth + 10;
        if (this.x > canvasWidth + 10) this.x = -10;
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = '#67E8F9'; // cyan-300
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Add glow effect
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#67E8F9';
        ctx.fill();
        ctx.restore();
      }
    }

    // Create particles
    const particles: Particle[] = [];
    const particleCount = 50;
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle(canvas.width, canvas.height));
    }

    // Wave effect
    let waveOffset = 0;
    const drawWaves = () => {
      ctx.save();
      ctx.globalAlpha = 0.1;
      
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(6, 182, 212, ${0.2 - i * 0.05})`;
        ctx.lineWidth = 2;
        
        for (let x = 0; x <= canvas.width; x += 10) {
          const y = canvas.height * 0.5 + 
                   Math.sin((x + waveOffset + i * 100) * 0.01) * 50 +
                   Math.sin((x + waveOffset + i * 50) * 0.02) * 30 +
                   i * 100;
          
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }
      
      ctx.restore();
      waveOffset += 1;
    };

    // Animation loop
    let animationId: number;
    const animate = () => {
      // Create gradient background
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, 'rgba(15, 23, 42, 0.95)'); // slate-900
      gradient.addColorStop(0.5, 'rgba(8, 47, 73, 0.95)'); // blue-950
      gradient.addColorStop(1, 'rgba(7, 89, 133, 0.95)'); // cyan-900
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw waves
      drawWaves();

      // Update and draw particles
      particles.forEach(particle => {
        particle.update(canvas.width, canvas.height);
        particle.draw(ctx);
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: -1 }}
      />
      
      {/* Additional overlay effects */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: -1 }}>
        {/* Radial gradient overlay */}
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-slate-900/50" />
        
        {/* Animated light rays */}
        <div className="absolute inset-0 overflow-hidden opacity-20">
          <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%]"
               style={{
                 background: `conic-gradient(from 0deg at 50% 50%, 
                   transparent 0deg, 
                   rgba(6,182,212,0.1) 60deg, 
                   transparent 120deg, 
                   rgba(6,182,212,0.1) 180deg, 
                   transparent 240deg, 
                   rgba(6,182,212,0.1) 300deg, 
                   transparent 360deg)`,
                 animation: 'rotate-slow 60s linear infinite'
               }}
          />
        </div>
      </div>
    </>
  );
}

// CSS for the background animations
export const oceanBackgroundStyles = `
  @keyframes rotate-slow {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  .bg-gradient-radial {
    background: radial-gradient(circle at center, var(--tw-gradient-stops));
  }
`;
