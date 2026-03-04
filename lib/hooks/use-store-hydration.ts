import { useState, useEffect } from "react"

/**
 * Wait for Zustand persisted stores to finish hydrating from localStorage.
 * Returns true once all stores are hydrated (or after fallbackMs timeout).
 *
 * Usage:
 *   const hydrated = useStoreHydration([useChartStore, useTemplateStore]);
 *   if (!hydrated) return <div />;
 */
export function useStoreHydration(stores: any[], fallbackMs = 200): boolean {
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        let remaining = stores.length;

        const checkDone = () => {
            remaining--;
            if (remaining <= 0) setHydrated(true);
        };

        for (const store of stores) {
            const persist = store.persist as any;
            if (persist?.hasHydrated?.()) {
                remaining--;
            } else {
                const unsub = persist?.onFinishHydration?.(() => {
                    checkDone();
                    unsub?.();
                });
                // No persist API → treat as already hydrated
                if (!unsub) remaining--;
            }
        }

        if (remaining <= 0) setHydrated(true);

        // Fallback: render anyway if stores don't hydrate in time
        const fallback = setTimeout(() => setHydrated(true), fallbackMs);
        return () => clearTimeout(fallback);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return hydrated;
}
