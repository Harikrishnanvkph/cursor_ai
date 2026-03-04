import { ChartState } from './chart-state-service'; // Helper type
import { PairedPoint } from '../utils/dataset-utils';

export class ChartTransformService {

    // Helper to backup state if needed
    private static ensureBackup(state: ChartState, index: number): Map<number, any> {
        if (state.datasetBackups.has(index)) {
            return state.datasetBackups;
        }

        const dataset = state.chartData.datasets[index];
        if (!dataset) return state.datasetBackups;

        const newBackups = new Map(state.datasetBackups);
        newBackups.set(index, {
            labels: [...(state.chartData.labels || [])] as string[],
            data: JSON.parse(JSON.stringify(dataset.data)),
            backgroundColor: Array.isArray(dataset.backgroundColor) ? [...dataset.backgroundColor] : dataset.backgroundColor,
            borderColor: Array.isArray(dataset.borderColor) ? [...dataset.borderColor] : dataset.borderColor,
            pointImages: dataset.pointImages ? [...dataset.pointImages] : [],
            pointImageConfig: dataset.pointImageConfig ? JSON.parse(JSON.stringify(dataset.pointImageConfig)) : []
        });

        return newBackups;
    }

    // Generic transformation helper (Pure version of applyDatasetTransformation)
    private static applyTransformation(
        state: ChartState,
        index: number,
        transform: (data: PairedPoint[]) => PairedPoint[]
    ): Partial<ChartState> | null {
        const dataset = state.chartData.datasets[index];
        if (!dataset) return null;

        const newBackups = ChartTransformService.ensureBackup(state, index);

        // Map to paired format
        const paired: PairedPoint[] = dataset.data.map((value: any, i: number) => ({
            label: (state.chartData.labels?.[i] as string) || `Point ${i + 1}`,
            value: typeof value === 'number' ? value : (value as any)?.y || 0,
            originalValue: value,
            color: Array.isArray(dataset.backgroundColor) ? dataset.backgroundColor[i] : (dataset.backgroundColor as string),
            borderColor: Array.isArray(dataset.borderColor) ? dataset.borderColor[i] : (dataset.borderColor as string),
            image: dataset.pointImages?.[i] || null,
            imageConfig: dataset.pointImageConfig?.[i] || null
        }));

        // Apply transformation
        const transformed = transform(paired);

        // Construct new state
        return {
            datasetBackups: newBackups,
            chartData: {
                ...state.chartData,
                labels: transformed.map(p => p.label),
                datasets: state.chartData.datasets.map((d, i) =>
                    i === index ? {
                        ...d,
                        data: transformed.map(p => p.originalValue),
                        backgroundColor: transformed.map(p => p.color),
                        borderColor: transformed.map(p => p.borderColor),
                        pointImages: transformed.map(p => p.image),
                        pointImageConfig: transformed.map(p => p.imageConfig),
                        sliceLabels: transformed.map(p => p.label)
                    } : d
                )
            }
        };
    }

    static sortDataset(state: ChartState, index: number, order: 'asc' | 'desc' | 'label-asc' | 'label-desc'): Partial<ChartState> | null {
        return ChartTransformService.applyTransformation(state, index, (paired) => {
            if (order === 'asc') {
                return [...paired].sort((a, b) => a.value - b.value);
            } else if (order === 'desc') {
                return [...paired].sort((a, b) => b.value - a.value);
            } else if (order === 'label-asc') {
                return [...paired].sort((a, b) => a.label.localeCompare(b.label));
            } else if (order === 'label-desc') {
                return [...paired].sort((a, b) => b.label.localeCompare(a.label));
            }
            return paired;
        });
    }

    static reverseDataset(state: ChartState, index: number): Partial<ChartState> | null {
        return ChartTransformService.applyTransformation(state, index, (paired) => {
            return [...paired].reverse();
        });
    }

    static filterTopN(state: ChartState, index: number, n: number): Partial<ChartState> | null {
        return ChartTransformService.applyTransformation(state, index, (paired) => {
            const sorted = [...paired].sort((a, b) => b.value - a.value);
            return sorted.slice(0, Math.min(n, sorted.length));
        });
    }

    static filterAboveThreshold(state: ChartState, index: number, threshold: number): Partial<ChartState> | null {
        return ChartTransformService.applyTransformation(state, index, (paired) => {
            return paired.filter(p => p.value > threshold);
        });
    }

    static filterBelowThreshold(state: ChartState, index: number, threshold: number): Partial<ChartState> | null {
        return ChartTransformService.applyTransformation(state, index, (paired) => {
            return paired.filter(p => p.value < threshold);
        });
    }

