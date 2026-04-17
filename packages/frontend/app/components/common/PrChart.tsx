import React, { useMemo } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent } from 'react-native';
import { Svg, Polyline, Circle, Line, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../../contexts/ThemeContext';

export interface PrChartPoint {
  date: string; // ISO string
  value: number;
}

interface PrChartProps {
  data: PrChartPoint[];
  height?: number;
  unit?: string;
}

/**
 * A lightweight SVG progression chart.
 *
 * Renders a polyline of value-over-time with dots at each PR log.
 * Automatically scales Y-axis to min/max, and draws 3 horizontal guides.
 */
export const PrChart: React.FC<PrChartProps> = ({ data, height = 180, unit = '' }) => {
  const theme = useTheme();
  const [width, setWidth] = React.useState(0);

  const handleLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w !== width) setWidth(w);
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          width: '100%',
          height,
          backgroundColor: theme.surfaceColor,
          borderRadius: 14,
          padding: 12,
        },
        emptyText: {
          color: theme.textMuted,
          textAlign: 'center',
          paddingTop: height / 2 - 20,
          fontFamily: theme.bodyFont,
          fontSize: 13,
        },
      }),
    [theme, height],
  );

  if (!data || data.length === 0) {
    return (
      <View style={styles.container} onLayout={handleLayout}>
        <Text style={styles.emptyText}>No PR history yet — log your first lift to start your journey 💪</Text>
      </View>
    );
  }

  const PADDING_L = 38;
  const PADDING_R = 12;
  const PADDING_T = 14;
  const PADDING_B = 22;
  const chartW = Math.max(0, width - PADDING_L - PADDING_R);
  const chartH = height - PADDING_T - PADDING_B;

  const values = data.map((d) => d.value);
  const maxVal = Math.max(...values);
  const minVal = Math.min(...values);
  const range = Math.max(1, maxVal - minVal);
  // Pad the range visually so points don't touch edges
  const yMax = maxVal + range * 0.15;
  const yMin = Math.max(0, minVal - range * 0.15);
  const yRange = Math.max(1, yMax - yMin);

  const xStep = data.length > 1 ? chartW / (data.length - 1) : 0;
  const points = data.map((d, i) => {
    const x = PADDING_L + i * xStep;
    const y = PADDING_T + chartH - ((d.value - yMin) / yRange) * chartH;
    return { x, y, value: d.value };
  });

  const polyline = points.map((p) => `${p.x},${p.y}`).join(' ');

  const guides = [0, 0.5, 1].map((t) => ({
    y: PADDING_T + chartH * t,
    label: Math.round(yMax - yRange * t),
  }));

  return (
    <View style={styles.container} onLayout={handleLayout}>
      {width > 0 && (
        <Svg width="100%" height={height - 24}>
          {/* Guide lines */}
          {guides.map((g, idx) => (
            <React.Fragment key={idx}>
              <Line
                x1={PADDING_L}
                y1={g.y}
                x2={PADDING_L + chartW}
                y2={g.y}
                stroke={theme.textMuted}
                strokeOpacity={0.15}
                strokeWidth={1}
              />
              <SvgText
                x={PADDING_L - 6}
                y={g.y + 4}
                fill={theme.textMuted}
                fontSize={10}
                textAnchor="end"
              >
                {`${g.label}${unit}`}
              </SvgText>
            </React.Fragment>
          ))}

          {/* Progression line */}
          <Polyline
            points={polyline}
            fill="none"
            stroke={theme.primaryColor}
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Data points */}
          {points.map((p, i) => (
            <Circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={i === points.length - 1 ? 5 : 3.5}
              fill={theme.primaryColor}
              stroke={theme.secondaryColor}
              strokeWidth={2}
            />
          ))}
        </Svg>
      )}
    </View>
  );
};
