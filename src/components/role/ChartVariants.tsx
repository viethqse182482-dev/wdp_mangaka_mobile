import { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, {
  Circle,
  Defs,
  G,
  LinearGradient,
  Line,
  Path,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import { colors, radius, spacing, typography } from '../../theme/colors';
import { GlassCard } from '../../theme/uiPrimitives';
import { ChapterStatusDistribution } from '../../services/roleService';

export interface ChartPoint {
  label: string;
  value: number;
}

const compact = (value: number) => new Intl.NumberFormat('vi-VN', {
  notation: 'compact', maximumFractionDigits: 1,
}).format(value);

export function TrendLineChart({ title, points }: { title: string; points: ChartPoint[] }) {
  const [width, setWidth] = useState(0);
  const chartHeight = 184;
  const plotTop = 20;
  const baseline = 142;
  const paddingX = 18;
  const max = Math.max(1, ...points.map((point) => point.value));
  const coords = points.map((point, index) => ({
    x: paddingX + (points.length <= 1 ? Math.max(0, width - paddingX * 2) / 2 : ((width - paddingX * 2) * index) / (points.length - 1)),
    y: plotTop + (1 - point.value / max) * (baseline - plotTop),
  }));
  const linePath = smoothPath(coords);
  const areaPath = coords.length
    ? `${linePath} L ${coords[coords.length - 1].x} ${baseline} L ${coords[0].x} ${baseline} Z`
    : '';

  return (
    <GlassCard innerStyle={styles.card}>
      <View style={styles.heading}>
        <View><Text style={styles.title}>{title}</Text><Text style={styles.subtitle}>Diễn biến theo thời gian thực</Text></View>
        <View style={styles.liveBadge}><View style={styles.liveDot} /><Text style={styles.liveText}>LIVE</Text></View>
      </View>
      <View style={styles.svgWrap} onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}>
        {width > 0 ? (
          <Svg width={width} height={chartHeight}>
            <Defs>
              <LinearGradient id="area" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={colors.cyan} stopOpacity="0.42" />
                <Stop offset="0.7" stopColor={colors.accent} stopOpacity="0.10" />
                <Stop offset="1" stopColor={colors.accent} stopOpacity="0" />
              </LinearGradient>
              <LinearGradient id="trend" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor={colors.accent} />
                <Stop offset="0.5" stopColor={colors.cyan} />
                <Stop offset="1" stopColor={colors.success} />
              </LinearGradient>
            </Defs>
            {[0, 1, 2, 3].map((index) => {
              const y = plotTop + index * ((baseline - plotTop) / 3);
              return <Line key={index} x1={paddingX} x2={width - paddingX} y1={y} y2={y} stroke={colors.glassBorder} strokeWidth="1" strokeDasharray="4 6" />;
            })}
            {areaPath ? <Path d={areaPath} fill="url(#area)" /> : null}
            {linePath ? <Path d={linePath} fill="none" stroke="url(#trend)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /> : null}
            {coords.map((point, index) => (
              <G key={index}>
                <Circle cx={point.x} cy={point.y} r="7" fill={colors.background} stroke={colors.cyan} strokeWidth="2" />
                <Circle cx={point.x} cy={point.y} r="3" fill={colors.white} />
                <SvgText x={point.x} y={point.y - 12} fill={colors.textSecondary} fontSize="9" textAnchor="middle">{compact(points[index].value)}</SvgText>
                <SvgText x={point.x} y={166} fill={colors.textMuted} fontSize="9" textAnchor="middle">{points[index].label}</SvgText>
              </G>
            ))}
          </Svg>
        ) : null}
      </View>
      <View style={styles.summary}><Text style={styles.summaryValue}>{compact(points.reduce((sum, point) => sum + point.value, 0))}</Text><Text style={styles.summaryLabel}>tổng lượt xem trong giai đoạn</Text></View>
    </GlassCard>
  );
}

export function ChapterStatusChart({ data }: { data: ChapterStatusDistribution }) {
  const size = 132;
  const center = size / 2;
  const radiusValue = 48;
  const circumference = 2 * Math.PI * radiusValue;
  const total = Math.max(0, data.total);
  const segments = [
    { key: 'approved', label: 'Đã duyệt', value: data.approved, color: colors.success },
    { key: 'pending', label: 'Chờ duyệt', value: data.pending, color: colors.warning },
    { key: 'revision', label: 'Cần chỉnh sửa', value: data.revision, color: colors.danger },
  ];
  let offset = 0;

  return (
    <GlassCard innerStyle={styles.statusCard}>
      <View style={styles.statusHeading}>
        <View style={styles.statusIcon}><Ionicons name="book-outline" size={16} color={colors.warning} /></View>
        <View>
          <Text style={styles.title}>Trạng thái chương</Text>
          <Text style={styles.subtitle}>Phân bổ trạng thái kiểm duyệt</Text>
        </View>
      </View>
      <View style={styles.statusContent}>
        <View style={styles.donutWrap}>
          <Svg width={size} height={size}>
            <Circle cx={center} cy={center} r={radiusValue} fill="none" stroke={colors.glassMedium} strokeWidth="18" />
            <G rotation="-90" origin={`${center}, ${center}`}>
              {total > 0 ? segments.map((segment) => {
                const length = segment.value / total * circumference;
                const dashLength = Math.max(0, length - (segment.value > 0 ? 3 : 0));
                const currentOffset = offset;
                offset += length;
                return segment.value > 0 ? (
                  <Circle
                    key={segment.key}
                    cx={center}
                    cy={center}
                    r={radiusValue}
                    fill="none"
                    stroke={segment.color}
                    strokeWidth="18"
                    strokeLinecap="butt"
                    strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                    strokeDashoffset={-currentOffset}
                  />
                ) : null;
              }) : null}
            </G>
            <SvgText x={center} y={center - 2} fill={colors.textPrimary} fontSize="22" fontFamily={typography.fontFamilyBold} textAnchor="middle">{compact(total)}</SvgText>
            <SvgText x={center} y={center + 17} fill={colors.textMuted} fontSize="9" textAnchor="middle">Tổng chương</SvgText>
          </Svg>
        </View>
        <View style={styles.statusLegend}>
          {segments.map((segment) => {
            const percent = total > 0 ? Math.round(segment.value / total * 100) : 0;
            return (
              <View key={segment.key} style={styles.statusLegendRow}>
                <View style={[styles.statusLegendDot, { backgroundColor: segment.color }]} />
                <Text style={styles.statusLegendLabel}>{segment.label}</Text>
                <Text style={styles.statusLegendValue}>{NUMBER_FORMAT.format(segment.value)}</Text>
                <Text style={styles.statusLegendPercent}>{percent}%</Text>
              </View>
            );
          })}
        </View>
      </View>
    </GlassCard>
  );
}

const NUMBER_FORMAT = new Intl.NumberFormat('vi-VN');

export function HorizontalRankingChart({ title, points }: { title: string; points: ChartPoint[] }) {
  const max = Math.max(1, ...points.map((point) => point.value));
  return (
    <GlassCard innerStyle={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>So sánh tương quan giữa các truyện dẫn đầu</Text>
      <View style={styles.horizontalList}>
        {points.map((point, index) => {
          const percent = Math.max(point.value > 0 ? 5 : 1, point.value / max * 100);
          return (
            <View key={`${point.label}-${index}`} style={styles.horizontalRow}>
              <View style={[styles.rankBubble, index < 3 && styles.rankBubbleTop]}><Text style={[styles.rankText, index < 3 && styles.rankTextTop]}>{index + 1}</Text></View>
              <View style={styles.horizontalContent}>
                <View style={styles.horizontalMeta}><Text style={styles.horizontalLabel} numberOfLines={1}>{point.label}</Text><Text style={styles.horizontalValue}>{compact(point.value)}</Text></View>
                <View style={styles.miniSvg}>
                  <Svg width="100%" height="12">
                    <Defs>
                      <LinearGradient id={`rank-${index}`} x1="0" y1="0" x2="1" y2="0">
                        <Stop offset="0" stopColor={index < 3 ? colors.warning : colors.accent} />
                        <Stop offset="1" stopColor={index < 3 ? colors.warm : colors.cyan} />
                      </LinearGradient>
                    </Defs>
                    <Rect x="0" y="1" width="100%" height="10" rx="5" fill={colors.glassLight} />
                    <Rect x="0" y="1" width={`${percent}%`} height="10" rx="5" fill={`url(#rank-${index})`} />
                  </Svg>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </GlassCard>
  );
}

export interface StackedChartPoint {
  label: string;
  primary: number;
  secondary: number;
}

export function StackedRevenueChart({ title, points }: { title: string; points: StackedChartPoint[] }) {
  const [width, setWidth] = useState(0);
  const visible = points;
  const chartHeight = 190;
  const plotTop = 18;
  const baseline = 145;
  const max = Math.max(1, ...visible.map((point) => point.primary + point.secondary));
  const slot = visible.length ? (width - 20) / visible.length : 0;
  const barWidth = Math.max(4, Math.min(24, slot * 0.56));
  const labelInterval = Math.max(1, Math.ceil(visible.length / 6));

  return (
    <GlassCard innerStyle={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.legend}><Legend color={colors.accent} label="Doanh thu tác giả" /><Legend color={colors.warm} label="Phí nền tảng" /></View>
      <View style={styles.svgWrap} onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}>
        {width > 0 ? (
          <Svg width={width} height={chartHeight}>
            <Defs>
              <LinearGradient id="creator" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor={colors.cyan} /><Stop offset="1" stopColor={colors.accent} /></LinearGradient>
              <LinearGradient id="platform" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor={colors.warning} /><Stop offset="1" stopColor={colors.warm} /></LinearGradient>
            </Defs>
            {[0, 1, 2, 3].map((index) => {
              const y = plotTop + index * ((baseline - plotTop) / 3);
              return <Line key={index} x1="10" x2={width - 10} y1={y} y2={y} stroke={colors.glassBorder} strokeWidth="1" strokeDasharray="3 6" />;
            })}
            {visible.map((point, index) => {
              const x = 10 + slot * index + (slot - barWidth) / 2;
              const creatorHeight = point.primary / max * (baseline - plotTop);
              const platformHeight = point.secondary / max * (baseline - plotTop);
              const total = point.primary + point.secondary;
              return (
                <G key={`${point.label}-${index}`}>
                  <Rect x={x} y={baseline - creatorHeight} width={barWidth} height={Math.max(creatorHeight, point.primary > 0 ? 3 : 0)} rx="4" fill="url(#creator)" />
                  <Rect x={x} y={baseline - creatorHeight - platformHeight} width={barWidth} height={Math.max(platformHeight, point.secondary > 0 ? 3 : 0)} rx="4" fill="url(#platform)" />
                  {total > 0 ? <SvgText x={x + barWidth / 2} y={baseline - creatorHeight - platformHeight - 7} fill={colors.textSecondary} fontSize="8" textAnchor="middle">{compact(total)}</SvgText> : null}
                  {index % labelInterval === 0 || index === visible.length - 1 ? <SvgText x={x + barWidth / 2} y="169" fill={colors.textMuted} fontSize="8" textAnchor="middle">{compactAxisLabel(point.label)}</SvgText> : null}
                </G>
              );
            })}
          </Svg>
        ) : null}
      </View>
    </GlassCard>
  );
}

function compactAxisLabel(label: string) {
  const daily = /^(\d{4})-(\d{2})-(\d{2})$/.exec(label);
  if (daily) return `${daily[3]}/${daily[2]}`;
  const monthly = /^(\d{4})-(\d{2})$/.exec(label);
  if (monthly) return `T${Number(monthly[2])}`;
  return label.length > 6 ? label.slice(-5) : label;
}

function smoothPath(points: Array<{ x: number; y: number }>) {
  if (!points.length) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    const middleX = (current.x + next.x) / 2;
    path += ` C ${middleX} ${current.y}, ${middleX} ${next.y}, ${next.x} ${next.y}`;
  }
  return path;
}

function Legend({ color, label }: { color: string; label: string }) {
  return <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: color }]} /><Text style={styles.legendText}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  card: { padding: spacing.lg }, heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, title: { color: colors.textPrimary, fontSize: 16, fontFamily: typography.fontFamilyBold }, subtitle: { color: colors.textMuted, fontSize: 10, marginTop: 4 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 5, borderRadius: radius.pill, backgroundColor: colors.successSoft }, liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success }, liveText: { color: colors.success, fontSize: 9, fontFamily: typography.fontFamilyBold },
  svgWrap: { width: '100%', minHeight: 184, marginTop: spacing.sm }, summary: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm }, summaryValue: { color: colors.cyan, fontSize: 22, fontFamily: typography.fontFamilyBold }, summaryLabel: { color: colors.textMuted, fontSize: 11 },
  horizontalList: { gap: spacing.md, marginTop: spacing.lg }, horizontalRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm }, rankBubble: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.glassMedium, alignItems: 'center', justifyContent: 'center' }, rankBubbleTop: { backgroundColor: colors.warningSoft, borderWidth: 1, borderColor: 'rgba(251,191,36,0.35)' }, rankText: { color: colors.textPrimary, fontSize: 11, fontFamily: typography.fontFamilyBold }, rankTextTop: { color: colors.warning }, horizontalContent: { flex: 1 }, horizontalMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 5 }, horizontalLabel: { flex: 1, color: colors.textSecondary, fontSize: 11, fontFamily: typography.fontFamilyMedium }, horizontalValue: { color: colors.textPrimary, fontSize: 11, fontFamily: typography.fontFamilyBold }, miniSvg: { height: 12, width: '100%' },
  legend: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.sm }, legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 }, legendDot: { width: 8, height: 8, borderRadius: 4 }, legendText: { color: colors.textMuted, fontSize: 10 },
  statusCard: { padding: spacing.lg }, statusHeading: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm }, statusIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.warningSoft, alignItems: 'center', justifyContent: 'center' },
  statusContent: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.lg, gap: spacing.md }, donutWrap: { width: 132, height: 132 }, statusLegend: { flex: 1, gap: spacing.md }, statusLegendRow: { flexDirection: 'row', alignItems: 'center', minWidth: 0 }, statusLegendDot: { width: 10, height: 10, borderRadius: 5, marginRight: spacing.sm }, statusLegendLabel: { flex: 1, color: colors.textSecondary, fontSize: 11 }, statusLegendValue: { color: colors.textPrimary, fontSize: 12, fontFamily: typography.fontFamilyBold, marginLeft: spacing.xs }, statusLegendPercent: { width: 36, color: colors.textMuted, fontSize: 10, textAlign: 'right' },
});
