declare module 'react' {
  export interface CSSProperties { [key: string]: string | number | undefined; }
  export type SetStateAction<T> = T | ((previous: T) => T);
  export function useState<T>(initial: T | (() => T)): [T, (value: SetStateAction<T>) => void];
  export function useMemo<T>(factory: () => T, deps: readonly unknown[]): T;
  export function useDeferredValue<T>(value: T): T;
  export function useEffect(effect: () => void | (() => void), deps?: readonly unknown[]): void;
  export function useLayoutEffect(effect: () => void | (() => void), deps?: readonly unknown[]): void;
  export interface MutableRefObject<T> { current: T; }
  export function useRef<T>(initial: T): MutableRefObject<T>;
  export function useRef<T>(initial: T | null): MutableRefObject<T | null>;
  export type ReactNode = any;
  export function useSyncExternalStore<T>(subscribe: (listener: () => void) => () => void, getSnapshot: () => T, getServerSnapshot?: () => T): T;
}

declare module 'react/jsx-runtime' {
  export namespace JSX {
    interface IntrinsicAttributes { key?: string | number; }
    interface IntrinsicElements { [element: string]: any; }
  }
  export const jsx: any;
  export const jsxs: any;
  export const Fragment: any;
}

declare module 'react-dom/client' {
  export interface Root { render(node: unknown): void; unmount(): void; }
  export function createRoot(container: Element | DocumentFragment): Root;
}

declare module 'millennium' {
  export function definePlugin(factory: () => unknown): unknown;
  export const ErrorBoundary: any;
  export const FocusRing: any;
  export const Focusable: any;
  export const ReorderableList: any;
}

declare module '*.css';
