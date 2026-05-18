export function generateFunnelPluginCode(): string {
    return `
const funnelPlugin = {
    id: 'funnel',
    defaults: {
        enabled: false,
        showConnectors: true,
        connectorColor: 'rgba(0,0,0,0.08)',
        connectorOpacity: 0.15,
        centered: true,
        coneShape: 'box',
    },

    beforeDatasetsDraw(chart, args, pluginOptions) {
        if (!pluginOptions || !pluginOptions.enabled) return;
        if (!pluginOptions.centered) return;

        const meta = chart.getDatasetMeta(0);
        if (!meta || !meta.data || meta.data.length === 0) return;

        const dataset = chart.data.datasets[0];
        if (!dataset || !dataset.data || dataset.data.length === 0) return;

        const chartArea = chart.chartArea;
        const chartCenterX = (chartArea.left + chartArea.right) / 2;
        const maxBarWidth = chartArea.right - chartArea.left;

        const maxValue = Math.max(...dataset.data.map((v) =>
            typeof v === 'number' ? Math.abs(v) : 0
        ));
        if (maxValue === 0) return;

        const barPositions = [];

        meta.data.forEach((bar, index) => {
            const value = typeof dataset.data[index] === 'number' ? Math.abs(dataset.data[index]) : 0;
            const ratio = value / maxValue;
            const barWidth = maxBarWidth * ratio;

            const newX = chartCenterX - barWidth / 2;

            if (bar.options && bar.options.backgroundColor && bar.options.backgroundColor !== 'transparent') {
                bar._funnelOriginalColor = bar.options.backgroundColor;
            }

            let color = bar._funnelOriginalColor;
            if (!color) {
                const dsColor = dataset.backgroundColor;
                if (Array.isArray(dsColor)) {
                    color = dsColor[index] || dsColor[0] || 'rgba(0,0,0,0.1)';
                } else if (dsColor) {
                    color = dsColor;
                } else {
                    color = 'rgba(0,0,0,0.1)';
                }
            }

            barPositions.push({
                x: newX,
                width: barWidth,
                y: bar.y - bar.height / 2,
                height: bar.height,
                color: color,
            });

            bar.x = chartCenterX + barWidth / 2;
            bar.base = chartCenterX - barWidth / 2;
            bar.width = barWidth;

            if (pluginOptions.coneShape === 'sharp') {
                bar.options.backgroundColor = 'transparent';
                bar.options.borderColor = 'transparent';
            }
        });

        chart._funnelBarPositions = barPositions;
    },

    afterDatasetsDraw(chart, args, pluginOptions) {
        if (!pluginOptions || !pluginOptions.enabled) return;

        const positions = chart._funnelBarPositions;
        if (!positions || positions.length === 0) return;

        const ctx = chart.ctx;
        const connectorColor = pluginOptions.connectorColor || 'rgba(0,0,0,0.08)';
        const isSharp = pluginOptions.coneShape === 'sharp';

        ctx.save();

        if (isSharp) {
            for (let i = 0; i < positions.length; i++) {
                const current = positions[i];
                const nextWidth = i < positions.length - 1 ? positions[i + 1].width : current.width * 0.5;

                const chartArea = chart.chartArea;
                const chartCenterX = (chartArea.left + chartArea.right) / 2;
                const nextLeft = chartCenterX - nextWidth / 2;
                const nextRight = chartCenterX + nextWidth / 2;

                const topY = current.y;
                const bottomY = current.y + current.height;
                const topLeft = current.x;
                const topRight = current.x + current.width;

                ctx.beginPath();
                ctx.moveTo(topLeft, topY);
                ctx.lineTo(topRight, topY);
                ctx.lineTo(nextRight, bottomY);
                ctx.lineTo(nextLeft, bottomY);
                ctx.closePath();
                ctx.fillStyle = current.color;
                ctx.fill();
            }
        } else if (pluginOptions.showConnectors && positions.length > 1) {
            for (let i = 0; i < positions.length - 1; i++) {
                const upper = positions[i];
                const lower = positions[i + 1];

                const upperBottomY = upper.y + upper.height;
                const upperLeft = upper.x;
                const upperRight = upper.x + upper.width;

                const lowerTopY = lower.y;
                const lowerLeft = lower.x;
                const lowerRight = lower.x + lower.width;

                ctx.beginPath();
                ctx.moveTo(upperLeft, upperBottomY);
                ctx.lineTo(upperRight, upperBottomY);
                ctx.lineTo(lowerRight, lowerTopY);
                ctx.lineTo(lowerLeft, lowerTopY);
                ctx.closePath();
                ctx.fillStyle = connectorColor;
                ctx.fill();
            }
        }

        ctx.restore();

        delete chart._funnelBarPositions;
    }
};

Chart.register(funnelPlugin);
`;
}
