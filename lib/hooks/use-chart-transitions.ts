import { useState, useEffect, useCallback, useMemo } from "react"
import { useChartStore, type ExtendedChartData, type ExtendedChartDataset, type SupportedChartType } from "@/lib/chart-store"
import { useChartActions } from "@/lib/hooks/use-chart-actions"
import {
    usePendingChartTypeChange,
    useCategoricalDataBackup,
    useScatterBubbleDataBackup,
    useChartData,
    useChartConfig,
} from "@/lib/hooks/use-chart-state"

interface ScatterBubbleSetup {
    active: boolean;
    targetType: 'scatter' | 'bubble' | null;
    direction: 'toScatter' | 'toCategorical' | null;
    backupData: ExtendedChartData | null;
    previousChartType?: SupportedChartType;
}

/**
 * Manages scatter/bubble ↔ categorical transitions: setup screen state,
 * quick transform, load sample data, restore backups, create datasets.
 */
export function useChartTransitions() {
    const chartData = useChartData();
    const chartConfig = useChartConfig();
    const pendingChartTypeChange = usePendingChartTypeChange();
    const categoricalDataBackup = useCategoricalDataBackup();
    const scatterBubbleDataBackup = useScatterBubbleDataBackup();

    const clearPendingChartTypeChange = useChartStore(s => s.clearPendingChartTypeChange);
    const setCategoricalDataBackup = useChartStore(s => s.setCategoricalDataBackup);
    const setScatterBubbleDataBackup = useChartStore(s => s.setScatterBubbleDataBackup);
    const { setChartType, updateChartConfig } = useChartActions();

    const [scatterBubbleSetup, setScatterBubbleSetup] = useState<ScatterBubbleSetup>({
        active: false, targetType: null, direction: null, backupData: null
    });
    const [showCreateDataModal, setShowCreateDataModal] = useState(false);

    // React to pendingChartTypeChange from store
    useEffect(() => {
        if (pendingChartTypeChange && pendingChartTypeChange.targetType && pendingChartTypeChange.direction) {
            const backupForRestore = pendingChartTypeChange.direction === 'toCategorical'
                ? categoricalDataBackup
                : scatterBubbleDataBackup;

            setScatterBubbleSetup({
                active: true,
                targetType: pendingChartTypeChange.targetType as any,
                direction: pendingChartTypeChange.direction,
                backupData: backupForRestore,
                previousChartType: pendingChartTypeChange.currentType || undefined
            });

            clearPendingChartTypeChange();
        }
    }, [pendingChartTypeChange, categoricalDataBackup, scatterBubbleDataBackup, clearPendingChartTypeChange]);

    const handleQuickTransform = useCallback(() => {
        if (!scatterBubbleSetup.targetType) return;
        const isBubble = scatterBubbleSetup.targetType === 'bubble';

        const transformedDatasets = chartData.datasets.map((dataset) => {
            const transformedData = dataset.data.map((value, index) => {
                const numValue = typeof value === 'number' ? value :
                    (typeof value === 'object' && value !== null && 'y' in value) ? (value as any).y : 0;
                return isBubble
                    ? { x: index, y: numValue, r: 8 + Math.random() * 12 }
                    : { x: index, y: numValue };
            });
            return { ...dataset, data: transformedData, type: scatterBubbleSetup.targetType as any };
        });

        useChartStore.setState({
            chartData: { ...chartData, labels: [], datasets: transformedDatasets }
        });
        setChartType(scatterBubbleSetup.targetType as any);
        setScatterBubbleSetup({ active: false, targetType: null, direction: null, backupData: null });
    }, [scatterBubbleSetup.targetType, chartData, setChartType]);

    const handleLoadSampleData = useCallback(() => {
        if (!scatterBubbleSetup.targetType) return;
        const isBubble = scatterBubbleSetup.targetType === 'bubble';

        const sampleScatterData = [
            { x: 10, y: 20 }, { x: 15, y: 35 }, { x: 25, y: 15 },
            { x: 30, y: 45 }, { x: 40, y: 30 }, { x: 50, y: 55 },
            { x: 55, y: 40 }, { x: 65, y: 60 }
        ];

        const sampleBubbleData = [
            { x: 10, y: 20, r: 10 }, { x: 20, y: 35, r: 15 }, { x: 35, y: 25, r: 8 },
            { x: 45, y: 50, r: 20 }, { x: 55, y: 30, r: 12 }, { x: 70, y: 45, r: 18 },
            { x: 80, y: 60, r: 14 }, { x: 90, y: 40, r: 10 }
        ];

        const sampleDataset: ExtendedChartDataset = {
            label: isBubble ? 'Sample Bubbles' : 'Sample Points',
            data: isBubble ? sampleBubbleData : sampleScatterData,
            backgroundColor: isBubble ? 'rgba(59, 130, 246, 0.6)' : '#3b82f6',
            borderColor: '#1d4ed8',
            borderWidth: 1,
            type: scatterBubbleSetup.targetType as any,
            chartType: scatterBubbleSetup.targetType as any,
        };

        useChartStore.setState({ chartData: { labels: [], datasets: [sampleDataset] } });
        setChartType(scatterBubbleSetup.targetType as any);
        setScatterBubbleSetup({ active: false, targetType: null, direction: null, backupData: null });
    }, [scatterBubbleSetup.targetType, setChartType]);

    const handleLoadCategoricalData = useCallback(() => {
        if (!scatterBubbleSetup.targetType || scatterBubbleSetup.direction !== 'toCategorical') return;
        const targetType = scatterBubbleSetup.targetType as string;

        const sampleCategoricalData = {
            labels: ['January', 'February', 'March', 'April', 'May', 'June'],
            datasets: [{
                label: 'Sample Dataset',
                data: [12, 19, 3, 5, 2, 3],
                backgroundColor: [
                    'rgba(54, 162, 235, 0.8)', 'rgba(255, 99, 132, 0.8)',
                    'rgba(75, 192, 192, 0.8)', 'rgba(255, 206, 86, 0.8)',
                    'rgba(153, 102, 255, 0.8)', 'rgba(255, 159, 64, 0.8)',
                ],
                borderColor: [
                    'rgba(54, 162, 235, 1)', 'rgba(255, 99, 132, 1)',
                    'rgba(75, 192, 192, 1)', 'rgba(255, 206, 86, 1)',
                    'rgba(153, 102, 255, 1)', 'rgba(255, 159, 64, 1)',
                ],
                borderWidth: 2,
            }]
        };

        useChartStore.setState({ chartData: sampleCategoricalData });
        setChartType(targetType as any);

        const newLegendType = (targetType === 'pie' || targetType === 'doughnut' || targetType === 'polarArea') ? 'slice' : 'dataset';
        updateChartConfig({
            ...chartConfig,
            plugins: { ...chartConfig.plugins, ...({ legendType: newLegendType } as any) }
        } as any);

        setScatterBubbleSetup({ active: false, targetType: null, direction: null, backupData: null });
        setCategoricalDataBackup(null);
    }, [scatterBubbleSetup, chartConfig, setChartType, updateChartConfig, setCategoricalDataBackup]);

    const handleRestoreCategoricalData = useCallback(() => {
        if (!scatterBubbleSetup.backupData || scatterBubbleSetup.direction !== 'toCategorical') return;
        const targetType = scatterBubbleSetup.targetType as string;

        useChartStore.setState({ chartData: scatterBubbleSetup.backupData });
        setChartType(targetType as any);

        const newLegendType = (targetType === 'pie' || targetType === 'doughnut' || targetType === 'polarArea') ? 'slice' : 'dataset';
        updateChartConfig({
            ...chartConfig,
            plugins: { ...chartConfig.plugins, ...({ legendType: newLegendType } as any) }
        } as any);

        setScatterBubbleSetup({ active: false, targetType: null, direction: null, backupData: null });
        setCategoricalDataBackup(null);
    }, [scatterBubbleSetup, chartConfig, setChartType, updateChartConfig, setCategoricalDataBackup]);

    const handleRestoreScatterData = useCallback(() => {
        if (!scatterBubbleSetup.backupData || scatterBubbleSetup.direction !== 'toScatter') return;
        const targetType = scatterBubbleSetup.targetType as string;

        useChartStore.setState({ chartData: scatterBubbleSetup.backupData });
        setChartType(targetType as any);

        updateChartConfig({
            ...chartConfig,
            plugins: { ...chartConfig.plugins, ...({ legendType: 'dataset' } as any) }
        } as any);

        setScatterBubbleSetup({ active: false, targetType: null, direction: null, backupData: null });
        setScatterBubbleDataBackup(null);
    }, [scatterBubbleSetup, chartConfig, setChartType, updateChartConfig, setScatterBubbleDataBackup]);

    const handleOpenCreateModal = useCallback(() => {
        setShowCreateDataModal(true);
    }, []);

    const handleCreateDataset = useCallback((
        datasetName: string,
        data: Array<{ x: number, y: number, r?: number }>,
        backgroundColor: string
    ) => {
        if (!scatterBubbleSetup.targetType) return;

        const newDataset: ExtendedChartDataset = {
            label: datasetName,
            data: data,
            backgroundColor: backgroundColor,
            borderColor: backgroundColor,
            borderWidth: 1,
            type: scatterBubbleSetup.targetType as any
        };

        useChartStore.setState({ chartData: { labels: [], datasets: [newDataset] } });
        setChartType(scatterBubbleSetup.targetType as any);
        setScatterBubbleSetup({ active: false, targetType: null, direction: null, backupData: null });
    }, [scatterBubbleSetup.targetType, setChartType]);

    const handleCancelSetup = useCallback(() => {
        setScatterBubbleSetup({ active: false, targetType: null, direction: null, backupData: null });
    }, []);

    return useMemo(() => ({
        scatterBubbleSetup,
        showCreateDataModal,
        setShowCreateDataModal,
        handleQuickTransform,
        handleLoadSampleData,
        handleLoadCategoricalData,
        handleRestoreCategoricalData,
        handleRestoreScatterData,
        handleOpenCreateModal,
        handleCreateDataset,
        handleCancelSetup,
    }), [
        scatterBubbleSetup,
        showCreateDataModal,
        handleQuickTransform,
        handleLoadSampleData,
        handleLoadCategoricalData,
        handleRestoreCategoricalData,
        handleRestoreScatterData,
        handleOpenCreateModal,
        handleCreateDataset,
        handleCancelSetup,
    ]);
}
