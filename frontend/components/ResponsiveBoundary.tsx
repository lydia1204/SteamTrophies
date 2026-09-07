import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { classifyResponsiveMetrics, responsiveCssVariables, type ResponsiveMetrics, type SurfaceKind } from '../../packages/customization/src';
import { useCustomizationState } from '../state/customization-hooks';

export function ResponsiveBoundary({ surface, className, component, children, style }: {
  surface: SurfaceKind;
  className?: string;
  component?: string;
  children: ReactNode;
  style?: CSSProperties;
}) {
  const customization = useCustomizationState();
  const ref = useRef<HTMLDivElement>(null);
  const [metrics, setMetrics] = useState<ResponsiveMetrics>(() => classifyResponsiveMetrics(1280, surface === 'deck' ? 800 : 720, surface));

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = element.getBoundingClientRect();
        const next = classifyResponsiveMetrics(rect.width || window.innerWidth, rect.height || window.innerHeight, surface);
        setMetrics((previous) => previous.width === next.width && previous.height === next.height && previous.widthBand === next.widthBand ? previous : next);
      });
    };
    measure();
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(measure);
      observer.observe(element);
      return () => { cancelAnimationFrame(frame); observer.disconnect(); };
    }
    window.addEventListener('resize', measure, { passive: true });
    return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', measure); };
  }, [surface]);

  const responsiveStyle = { ...responsiveCssVariables(metrics), ...style } as CSSProperties;
  return (
    <div
      ref={ref}
      className={className}
      data-stt-root=""
      data-stt-component={component}
      data-stt-surface={surface}
      data-stt-width-band={metrics.widthBand}
      data-stt-height-band={metrics.heightBand}
      data-stt-aspect-band={metrics.aspectBand}
      data-stt-columns={metrics.columns}
      data-stt-focus-debug={customization.config.developer.focusDebug ? 'true' : 'false'}
      data-stt-responsive-debug={customization.config.developer.responsiveDebug ? 'true' : 'false'}
      style={responsiveStyle}
    >
      {children}
    </div>
  );
}
