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
    if (!element) return undefined;
    const view = element.ownerDocument.defaultView ?? window;
    let frame = 0;
    const measure = () => {
      view.cancelAnimationFrame(frame);
      frame = view.requestAnimationFrame(() => {
        const rect = element.getBoundingClientRect();
        const next = classifyResponsiveMetrics(rect.width || view.innerWidth, rect.height || view.innerHeight, surface);
        setMetrics((previous) => previous.width === next.width && previous.height === next.height && previous.widthBand === next.widthBand ? previous : next);
      });
    };
    measure();
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(measure);
      observer.observe(element);
      return () => { view.cancelAnimationFrame(frame); observer.disconnect(); };
    }
    view.addEventListener('resize', measure, { passive: true });
    return () => { view.cancelAnimationFrame(frame); view.removeEventListener('resize', measure); };
  }, [surface]);

  const responsiveStyle = { ...responsiveCssVariables(metrics), ...style } as CSSProperties;
  return (
    <div
      ref={ref}
      className={className}
      data-stt-root=""
      data-stt-reduced-motion={customization.config.accessibility.reducedMotion ? 'true' : 'false'}
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
