/**
 * React adapter helper for Lit custom elements.
 *
 * React 18 stringifies every JSX attribute on an unknown tag, which breaks:
 *   - Boolean props (become the literal string "false" — truthy!)
 *   - Number props (become strings, breaking math)
 *   - Object / array props (become "[object Object]")
 *
 * The only reliable path is to grab a ref to the element and assign each
 * prop to the corresponding *property* (not attribute). This helper bundles
 * that pattern plus event-listener wiring so every React wrapper in the
 * catalog looks the same.
 *
 * Consumers pass:
 *   - tag:       the custom element's tag name
 *   - properties: keys of the props object that should be set as properties
 *                 (everything else goes through React normally — className,
 *                 style, data-*, etc.)
 *   - events:    map of React prop name → DOM event name (e.g.
 *                { onChange: "sce-change" }). Listener is added once per
 *                mount and cleaned up on unmount.
 *
 * We intentionally keep this tiny and dependency-free. If React upstream
 * ever supports custom-element properties natively (the long-promised
 * `@property` reflection), this helper can shrink to pass-through.
 */

import React, { useEffect, useLayoutEffect, useRef } from 'react';

type AnyProps = Record<string, unknown>;

export interface ReactAdapterConfig<Props> {
  tag: string;
  /** Prop keys to assign as JS properties on the underlying element. */
  properties: ReadonlyArray<keyof Props & string>;
  /** Map of React prop name → DOM event name. */
  events?: Record<string, string>;
}

/**
 * Creates a React component that renders the given custom element and
 * bridges properties + events correctly.
 */
export function createReactAdapter<
  Props extends {
    className?: string;
    style?: React.CSSProperties;
    id?: string;
  },
>(config: ReactAdapterConfig<Props>) {
  const { tag, properties, events = {} } = config;
  const eventPropNames = Object.keys(events);

  const Component = React.forwardRef<HTMLElement, Props>((props, forwardedRef) => {
    const elRef = useRef<HTMLElement | null>(null);

    // Merge the internal ref with any forwarded ref so consumers can still
    // grab the underlying element (e.g. to call imperative methods).
    const setRef = (el: HTMLElement | null) => {
      elRef.current = el;
      if (typeof forwardedRef === 'function') forwardedRef(el);
      else if (forwardedRef) forwardedRef.current = el;
    };

    // useLayoutEffect: set properties before the browser paints so the
    // first render shows the correct state, not the default state flashing.
    useLayoutEffect(() => {
      const el = elRef.current;
      if (!el) return;
      for (const key of properties) {
        const value = (props as AnyProps)[key];
        // Always assign — writing `undefined` is fine and lets the element
        // fall back to its @property default.
        (el as unknown as AnyProps)[key] = value;
      }
    });

    // Event wiring runs once per mount. We read handlers off a ref so that
    // changing the handler across renders doesn't force listener churn.
    const handlersRef = useRef<AnyProps>(props);
    handlersRef.current = props;

    useEffect(() => {
      const el = elRef.current;
      if (!el) return;
      const disposers: Array<() => void> = [];
      for (const reactName of eventPropNames) {
        const eventName = events[reactName];
        const listener = (event: Event) => {
          const handler = handlersRef.current[reactName];
          if (typeof handler === 'function') {
            (handler as (e: Event) => void)(event);
          }
        };
        el.addEventListener(eventName, listener);
        disposers.push(() => el.removeEventListener(eventName, listener));
      }
      return () => {
        for (const d of disposers) d();
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Strip the properties + event handlers from the pass-through props
    // so React doesn't try to reflect them as HTML attributes.
    const passthrough: AnyProps = {};
    for (const key of Object.keys(props)) {
      if ((properties as readonly string[]).includes(key)) continue;
      if (eventPropNames.includes(key)) continue;
      passthrough[key] = (props as AnyProps)[key];
    }

    // React 18 doesn't know this tag; cast to bypass JSX intrinsic checks.
    const Tag = tag as unknown as React.ElementType;
    return <Tag ref={setRef} {...passthrough} />;
  });

  Component.displayName = `SceReactAdapter(${tag})`;
  return Component;
}
