export function generateWaterfallPluginCode(): string {
    return `
const waterfallPlugin = {
    id: 'waterfall',
    defaults: {
        enabled: false,
        showConnectors: true,
        connectorColor: 'rgba(0,0,0,0.35)',
        connectorWidth: 1.5,
        connectorStyle: 'dashed',
    },
    afterDatasetsDraw(chart, _args, pluginOptions) {
        if (!pluginOptions || !pluginOptions.enabled) return;
        if (!pluginOptions.showConnectors) return;
        const meta = chart.getDatasetMeta(0);
        if (!meta || !meta.data || meta.data.length <= 1) return;
        const ctx = chart.ctx;
        const connectorColor = pluginOptions.connectorColor || 'rgba(0,0,0,0.35)';
        const connectorWidth = pluginOptions.connectorWidth || 1.5;
        const connectorStyle = pluginOptions.connectorStyle || 'dashed';
        const indexAxis = chart.options.indexAxis || 'x';
        ctx.save();
        ctx.lineWidth = connectorWidth;
        ctx.strokeStyle = connectorColor;
        
        if (connectorStyle === 'solid') {
            ctx.setLineDash([]);
        } else if (connectorStyle === 'dotted') {
            ctx.setLineDash([1, 3]);
        } else {
            ctx.setLineDash([4, 4]);
        }

        for (let i = 0; i < meta.data.length - 1; i++) {
            const currBar = meta.data[i];
            const nextBar = meta.data[i + 1];
            if (!currBar || !nextBar) continue;

            if (indexAxis === 'x') {
                const startX = currBar.x + currBar.width / 2;
                const endX = nextBar.x - nextBar.width / 2;
                
                // Find which edge of currBar (y vs base) meets an edge of nextBar (y vs base)
                let y = currBar.y;
                if (
                    currBar.y !== undefined &&
                    currBar.base !== undefined &&
                    nextBar.y !== undefined &&
                    nextBar.base !== undefined
                ) {
                    const distTop = Math.min(Math.abs(currBar.y - nextBar.y), Math.abs(currBar.y - nextBar.base));
                    const distBottom = Math.min(Math.abs(currBar.base - nextBar.y), Math.abs(currBar.base - nextBar.base));
                    y = distTop < distBottom ? currBar.y : currBar.base;
                }

                ctx.beginPath();
                ctx.moveTo(startX, y);
                ctx.lineTo(endX, y);
                ctx.stroke();
            } else {
                const startY = currBar.y + currBar.height / 2;
                const endY = nextBar.y - nextBar.height / 2;
                
                // Find which edge of currBar (x vs base) meets an edge of nextBar (x vs base)
                let x = currBar.x;
                if (
                    currBar.x !== undefined &&
                    currBar.base !== undefined &&
                    nextBar.x !== undefined &&
                    nextBar.base !== undefined
                ) {
                    const distRight = Math.min(Math.abs(currBar.x - nextBar.x), Math.abs(currBar.x - nextBar.base));
                    const distLeft = Math.min(Math.abs(currBar.base - nextBar.x), Math.abs(currBar.base - nextBar.base));
                    x = distRight < distLeft ? currBar.x : currBar.base;
                }

                ctx.beginPath();
                ctx.moveTo(x, startY);
                ctx.lineTo(x, endY);
                ctx.stroke();
            }
        }
        ctx.restore();
    }
};

Chart.register(waterfallPlugin);
`;
}
