/**
 * UndoBridge
 * 
 * A lightweight bridge to allow the ChartStore to trigger undo captures
 * without directly importing the ChatStore, breaking the circular dependency.
 */

// Define a minimal type for the operation to avoid importing heavy types
// This matches Omit<UndoableOperation, 'id' | 'timestamp' | 'conversationId' | 'userMessage' | 'assistantMessage'>
export type BridgeCaptureOperation = {
    type: string;
    previousState: any;
    currentState: any;
    toolSource?: string;
    changeDescription?: string;
    [key: string]: any;
};

type CaptureUndoFn = (op: BridgeCaptureOperation) => void;

let captureImplementation: CaptureUndoFn | null = null;

export const UndoBridge = {
    /**
     * Registers the implementation of the capture function.
     * This should be called by the ChatStore (the implementer).
     */
    register: (fn: CaptureUndoFn) => {
        captureImplementation = fn;
    },

    /**
     * Captures an undo point using the registered implementation.
     * Use this in ChartStore and other places that need to trigger undo
     * without knowing about the ChatStore.
     */
    capture: (op: BridgeCaptureOperation) => {
        if (captureImplementation) {
            captureImplementation(op);
        } else {
            // Silently ignore if no implementation registered yet
            // This happens during initial load or if chat is not active
            // console.debug('UndoBridge: No capture implementation registered');
        }
    }
};
