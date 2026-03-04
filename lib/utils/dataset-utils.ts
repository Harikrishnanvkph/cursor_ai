import { ExtendedChartData } from '../chart-defaults';

// Helper interface for dataset transformations
export interface PairedPoint {
    label: string
    value: number
    originalValue: any
    color: string
    borderColor: string
    image: string | null
    imageConfig: any | null
}

// Minimal interface for the store state needed by transformations
export interface DatasetTransformStore {
    chartData: ExtendedChartData;
    datasetBackups: Map<number, any>;
    backupDatasetState: (index: number) => void;
}

// Helper function to determine if dataset changes are meaningful
export function areDatasetChangesMeaningful(previousDataset: any, newDataset: any): boolean {
    // Check if data values changed
    if (JSON.stringify(previousDataset.data) !== JSON.stringify(newDataset.data)) {
        return true;
    }

    // Check if labels changed
    if (previousDataset.label !== newDataset.label) {
        return true;
    }

    // Check if colors changed (but ignore fill/border width changes for toggles)
    const prevColors = JSON.stringify({
        backgroundColor: previousDataset.backgroundColor,
        borderColor: previousDataset.borderColor
    });
    const newColors = JSON.stringify({
        backgroundColor: newDataset.backgroundColor,
        borderColor: newDataset.borderColor
    });

    if (prevColors !== newColors) {
        return true;
    }

    // Check if point images changed
    if (JSON.stringify(previousDataset.pointImages) !== JSON.stringify(newDataset.pointImages)) {
        return true;
    }

    return false;
}

// Helper function to apply transformations to a dataset
export const applyDatasetTransformation = (
    get: () => DatasetTransformStore,
    set: any, // Using any for setState to avoid complex typing issues with Zustand
    index: number,
    transform: (data: PairedPoint[]) => PairedPoint[]
) => {
    const { chartData, datasetBackups, backupDatasetState } = get();
    const dataset = chartData.datasets[index];
    if (!dataset) return;

    if (!datasetBackups.has(index)) {
        backupDatasetState(index);
    }

    // Map to paired format
    const paired: PairedPoint[] = dataset.data.map((value: any, i: number) => ({
        label: (chartData.labels?.[i] as string) || `Point ${i + 1}`,
        value: typeof value === 'number' ? value : (value as any)?.y || 0,
        originalValue: value,
        color: Array.isArray(dataset.backgroundColor) ? dataset.backgroundColor[i] : (dataset.backgroundColor as string),
        borderColor: Array.isArray(dataset.borderColor) ? dataset.borderColor[i] : (dataset.borderColor as string),
        image: dataset.pointImages?.[i] || null, // Type assertion handled by optional chaining and fallback
        imageConfig: dataset.pointImageConfig?.[i] || null
    }));

    // Apply transformation
    const transformed = transform(paired);

    // Unmap and update
    set({
        chartData: {
            ...chartData,
            labels: transformed.map(p => p.label),
            datasets: chartData.datasets.map((d, i) =>
                i === index ? {
                    ...d,
                    data: transformed.map(p => p.originalValue),
                    backgroundColor: transformed.map(p => p.color),
                    borderColor: transformed.map(p => p.borderColor),
                    pointImages: transformed.map(p => p.image),
                    pointImageConfig: transformed.map(p => p.imageConfig),
                    // Update sliceLabels for single mode datasets to match the new order/set
                    sliceLabels: transformed.map(p => p.label)
                } : d
            )
        }
    });
};
