import { useEffect, useMemo, useRef, useState } from "react";

export function useSwipe({
  threshold = 60,
  disabled = false,
  onSwipeLeft,
  onSwipeRight
} = {}) {
  // ALTERACAO: refs preservam o gesto sem rerender desnecessario durante o touch.
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const startTimeRef = useRef(0);
  const [distance, setDistance] = useState(0);
  const [direction, setDirection] = useState(null);
  const [velocity, setVelocity] = useState(0);
  const [isSwipping, setIsSwipping] = useState(false);

  const reset = () => {
    setDistance(0);
    setDirection(null);
    setVelocity(0);
    setIsSwipping(false);
  };

  // ALTERACAO: permite cancelar o gesto com Escape para preservar controle do usuario.
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        reset();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handlers = useMemo(
    () => ({
      onTouchStart: (event) => {
        if (disabled) {
          return;
        }

        // ALTERACAO: captura origem e timestamp para calcular distancia e velocidade.
        const touch = event.touches[0];
        startXRef.current = touch.clientX;
        startYRef.current = touch.clientY;
        startTimeRef.current = performance.now();
        setIsSwipping(true);
      },
      onTouchMove: (event) => {
        if (disabled || !isSwipping) {
          return;
        }

        const touch = event.touches[0];
        const deltaX = touch.clientX - startXRef.current;
        const deltaY = touch.clientY - startYRef.current;

        // ALTERACAO: cancela leitura horizontal se o gesto estiver mais vertical.
        if (Math.abs(deltaY) > Math.abs(deltaX)) {
          return;
        }

        setDistance(deltaX);
        setDirection(deltaX > 0 ? "right" : "left");
        const elapsed = performance.now() - startTimeRef.current || 1;
        setVelocity(Math.abs(deltaX) / elapsed);
      },
      onTouchEnd: () => {
        if (disabled) {
          reset();
          return;
        }

        // ALTERACAO: dispara callbacks apenas quando o threshold configurado e atingido.
        if (Math.abs(distance) >= threshold) {
          if (distance > 0) {
            onSwipeRight?.();
          } else {
            onSwipeLeft?.();
          }
        }

        reset();
      },
      onTouchCancel: reset
    }),
    [disabled, distance, isSwipping, onSwipeLeft, onSwipeRight, threshold]
  );

  return {
    direction,
    distance,
    velocity,
    isSwipping,
    handlers,
    reset
  };
}
