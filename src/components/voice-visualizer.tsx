import React, { useRef, useEffect } from 'react';

interface VoiceVisualizerProps {
  audioData: Uint8Array;
  isListening: boolean;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  if (width < 2 * radius) radius = width / 2;
  if (height < 2 * radius) radius = height / 2;
  
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
  ctx.fill();
}

const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({ audioData, isListening }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameIdRef = useRef<number | null>(null);

  const audioDataRef = useRef(audioData);
  const isListeningRef = useRef(isListening);
  const barHeightsHistoryRef = useRef<number[]>([]);

  useEffect(() => {
    audioDataRef.current = audioData;
  }, [audioData]);

  useEffect(() => {
    isListeningRef.current = isListening;
    if (!isListening) {
      barHeightsHistoryRef.current = [];
    }
  }, [isListening]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;
    
    const BAR_WIDTH = 5;
    const GAP = 3;
    const BAR_SPACING = BAR_WIDTH + GAP;
    const SMOOTHING_FACTOR = 0.3;
    const MIN_BAR_HEIGHT = 3;

    const SENSITIVITY_FACTOR = 40;
    const LINEAR_WEIGHT = 0.15;
    
    const draw = () => {
      if (!isListeningRef.current) {
        animationFrameIdRef.current = null;
        requestAnimationFrame(() => {
             if(canvasRef.current) {
                const ctx = canvasRef.current.getContext('2d');
                ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
             }
        });
        return;
      }

      const { width, height } = canvas;
      context.clearRect(0, 0, width, height);
      
      const gradient = context.createLinearGradient(0, height, 0, 0);
      gradient.addColorStop(0, '#3b82f6');
      gradient.addColorStop(0.7, '#2dd4bf');
      context.fillStyle = gradient;

      const currentAudioData = audioDataRef.current;
      const sum = currentAudioData.reduce((acc, val) => acc + Math.abs(val - 128), 0);
      const avgAmplitude = currentAudioData.length > 0 ? sum / currentAudioData.length : 0;
      
      const normalizedAmplitude = avgAmplitude / 128;
      const logScaled = Math.log1p(normalizedAmplitude * SENSITIVITY_FACTOR) / Math.log1p(SENSITIVITY_FACTOR);
      const hybridScaled = LINEAR_WEIGHT * normalizedAmplitude + (1 - LINEAR_WEIGHT) * logScaled;
      
      const maxHeight = height * 0.98;
      const targetHeight = hybridScaled * maxHeight + MIN_BAR_HEIGHT;
      const clampedTargetHeight = Math.min(targetHeight, maxHeight);

      const history = barHeightsHistoryRef.current;
      
      const lastHeight = history[0] || MIN_BAR_HEIGHT;
      const smoothedNewHeight = lastHeight + (clampedTargetHeight - lastHeight) * SMOOTHING_FACTOR;
      
      history.unshift(smoothedNewHeight);

      const maxBars = Math.floor(width / BAR_SPACING);
      while (history.length > maxBars) {
        history.pop();
      }

      // Draw bars without opacity/fade effect
      for (let i = 0; i < history.length; i++) {
        const barHeight = Math.max(history[i], MIN_BAR_HEIGHT);
        const y = (height - barHeight) / 2;
        const x = width - (i * BAR_SPACING) - BAR_WIDTH;
        
        if (x + BAR_WIDTH < 0) {
            continue;
        }

        // Removed: context.globalAlpha = opacity;
        drawRoundedRect(context, x, y, BAR_WIDTH, barHeight, BAR_WIDTH / 2);
      }
      // Removed: context.globalAlpha = 1.0;
      
      animationFrameIdRef.current = requestAnimationFrame(draw);
    };

    const startAnimation = () => {
      if (!animationFrameIdRef.current && isListeningRef.current) {
        barHeightsHistoryRef.current = [];
        animationFrameIdRef.current = requestAnimationFrame(draw);
      }
    };
    
    const resizeObserver = new ResizeObserver(() => {
        if (!canvasRef.current) return;
        const { width, height } = canvasRef.current.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvasRef.current.width = width * dpr;
        canvasRef.current.height = height * dpr;
        const maxBars = Math.floor(canvasRef.current.width / BAR_SPACING);
        if (barHeightsHistoryRef.current.length > maxBars) {
            barHeightsHistoryRef.current = barHeightsHistoryRef.current.slice(0, maxBars);
        }
    });
    resizeObserver.observe(canvas);

    if (isListening) {
      startAnimation();
    }

    return () => {
      resizeObserver.disconnect();
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    };
  }, [isListening]);
  
  return <canvas ref={canvasRef} className="w-full h-full" aria-hidden="true" />;
};

export default VoiceVisualizer;