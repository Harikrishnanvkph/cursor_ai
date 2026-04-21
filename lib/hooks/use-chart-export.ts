import { useCallback, useMemo } from "react"
import { useChartStore } from "@/lib/chart-store"
import { useTemplateStore } from "@/lib/template-store"
import { downloadChartAsHTML } from "@/lib/html-exporter"
import {
    useChartConfig,
    useChartType,
    useShowLabels,
    useShowImages,
    useFillArea,
    useShowBorder,
} from "@/lib/hooks/use-chart-state"
import { getBackgroundConfig } from "@/lib/utils/dimension-utils"

/**
 * Manages all chart export handlers: PNG, JPEG, HTML, CSV, and export settings navigation.
 */
export function useChartExport(options?: {
    onToggleLeftSidebar?: () => void;
    isLeftSidebarCollapsed?: boolean;
}) {
    const chartConfig = useChartConfig();
    const chartType = useChartType();
    const showLabels = useShowLabels();
    const showImages = useShowImages();
    const fillArea = useFillArea();
    const showBorder = useShowBorder();

    const getGlobalChartRef = () => useChartStore.getState().globalChartRef;

    const handleExport = useCallback(() => {
        if (!getGlobalChartRef()?.current) {
            console.error('Chart ref is not available');
            return;
        }

        const chartInstance = getGlobalChartRef()?.current;
        const bgConfig = getBackgroundConfig(chartConfig);

        if (chartInstance.exportToImage) {
            try {
                chartInstance.exportToImage({
                    background: bgConfig,
                    fileNamePrefix: 'chart',
                    quality: 1.0
                });
            } catch (error) {
                console.error('Error during export:', error);
            }
        } else {
            console.error('Export plugin not initialized on chart instance');
        }
    }, [chartConfig]);

    const handleExportHTML = useCallback(async () => {
        let currentDragState = {};
        if (getGlobalChartRef()?.current) {
            try {
                const { getCurrentDragState } = require('@/lib/custom-label-plugin');
                currentDragState = getCurrentDragState(getGlobalChartRef()?.current);
            } catch (error) {
                console.warn('Could not capture drag state:', error);
            }
        }

        const getExportDimensions = (): { width: number; height: number } => {
            // Prefer template dimension override when in template mode
            const templateStore = useTemplateStore.getState();
            if (templateStore.dimensionOverride) {
                return templateStore.dimensionOverride;
            }
            if (getGlobalChartRef()?.current?.canvas) {
                return {
                    width: getGlobalChartRef()?.current?.canvas.width,
                    height: getGlobalChartRef()?.current?.canvas.height
                };
            }
            return { width: 800, height: 600 };
        };

        const dimensions = getExportDimensions();

        try {
            const result = await downloadChartAsHTML({
                title: (chartConfig.plugins?.title?.text as string) || "Chart Export",
                subtitle: (chartConfig.plugins?.subtitle?.display && chartConfig.plugins?.subtitle?.text)
                    ? (chartConfig.plugins?.subtitle?.text as string)
                    : undefined,
                width: dimensions.width,
                height: dimensions.height,
                backgroundColor: getBackgroundConfig(chartConfig).color || "#ffffff",
                includeResponsive: true,
                includeAnimations: true,
                includeTooltips: true,
                includeLegend: chartConfig?.plugins?.legend?.display ?? true,
                fileName: `chart-${chartType}-${new Date().toISOString().slice(0, 10)}.html`,
                template: "plain",
                dragState: currentDragState,
                showImages: showImages,
                showLabels: showLabels,
                fillArea: fillArea,
                showBorder: showBorder
            });

            if (result && !result.success) {
                console.error(result.error);
            }
        } catch (error) {
            console.error('Error exporting HTML:', error);
        }
    }, [chartConfig, chartType, showImages, showLabels, fillArea, showBorder]);

    const handleExportJPEG = useCallback(() => {
        if (getGlobalChartRef()?.current) {
            const url = getGlobalChartRef()?.current?.toBase64Image('image/jpeg', 1.0);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'chart.jpeg';
            link.click();
        }
    }, []);

    const handleExportCSV = useCallback(() => {
        alert('CSV export is not implemented yet.');
    }, []);

    const handleExportSettings = useCallback(() => {
        if (options?.onToggleLeftSidebar && options?.isLeftSidebarCollapsed) {
            options.onToggleLeftSidebar();
        }
        const event = new CustomEvent('changeActiveTab', { detail: { tab: 'export' } });
        window.dispatchEvent(event);
    }, [options?.onToggleLeftSidebar, options?.isLeftSidebarCollapsed]);

    const handleRefresh = useCallback(() => {
        if (getGlobalChartRef()?.current) {
            getGlobalChartRef()?.current?.update("active");
        }
    }, []);

    return useMemo(() => ({
        handleExport,
        handleExportHTML,
        handleExportJPEG,
        handleExportCSV,
        handleExportSettings,
        handleRefresh,
    }), [
        handleExport,
        handleExportHTML,
        handleExportJPEG,
        handleExportCSV,
        handleExportSettings,
        handleRefresh,
    ]);
}
