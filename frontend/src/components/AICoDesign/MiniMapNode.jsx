import React from 'react';

/**
 * 自訂 MiniMap 節點渲染組件 - 進階擬真版
 * 模擬真實節點的 UI 結構：標題欄、內容區、Icon 位置等
 */
const MiniMapNode = ({ id, x, y, width, height, style, color, strokeColor, strokeWidth, className, borderRadius, shapeRendering }) => {
    // 解析 Vendor 顏色
    const getVendorColor = (nodeColor) => {
        const colorStr = String(nodeColor || '');
        if (colorStr.includes('--syn')) return '#a855f7';     // Synopsys 紫色
        if (colorStr.includes('--zuk')) return '#3b82f6';     // InPack.AI 藍色
        if (colorStr.includes('--ans')) return '#f59e0b';     // Ansys 橘色
        if (colorStr.includes('--accent')) return '#60a5fa';  // AI 淺藍
        return '#64748b'; // 預設灰
    };

    const mainColor = getVendorColor(color);
    // 節點背景色 (深色卡片背景)
    const cardBg = '#1e293b';
    const headerHeight = Math.max(height * 0.35, 8);
    const strokeW = 1.5;

    return (
        <g transform={`translate(${x}, ${y})`}>
            {/* 1. 卡片主體背景 + 邊框 */}
            <rect
                width={width}
                height={height}
                rx={4}
                ry={4}
                fill={cardBg}
                stroke={mainColor}
                strokeWidth={strokeW}
                strokeOpacity="0.8"
            />

            {/* 2. 標題欄區域 (半透明底色) */}
            <path
                d={`M 0 4 Q 0 0 4 0 L ${width - 4} 0 Q ${width} 0 ${width} 4 L ${width} ${headerHeight} L 0 ${headerHeight} Z`}
                fill={mainColor}
                fillOpacity="0.15"
            />

            {/* 3. 左側裝飾線 (強調是該 Vendor 的產品) */}
            <path
                d={`M ${strokeW / 2} 4 Q ${strokeW / 2} ${strokeW / 2} 4 ${strokeW / 2} L 4 ${height - 4} Q ${strokeW / 2} ${height - strokeW / 2} ${strokeW / 2} ${height - 4} Z`}
                fill={mainColor}
                opacity="0.6"
            />

            {/* 4. Icon 模擬 (左上圓形) */}
            <circle
                cx={12}
                cy={headerHeight / 2}
                r={3.5}
                fill={mainColor}
            />

            {/* 5. 標題文字模擬 (圓角長條) */}
            <rect
                x={20}
                y={headerHeight / 2 - 2}
                width={width - 28}
                height={4}
                rx={2}
                fill="#e2e8f0"
                fillOpacity="0.9"
            />

            {/* 6. 內容區文字模擬 (兩行灰色線條) */}
            <rect
                x={12}
                y={headerHeight + 6}
                width={width * 0.6}
                height={3}
                rx={1.5}
                fill="#64748b"
                fillOpacity="0.5"
            />
            <rect
                x={12}
                y={headerHeight + 12}
                width={width * 0.4}
                height={3}
                rx={1.5}
                fill="#64748b"
                fillOpacity="0.5"
            />

            {/* 7. 底部 Vendor Badge 模擬 (右下小藥丸形狀) */}
            <rect
                x={width - 24}
                y={height - 9}
                width={18}
                height={5}
                rx={2.5}
                fill={mainColor}
                fillOpacity="0.3"
            />
        </g>
    );
};

export default MiniMapNode;
