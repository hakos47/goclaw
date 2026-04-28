<script lang="ts">
  import { onMount } from "svelte";

  let canvas: HTMLCanvasElement;

  onMount(() => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let particles: { x: number; y: number; r: number; dx: number; dy: number; color: string }[] = [];
    // User requested "Gemini CLI Extensions" aesthetic (Deep Blue/Purple/Gemini Gradient), "Radiant Purple" (#d946ef)
    const colors = ["#d946ef", "#8b5cf6", "#3b82f6", "#06b6d4"];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", resize);
    resize();

    // Create Agent Nodes
    for (let i = 0; i < 70; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 2 + 1,
        dx: (Math.random() - 0.5) * 0.5,
        dy: (Math.random() - 0.5) * 0.5,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }

    let animationId: number;

    const animate = () => {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw Connections (Neural Network effect)
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 150) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(217, 70, 239, ${0.4 * (1 - dist / 150)})`; // #d946ef fading out
            ctx.lineWidth = 1;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw Nodes
      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.shadowBlur = 0;

        p.x += p.dx;
        p.y += p.dy;

        if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resize);
      if (animationId) cancelAnimationFrame(animationId);
    };
  });
</script>

<!-- Base deep dark background with purple tones -->
<div class="fixed inset-0 z-0 pointer-events-none bg-[#02000a]"></div>

<!-- Animated holographic grid -->
<div class="fixed inset-0 z-0 pointer-events-none opacity-[0.15] bg-[linear-gradient(rgba(217,70,239,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(217,70,239,0.2)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_50%,#000_20%,transparent_100%)]" style="transform: perspective(500px) rotateX(60deg) scale(2) translateY(-20%); transform-origin: top;"></div>

<!-- Deep Blue/Purple Gemini Gradient Glows -->
<div class="fixed top-[-10%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-br from-[#d946ef]/15 to-[#3b82f6]/10 blur-[150px] z-0 pointer-events-none"></div>
<div class="fixed bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-tl from-[#8b5cf6]/15 to-[#06b6d4]/10 blur-[150px] z-0 pointer-events-none"></div>

<!-- Autonomous Agent Neural Canvas -->
<canvas bind:this={canvas} class="fixed inset-0 z-0 pointer-events-none opacity-50"></canvas>

<!-- Scanner Line Effect -->
<div class="fixed inset-0 z-0 pointer-events-none overflow-hidden">
  <div class="w-full h-[2px] bg-gradient-to-r from-transparent via-[#d946ef]/80 to-transparent absolute top-0 animate-[scan_6s_linear_infinite] shadow-[0_0_20px_rgba(217,70,239,1)] opacity-40"></div>
</div>

<style>
  @keyframes scan {
    0% { transform: translateY(-10vh); }
    100% { transform: translateY(110vh); }
  }
</style>