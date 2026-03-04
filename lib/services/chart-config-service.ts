import { ChartOptions } from 'chart.js';
import { ExtendedChartOptions, SupportedChartType, getDefaultConfigForType } from '../chart-defaults';

export class ChartConfigService {

    static normalizeConfig(
        config: ExtendedChartOptions,
        chartType: SupportedChartType
    ): ExtendedChartOptions {
        if (chartType === 'radar') {
            const radarConfig = getDefaultConfigForType('radar');
            return {
                ...radarConfig,
                ...config,
                scales: {
                    r: {
                        ...(radarConfig.scales as any)?.r,
                        ...(config.scales as any)?.r
                    }
                }
            } as ExtendedChartOptions;
        }

        if (chartType === 'polarArea') {
            const polarConfig = getDefaultConfigForType('polarArea');
            return {
                ...polarConfig,
                ...config,
                scales: {
                    r: {
                        ...(polarConfig.scales as any)?.r,
                        ...(config.scales as any)?.r
                    }
                }
            } as ExtendedChartOptions;
        }

        return config;
    }
}
