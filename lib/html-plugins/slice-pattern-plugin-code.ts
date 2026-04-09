/**
 * Generate the Slice Pattern plugin code for HTML export.
 * This produces a self-registering IIFE that replicates the
 * runtime slicePatternPlugin behaviour inside standalone HTML files.
 */
export function generateSlicePatternPluginCode(): string {
    return `
// Slice Pattern Plugin for HTML Export
(function() {
    // ── Tile renderers ──
    var renderers = {
        verticalLines: function(ctx, s, c, lw) {
            ctx.strokeStyle = c; ctx.lineWidth = lw;
            ctx.beginPath(); ctx.moveTo(s/2,0); ctx.lineTo(s/2,s); ctx.stroke();
        },
        horizontalLines: function(ctx, s, c, lw) {
            ctx.strokeStyle = c; ctx.lineWidth = lw;
            ctx.beginPath(); ctx.moveTo(0,s/2); ctx.lineTo(s,s/2); ctx.stroke();
        },
        diagonalRight: function(ctx, s, c, lw) {
            ctx.strokeStyle = c; ctx.lineWidth = lw;
            ctx.beginPath();
            ctx.moveTo(0,0); ctx.lineTo(s,s);
            ctx.moveTo(-s,0); ctx.lineTo(s,s*2);
            ctx.moveTo(0,-s); ctx.lineTo(s*2,s);
            ctx.stroke();
        },
        diagonalLeft: function(ctx, s, c, lw) {
            ctx.strokeStyle = c; ctx.lineWidth = lw;
            ctx.beginPath();
            ctx.moveTo(s,0); ctx.lineTo(0,s);
            ctx.moveTo(s*2,0); ctx.lineTo(0,s*2);
            ctx.moveTo(s,-s); ctx.lineTo(-s,s);
            ctx.stroke();
        },
        crosshatch: function(ctx, s, c, lw) {
            ctx.strokeStyle = c; ctx.lineWidth = lw;
            ctx.beginPath();
            ctx.moveTo(s/2,0); ctx.lineTo(s/2,s);
            ctx.moveTo(0,s/2); ctx.lineTo(s,s/2);
            ctx.stroke();
        },
        diagonalCrosshatch: function(ctx, s, c, lw) {
            ctx.strokeStyle = c; ctx.lineWidth = lw;
            ctx.beginPath();
            ctx.moveTo(0,0); ctx.lineTo(s,s);
            ctx.moveTo(s,0); ctx.lineTo(0,s);
            ctx.stroke();
        },
        dots: function(ctx, s, c, lw) {
            ctx.fillStyle = c;
            var r = Math.max(lw, 1.5);
            ctx.beginPath(); ctx.arc(s/2, s/2, r, 0, Math.PI*2); ctx.fill();
        },
        dashes: function(ctx, s, c, lw) {
            ctx.strokeStyle = c; ctx.lineWidth = lw;
            var d = s * 0.45;
            ctx.beginPath(); ctx.moveTo((s-d)/2, s/2); ctx.lineTo((s+d)/2, s/2); ctx.stroke();
        },
        zigzag: function(ctx, s, c, lw) {
            ctx.strokeStyle = c; ctx.lineWidth = lw;
            ctx.beginPath();
            ctx.moveTo(0, s*0.75);
            ctx.lineTo(s/4, s*0.25);
            ctx.lineTo(s/2, s*0.75);
            ctx.lineTo(s*0.75, s*0.25);
            ctx.lineTo(s, s*0.75);
            ctx.stroke();
        },
        checkerboard: function(ctx, s, c) {
            ctx.fillStyle = c;
            var h = s/2;
            ctx.fillRect(0,0,h,h);
            ctx.fillRect(h,h,h,h);
        }
    };

    // ── Pattern cache ──
    var cache = {};
    function getPattern(chartCtx, type, color, lw, spacing) {
        var key = type + '_' + color + '_' + lw + '_' + spacing;
        if (cache[key]) return cache[key];
        var fn = renderers[type];
        if (!fn) return null;
        var tile = document.createElement('canvas');
        tile.width = spacing; tile.height = spacing;
        var tc = tile.getContext('2d');
        if (!tc) return null;
        fn(tc, spacing, color, lw);
        var pat = chartCtx.createPattern(tile, 'repeat');
        if (!pat) return null;
        cache[key] = pat;
        return pat;
    }

    function patternFor(ds, idx) {
        if (ds.datasetPattern && ds.datasetPattern.type) return ds.datasetPattern;
        if (ds.slicePatterns && ds.slicePatterns[idx] && ds.slicePatterns[idx].type) return ds.slicePatterns[idx];
        return null;
    }

    var slicePatternPlugin = {
        id: 'slicePattern',
        afterDatasetDraw: function(chart, args) {
            var ctx = chart.ctx;
            var dsIdx = args.index;
            var dataset = (chart.data.datasets || [])[dsIdx];
            if (!dataset) return;

            var meta = chart.getDatasetMeta(dsIdx);
            if (meta.hidden) return;
            var mtype = meta.type;

                if (mtype === 'bar') {
                    meta.data.forEach(function(el, elIdx) {
                        var pc = patternFor(dataset, elIdx);
                        if (!pc) return;
                        var opacity = pc.opacity != null ? pc.opacity / 100 : 1;
                        var pat = getPattern(ctx, pc.type, pc.color, pc.lineWidth, pc.spacing);
                        if (!pat) return;
                        var p = el.getProps(['x','y','base','width','height','horizontal'], true);
                        if (p.x === undefined || p.y === undefined) return;
                        var isH = p.horizontal !== undefined ? p.horizontal : chart.options.indexAxis === 'y';
                        ctx.save();
                        ctx.globalAlpha = opacity;
                        ctx.beginPath();
                        if (!isH) {
                            var l = p.x - p.width/2, t = Math.min(p.y,p.base), w = p.width, h = Math.abs(p.base-p.y);
                            ctx.rect(l,t,w,h);
                        } else {
                            var l2 = Math.min(p.x,p.base), t2 = p.y - p.height/2, w2 = Math.abs(p.x-p.base), h2 = p.height;
                            ctx.rect(l2,t2,w2,h2);
                        }
                        ctx.clip();
                        ctx.fillStyle = pat;
                        var ca = chart.chartArea;
                        ctx.fillRect(ca.left-10, ca.top-10, ca.right-ca.left+20, ca.bottom-ca.top+20);
                        ctx.restore();
                    });
                }

                else if (mtype === 'pie' || mtype === 'doughnut' || mtype === 'polarArea') {
                    meta.data.forEach(function(el, elIdx) {
                        var pc = patternFor(dataset, elIdx);
                        if (!pc) return;
                        var opacity = pc.opacity != null ? pc.opacity / 100 : 1;
                        var pat = getPattern(ctx, pc.type, pc.color, pc.lineWidth, pc.spacing);
                        if (!pat) return;
                        var p = el.getProps(['x','y','startAngle','endAngle','innerRadius','outerRadius'], true);
                        if (p.startAngle === undefined) return;
                        ctx.save();
                        ctx.globalAlpha = opacity;
                        ctx.beginPath();
                        ctx.arc(p.x, p.y, p.outerRadius, p.startAngle, p.endAngle);
                        if (p.innerRadius > 0) ctx.arc(p.x, p.y, p.innerRadius, p.endAngle, p.startAngle, true);
                        else ctx.lineTo(p.x, p.y);
                        ctx.closePath();
                        ctx.clip();
                        ctx.fillStyle = pat;
                        ctx.fillRect(p.x - p.outerRadius - 5, p.y - p.outerRadius - 5, p.outerRadius*2+10, p.outerRadius*2+10);
                        ctx.restore();
                    });
                }

                else if (mtype === 'line' || mtype === 'radar') {
                    var pc = dataset.datasetPattern;
                    if (!pc || !pc.type) return;
                    var opacity = pc.opacity != null ? pc.opacity / 100 : 1;
                    var pat = getPattern(ctx, pc.type, pc.color, pc.lineWidth, pc.spacing);
                    if (!pat) return;
                    var pts = meta.data;
                    if (pts.length < 2) return;
                    ctx.save();
                    ctx.globalAlpha = opacity;
                    ctx.beginPath();
                    if (mtype === 'radar') {
                        var fp = pts[0].getProps(['x','y'], true);
                        ctx.moveTo(fp.x, fp.y);
                        for (var i = 1; i < pts.length; i++) { var pt = pts[i].getProps(['x','y'], true); ctx.lineTo(pt.x, pt.y); }
                        ctx.closePath();
                    } else {
                        var ca = chart.chartArea;
                        var sc = chart.scales['y'] || chart.scales['x'];
                        var baseY = sc ? sc.getPixelForValue(sc.min || 0) : ca.bottom;
                        var fp2 = pts[0].getProps(['x','y'], true);
                        ctx.moveTo(fp2.x, fp2.y);
                        for (var j = 1; j < pts.length; j++) { var pt2 = pts[j].getProps(['x','y'], true); ctx.lineTo(pt2.x, pt2.y); }
                        var lp = pts[pts.length-1].getProps(['x','y'], true);
                        ctx.lineTo(lp.x, baseY); ctx.lineTo(fp2.x, baseY);
                        ctx.closePath();
                    }
                    ctx.clip();
                    ctx.fillStyle = pat;
                    var ca2 = chart.chartArea;
                    ctx.fillRect(ca2.left-10, ca2.top-10, ca2.right-ca2.left+20, ca2.bottom-ca2.top+20);
                    ctx.restore();
                }
        }
    };

    Chart.register(slicePatternPlugin);
})();
`;
}