    static normalizeDataset(state: ChartState, index: number, range: string): Partial<ChartState> | null {
        const dataset = state.chartData.datasets[index];
        if (!dataset) return null;

        const newBackups = ChartTransformService.ensureBackup(state, index);

        const values = dataset.data.map((v: any) => typeof v === 'number' ? v : (v as any)?.y || 0);
        const min = Math.min(...values);
        const max = Math.max(...values);
        const diff = max - min || 1;

        const normalized = values.map((v: number) => {
            if (range === '0-1') {
                return Number(((v - min) / diff).toFixed(3));
            } else {
                return Math.round(((v - min) / diff) * 100);
            }
        });

        return {
            datasetBackups: newBackups,
            chartData: {
                ...state.chartData,
                datasets: state.chartData.datasets.map((d, i) =>
                    i === index ? { ...d, data: normalized } : d
                )
            }
        };
    }

    static convertToPercentage(state: ChartState, index: number): Partial<ChartState> | null {
        const dataset = state.chartData.datasets[index];
        if (!dataset) return null;

        const newBackups = ChartTransformService.ensureBackup(state, index);

        const total = dataset.data.reduce((sum: number, v: any) => {
            const val = typeof v === 'number' ? v : (v as any)?.y || 0;
            return sum + val;
        }, 0);

        const percentages = dataset.data.map((value: any) => {
            const v = typeof value === 'number' ? value : (value as any)?.y || 0;
            return Math.round((v / total) * 100);
        });

        return {
            datasetBackups: newBackups,
            chartData: {
                ...state.chartData,
                datasets: state.chartData.datasets.map((d, i) =>
                    i === index ? { ...d, data: percentages } : d
                )
            }
        };
    }

    static roundDataset(state: ChartState, index: number, decimals: number): Partial<ChartState> | null {
        const dataset = state.chartData.datasets[index];
        if (!dataset) return null;

        const newBackups = ChartTransformService.ensureBackup(state, index);

        const rounded = dataset.data.map((value: any) => {
            const v = typeof value === 'number' ? value : (value as any)?.y || 0;
            return Number(v.toFixed(decimals));
        });

        return {
            datasetBackups: newBackups,
            chartData: {
                ...state.chartData,
                datasets: state.chartData.datasets.map((d, i) =>
                    i === index ? { ...d, data: rounded } : d
                )
            }
        };
    }

    static scaleDataset(state: ChartState, index: number, factor: number): Partial<ChartState> | null {
        const dataset = state.chartData.datasets[index];
        if (!dataset) return null;

        const newBackups = ChartTransformService.ensureBackup(state, index);

        const scaled = dataset.data.map((value: any) => {
            const v = typeof value === 'number' ? value : (value as any)?.y || 0;
            return v * factor;
        });

        return {
            datasetBackups: newBackups,
            chartData: {
                ...state.chartData,
                datasets: state.chartData.datasets.map((d, i) =>
                    i === index ? { ...d, data: scaled } : d
                )
            }
        };
    }

    static createBackup(
        state: ChartState,
        index: number
    ): Partial<ChartState> | null {
        const dataset = state.chartData.datasets[index];
        if (!dataset) return null;

        const newBackups = new Map(state.datasetBackups);

        newBackups.set(index, {
            labels: [...(state.chartData.labels || [])] as string[],
            data: JSON.parse(JSON.stringify(dataset.data)),
            backgroundColor: Array.isArray(dataset.backgroundColor) ? [...dataset.backgroundColor] : dataset.backgroundColor,
            borderColor: Array.isArray(dataset.borderColor) ? [...dataset.borderColor] : dataset.borderColor,
            pointImages: dataset.pointImages ? [...dataset.pointImages] : [],
            pointImageConfig: dataset.pointImageConfig ? JSON.parse(JSON.stringify(dataset.pointImageConfig)) : []
        });

        return { datasetBackups: newBackups };
    }

    static restoreDatasetState(state: ChartState, index: number): Partial<ChartState> | null {
        const backup = state.datasetBackups.get(index);
        if (!backup) return null;

        const newBackups = new Map(state.datasetBackups);
        newBackups.delete(index);

        return {
            datasetBackups: newBackups,
            chartData: {
                ...state.chartData,
                labels: backup.labels,
                datasets: state.chartData.datasets.map((d, i) =>
                    i === index ? {
                        ...d,
                        data: backup.data,
                        backgroundColor: backup.backgroundColor,
                        borderColor: backup.borderColor,
                        pointImages: backup.pointImages,
                        pointImageConfig: backup.pointImageConfig
                    } : d
                )
            }
        };
    }
    static offsetDataset(state: ChartState, index: number, offset: number): Partial<ChartState> | null {
        const dataset = state.chartData.datasets[index];
        if (!dataset) return null;

        const newBackups = ChartTransformService.ensureBackup(state, index);

        const offsetted = dataset.data.map((value: any) => {
            const v = typeof value === 'number' ? value : (value as any)?.y || 0;
            return v + offset;
        });

        return {
            datasetBackups: newBackups,
            chartData: {
                ...state.chartData,
                datasets: state.chartData.datasets.map((d, i) =>
                    i === index ? { ...d, data: offsetted } : d
                )
            }
        };
    }
}
