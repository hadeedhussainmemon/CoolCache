import React, { useMemo, useState } from 'react';

const SalesChart = ({ data }) => {
    // data format: [{ name: 'Jan', value: 4000 }, ...]
    const [hoveredIndex, setHoveredIndex] = useState(null);

    const processedData = useMemo(() => {
        if (!data || data.length === 0) return [];
        return data;
    }, [data]);

    if (processedData.length === 0) {
        return (
            <div className="w-full h-64 flex items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
                <p className="text-gray-400">No sales data available</p>
            </div>
        );
    }

    // Dimensions
    const padding = 40;
    const width = 1000;
    const height = 300;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2; // Y Axis space
    const barWidth = 40;
    const gap = (chartWidth - (processedData.length * barWidth)) / (processedData.length - 1);
    const maxValue = Math.max(...processedData.map(d => d.value), 100);

    // Helper to map value to Y coord
    const getY = (val) => chartHeight - (val / maxValue) * chartHeight + padding;

    return (
        <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h3 className="text-xl font-bold text-gray-800">Monthly Sales Record</h3>
                    <p className="text-sm text-gray-500">Revenue performance over the last {processedData.length} months</p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-uppercase text-gray-400 font-semibold tracking-wider">TOTAL REVENUE</p>
                    <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
                        Rs. {processedData.reduce((acc, curr) => acc + curr.value, 0).toLocaleString()}
                    </p>
                </div>
            </div>

            <div className="relative w-full overflow-hidden" style={{ aspectRatio: '16/9', maxHeight: '350px' }}>
                <svg
                    viewBox={`0 0 ${width} ${height + 20}`}
                    className="w-full h-full overflow-visible"
                    preserveAspectRatio="none"
                >
                    {/* Grid lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((tick, i) => {
                        const y = chartHeight - (chartHeight * tick) + padding;
                        return (
                            <g key={i}>
                                <line
                                    x1={padding}
                                    y1={y}
                                    x2={width - padding}
                                    y2={y}
                                    stroke="#f3f4f6"
                                    strokeDasharray="4 4"
                                />
                                <text
                                    x={padding - 10}
                                    y={y + 5}
                                    textAnchor="end"
                                    className="fill-gray-400 text-[10px] font-sans"
                                >
                                    {Math.round(maxValue * tick / 1000)}k
                                </text>
                            </g>
                        );
                    })}

                    {/* Bars */}
                    {processedData.map((d, i) => {
                        const x = padding + (i * (barWidth + gap));
                        const y = getY(d.value);
                        const h = chartHeight - (y - padding); // height of bar from bottom
                        const isHovered = hoveredIndex === i;

                        return (
                            <g
                                key={i}
                                onMouseEnter={() => setHoveredIndex(i)}
                                onMouseLeave={() => setHoveredIndex(null)}
                                className="cursor-pointer transition-all duration-300"
                            >
                                {/* Bar */}
                                <rect
                                    x={x}
                                    y={y}
                                    width={barWidth}
                                    height={h}
                                    rx={4}
                                    fill={isHovered ? "url(#hoverGradient)" : "url(#barGradient)"}
                                    className="transition-all duration-300 ease-out"
                                    filter={isHovered ? "url(#glow)" : ""}
                                />

                                {/* Value Label (on hover or always for prominent ones) */}
                                <text
                                    x={x + barWidth / 2}
                                    y={y - 10}
                                    textAnchor="middle"
                                    className={`fill-purple-600 text-xs font-bold transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
                                >
                                    Rs. {(d.value / 1000).toFixed(1)}k
                                </text>

                                {/* X Axis Label */}
                                <text
                                    x={x + barWidth / 2}
                                    y={height - padding + 20}
                                    textAnchor="middle"
                                    className={`text-xs font-medium transition-colors ${isHovered ? 'fill-purple-600 font-bold' : 'fill-gray-400'}`}
                                >
                                    {d.name}
                                </text>
                            </g>
                        );
                    })}

                    {/* Defs for gradients/filters */}
                    <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#8b5cf6" />
                            <stop offset="100%" stopColor="#c084fc" stopOpacity="0.6" />
                        </linearGradient>
                        <linearGradient id="hoverGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#ec4899" />
                            <stop offset="100%" stopColor="#f472b6" stopOpacity="0.8" />
                        </linearGradient>
                        <filter id="glow">
                            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>
                </svg>
            </div>
        </div>
    );
};

export default SalesChart;
