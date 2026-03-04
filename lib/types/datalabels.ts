import { Chart, ChartDataset, ChartType } from 'chart.js';

declare module 'chart.js' {
    // Define the types for chartjs-plugin-datalabels
    // Based on https://chartjs-plugin-datalabels.netlify.app/guide/typescript.html
    interface Context {
        active: boolean;
        chart: Chart;
        dataIndex: number;
        dataset: ChartDataset;
        datasetIndex: number;
    }

    interface FontOptions {
        family?: string;
        lineHeight?: number | string;
        size?: number;
        style?: string;
        weight?: string | number;
    }

    interface DatalabelsPluginOptions {
        align?: 'start' | 'center' | 'end' | number;
        anchor?: 'start' | 'center' | 'end';
        backgroundColor?: string | ((context: Context) => string) | null;
        borderColor?: string | ((context: Context) => string) | null;
        borderRadius?: number;
        borderWidth?: number;
        clamp?: boolean;
        clip?: boolean;
        color?: string | ((context: Context) => string);
        display?: boolean | 'auto' | ((context: Context) => boolean | 'auto');
        font?: FontOptions | ((context: Context) => FontOptions);
        formatter?: (value: any, context: Context) => any;
        labels?: { [key: string]: DatalabelsLabelOptions };
        listeners?: { [key: string]: (context: Context, event: Event) => void };
        offset?: number;
        opacity?: number;
        padding?: number | object;
        rotation?: number;
        textAlign?: 'start' | 'center' | 'end' | 'left' | 'right';
        textStrokeColor?: string | ((context: Context) => string);
        textStrokeWidth?: number;
        textShadowBlur?: number;
        textShadowColor?: string | ((context: Context) => string);
    }

    interface DatalabelsLabelOptions extends DatalabelsPluginOptions { }

    // Augment the existing PluginOptionsByType from Chart.js by redeclaring it.
    // TypeScript's declaration merging will add our 'datalabels' property.
    interface PluginOptionsByType<TType extends ChartType = ChartType> {
        datalabels?: DatalabelsPluginOptions;
    }

    // Extend ChartTypeRegistry to include horizontalBar
    interface ChartTypeRegistry {
        horizontalBar: ChartTypeRegistry['bar'];
    }
}
