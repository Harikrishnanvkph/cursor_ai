/**
 * Chart Configuration Immutability Utilities
 * 
 * These utilities ensure that the chart configuration (the single source of truth
 * owned by chart mode) cannot be mutated by downstream consumers like template mode
 * or format/variant rendering.
 */

/**
 * Deep clones an object via structured clone (JSON round-trip).
 * Use this whenever passing chartConfig across module boundaries
 * (e.g., from chart-store into variant-engine or template-html-generator).
 */
export function deepCloneConfig<T>(config: T): T {
    if (config === null || config === undefined) return config;
    return JSON.parse(JSON.stringify(config));
}

/**
 * Recursively freezes an object and all its nested properties.
 * After calling this, any attempt to mutate the object will throw
 * a TypeError in strict mode (or silently fail in sloppy mode).
 */
function deepFreeze<T extends object>(obj: T): T {
    const propNames = Object.getOwnPropertyNames(obj);
    for (const name of propNames) {
        const val = (obj as any)[name];
        if (val && typeof val === 'object' && !Object.isFrozen(val)) {
            deepFreeze(val);
        }
    }
    return Object.freeze(obj);
}

/**
 * Creates a deeply frozen, deeply cloned copy of the chart configuration.
 * 
 * Used by template-store and variant-engine to guarantee that downstream
 * consumers cannot accidentally mutate the source-of-truth chartConfig.
 * 
 * Performance note: The clone is done via JSON.parse/stringify which handles
 * plain objects well (chart config is always serializable). The freeze is
 * only applied in development mode for performance reasons.
 */
export function freezeChartConfig<T>(config: T): Readonly<T> {
    const clone = deepCloneConfig(config);
    if (clone && typeof clone === 'object') {
        if (process.env.NODE_ENV === 'development') {
            return deepFreeze(clone as any) as Readonly<T>;
        }
    }
    return clone as Readonly<T>;
}
