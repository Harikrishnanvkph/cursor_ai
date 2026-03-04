// Helper to capture dataset undo points
// extracted from chart-store.ts

export function attemptCaptureDatasetUndo(
    hasJSON: boolean,
    previousState: any,
    newState: any,
    changeDescription: string,
    toolSource: string = 'dataset-panel'
) {
    if (hasJSON) {
        try {
            // Dynamic require to avoid circular dependency issues if any
            // In the original file it was requiring './chat-store'
            // We should arguably inject captureUndoPoint or move this logic to chat-store entirely
            // But for now, preserving the dynamic require behavior
            const { captureUndoPoint } = require('../chat-store');

            captureUndoPoint({
                type: 'manual_dataset_change',
                previousState: previousState,
                currentState: {
                    chartType: newState.chartType,
                    chartData: newState.chartData,
                    chartConfig: newState.chartConfig
                },
                toolSource: toolSource,
                changeDescription: changeDescription
            });
        } catch (error) {
            console.warn('Failed to capture undo point for dataset change:', error);
        }
    }
}
