import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Dimensions,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useTheme } from '../../src/contexts/ThemeContext';

const { width } = Dimensions.get('window');

interface ChartData {
  label: string;
  value: number;
  color: string;
  percentage: number;
}

interface TrendData {
  day: string;
  value: number;
}

export default function AnalyticsScreen() {
  const { theme } = useTheme();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('week');
  const [refreshing, setRefreshing] = useState(false);

  // 샘플 데이터
  const completionRate = 87;
  const totalTasks = 156;
  const completedTasks = 136;
  const productivity = 92;
  const focusTime = 6.5;
  const streak = 12;

  // 카테고리별 분포 데이터
  const categoryData: ChartData[] = [
    { label: '업무', value: 45, color: theme.colors.primary[500], percentage: 35 },
    { label: '개인', value: 32, color: theme.colors.success, percentage: 25 },
    { label: '학습', value: 28, color: theme.colors.warning, percentage: 22 },
    { label: '운동', value: 23, color: theme.colors.info, percentage: 18 },
  ];

  // 주간 트렌드 데이터
  const weeklyTrend: TrendData[] = [
    { day: '월', value: 85 },
    { day: '화', value: 92 },
    { day: '수', value: 78 },
    { day: '목', value: 95 },
    { day: '금', value: 88 },
    { day: '토', value: 76 },
    { day: '일', value: 82 },
  ];

  // 시간대별 활동 데이터
  const hourlyActivity = [
    { hour: '6', activity: 20 },
    { hour: '9', activity: 85 },
    { hour: '12', activity: 65 },
    { hour: '15', activity: 90 },
    { hour: '18', activity: 75 },
    { hour: '21', activity: 45 },
  ];

  const periods = [
    { key: 'week', label: '주간' },
    { key: 'month', label: '월간' },
    { key: 'year', label: '연간' },
  ];

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  }, []);

  // 개선된 원형 차트 컴포넌트
  const PieChart = ({ data }: { data: ChartData[] }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const chartSize = 120;
    const strokeWidth = 12;
    const radius = (chartSize - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    let accumulatedPercentage = 0;

    return (
      <View style={styles.pieChartContainer}>
        <View style={[styles.pieChart, { width: chartSize, height: chartSize }]}>
          {/* 배경 원 */}
          <View style={[
            styles.pieBackground,
            {
              width: chartSize,
              height: chartSize,
              borderRadius: chartSize / 2,
              backgroundColor: theme.colors.surface,
            }
          ]} />

          {/* 데이터 원형 섹션들 */}
          {data.map((item, index) => {
            const percentage = (item.value / total) * 100;
            const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
            const rotation = (accumulatedPercentage / 100) * 360 - 90; // -90도로 12시 방향부터 시작
            accumulatedPercentage += percentage;

            return (
              <View
                key={index}
                style={[
                  styles.pieSegment,
                  {
                    width: chartSize,
                    height: chartSize,
                    borderRadius: chartSize / 2,
                    borderWidth: strokeWidth,
                    borderColor: item.color,
                    transform: [{ rotate: `${rotation}deg` }],
                  }
                ]}
              />
            );
          })}
        </View>

        <View style={[styles.pieChartCenter, {
          width: chartSize - strokeWidth * 2,
          height: chartSize - strokeWidth * 2,
          borderRadius: (chartSize - strokeWidth * 2) / 2,
          backgroundColor: theme.colors.background.card,
        }]}>
          <Text style={[styles.pieChartCenterText, { color: theme.colors.text.primary }]}>
            {completionRate}%
          </Text>
          <Text style={[styles.pieChartCenterLabel, { color: theme.colors.text.secondary }]}>
            완료율
          </Text>
        </View>
      </View>
    );
  };

  // 개선된 도넛 차트 컴포넌트 (더 정확한 구현)
  const DonutChart = ({ data }: { data: ChartData[] }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const chartSize = 140;
    const strokeWidth = 20;
    const centerSize = chartSize - strokeWidth * 2;

    return (
      <View style={styles.pieChartContainer}>
        {/* 차트 컨테이너 */}
        <View style={[styles.donutChartWrapper, { width: chartSize, height: chartSize }]}>
          {/* 배경 원 */}
          <View style={[
            styles.donutBackground,
            {
              width: chartSize,
              height: chartSize,
              borderRadius: chartSize / 2,
              borderWidth: strokeWidth,
              borderColor: theme.colors.surface,
            }
          ]} />

          {/* 카테고리별 진행률 바들 */}
          {data.map((item, index) => {
            const percentage = (item.value / total) * 100;
            const circumference = 2 * Math.PI * ((chartSize - strokeWidth) / 2);
            const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
            const strokeDashoffset = 0;

            return (
              <View
                key={index}
                style={[
                  styles.donutSegment,
                  {
                    width: chartSize,
                    height: chartSize,
                    borderRadius: chartSize / 2,
                    borderWidth: strokeWidth / data.length,
                    borderColor: item.color,
                    position: 'absolute',
                    top: 0,
                    left: 0,
                  }
                ]}
              />
            );
          })}
        </View>

        {/* 중앙 정보 카드 */}
        <View style={[
          styles.donutCenter,
          {
            width: centerSize,
            height: centerSize,
            borderRadius: centerSize / 2,
            backgroundColor: theme.colors.background.card,
          }
        ]}>
          <Text style={[styles.pieChartCenterText, { color: theme.colors.text.primary }]}>
            {completionRate}%
          </Text>
          <Text style={[styles.pieChartCenterLabel, { color: theme.colors.text.secondary }]}>
            완료율
          </Text>
        </View>
      </View>
    );
  };

  // 단순하고 정확한 원형 진행률 차트
  const SimpleDonutChart = ({ data }: { data: ChartData[] }) => {
    const chartSize = 140;
    const strokeWidth = 18;
    const centerSize = chartSize - strokeWidth * 2.5;

    return (
      <View style={styles.pieChartContainer}>
        <View style={[styles.simpleDonutContainer, { width: chartSize, height: chartSize }]}>
          {/* 배경 링 */}
          <View style={[
            styles.donutRing,
            {
              width: chartSize,
              height: chartSize,
              borderRadius: chartSize / 2,
              borderWidth: strokeWidth,
              borderColor: theme.colors.surface,
            }
          ]} />

          {/* 카테고리별 링들을 겹쳐서 표시 */}
          {data.map((item, index) => {
            const totalSum = data.reduce((sum, d) => sum + d.value, 0);
            const percentage = (item.value / totalSum) * 100;
            // 각 카테고리를 25%씩 차지하도록 간단히 표시
            const segmentPercentage = 25;
            const rotation = index * 90; // 90도씩 회전

            return (
              <View
                key={index}
                style={[
                  styles.donutSegmentSimple,
                  {
                    width: chartSize,
                    height: chartSize,
                    borderRadius: chartSize / 2,
                    borderWidth: strokeWidth,
                    borderColor: 'transparent',
                    borderTopColor: item.color,
                    borderRightColor: item.color,
                    position: 'absolute',
                    transform: [{ rotate: `${rotation}deg` }],
                  }
                ]}
              />
            );
          })}

          {/* 중앙 카드 */}
          <View style={[
            styles.donutCenterSimple,
            {
              width: centerSize,
              height: centerSize,
              borderRadius: centerSize / 2,
              backgroundColor: theme.colors.background.card,
              position: 'absolute',
              top: (chartSize - centerSize) / 2,
              left: (chartSize - centerSize) / 2,
            }
          ]}>
            <Text style={[styles.pieChartCenterText, { color: theme.colors.text.primary }]}>
              {completionRate}%
            </Text>
            <Text style={[styles.pieChartCenterLabel, { color: theme.colors.text.secondary }]}>
              완료율
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // 개선된 바 차트 컴포넌트
  const BarChart = ({ data }: { data: TrendData[] }) => {
    const maxValue = Math.max(...data.map(item => item.value));
    const minValue = Math.min(...data.map(item => item.value));
    const chartHeight = 120;

    return (
      <View style={styles.barChartContainer}>
        <View style={styles.barChartContent}>
          {data.map((item, index) => {
            // 0-100 범위에서의 상대적 높이 계산
            const percentage = item.value / 100; // 이미 퍼센트 값이므로 100으로 나눔
            const barHeight = Math.max(chartHeight * percentage, 12); // 최소 12px 높이
            const isHighest = item.value === maxValue;

            return (
              <View key={index} style={styles.barItemContainer}>
                {/* 값 표시 (바 위에) */}
                <Text style={[
                  styles.barValueTop,
                  {
                    color: isHighest ? theme.colors.primary[600] : theme.colors.text.secondary,
                    fontWeight: isHighest ? '700' : '600',
                  }
                ]}>
                  {item.value}%
                </Text>

                {/* 바 래퍼 */}
                <View style={[styles.barWrapper, { height: chartHeight }]}>
                  <View
                    style={[
                      styles.barElement,
                      {
                        height: barHeight,
                        backgroundColor: isHighest
                          ? theme.colors.primary[600]
                          : theme.colors.primary[500],
                      },
                    ]}
                  />
                </View>

                {/* 요일 라벨 */}
                <Text style={[styles.barLabel, { color: theme.colors.text.secondary }]}>
                  {item.day}
                </Text>
              </View>
            );
          })}
        </View>

        {/* 차트 배경 그리드 */}
        <View style={styles.chartBackground}>
          {[25, 50, 75, 100].map((value, index) => (
            <View
              key={index}
              style={[
                styles.gridLineHorizontal,
                {
                  bottom: (value / 100) * chartHeight + 50,
                  backgroundColor: theme.colors.divider,
                }
              ]}
            />
          ))}
        </View>
      </View>
    );
  };

  // 개선된 활동 히트맵 컴포넌트
  const ActivityHeatmap = ({ data }: { data: any[] }) => {
    const maxActivity = Math.max(...data.map(item => item.activity));

    return (
      <View style={styles.heatmap}>
        {data.map((item, index) => {
          const intensity = item.activity / maxActivity;
          const barColor = `rgba(${theme.colors.primary[500].replace('#', '')
            .match(/.{2}/g)
            ?.map((hex: string) => parseInt(hex, 16))
            .join(', ')}, ${0.2 + intensity * 0.8})`;

          return (
            <View key={index} style={styles.heatmapItem}>
              <Text style={[styles.heatmapHour, { color: theme.colors.text.secondary }]}>
                {item.hour}시
              </Text>
              <View style={[styles.heatmapBar, { backgroundColor: theme.colors.surface }]}>
                <View
                  style={[
                    styles.heatmapFill,
                    {
                      width: `${item.activity}%`,
                      backgroundColor: theme.colors.primary[500],
                      opacity: 0.3 + intensity * 0.7, // 더 자연스러운 투명도
                    },
                  ]}
                />
                {/* 활동 강도 표시를 위한 도트 */}
                <View
                  style={[
                    styles.activityDot,
                    {
                      left: `${Math.max(item.activity - 2, 0)}%`,
                      backgroundColor: theme.colors.primary[600],
                      opacity: intensity,
                    }
                  ]}
                />
              </View>
              <Text style={[styles.heatmapValue, {
                color: intensity > 0.7 ? theme.colors.primary[600] : theme.colors.text.tertiary,
                fontWeight: intensity > 0.7 ? '600' : '500',
              }]}>
                {item.activity}%
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background.primary}
      />

      {/* 헤더 */}
      <View style={[styles.header, { backgroundColor: theme.colors.background.primary }]}>
        <View>
          <Text style={[styles.title, { color: theme.colors.text.primary }]}>분석</Text>
          <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
            나의 생산성 인사이트
          </Text>
        </View>

        {/* 기간 선택 */}
        <View style={[styles.periodSelector, { backgroundColor: theme.colors.surface }]}>
          {periods.map((period) => (
            <TouchableOpacity
              key={period.key}
              style={[
                styles.periodButton,
                selectedPeriod === period.key && {
                  backgroundColor: theme.colors.primary[500],
                },
              ]}
              onPress={() => setSelectedPeriod(period.key as any)}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  {
                    color: selectedPeriod === period.key
                      ? theme.colors.text.inverse
                      : theme.colors.text.secondary,
                  },
                ]}
              >
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary[500]}
            colors={[theme.colors.primary[500]]}
          />
        }
      >
        {/* 핵심 지표 카드 */}
        <View style={styles.metricsContainer}>
          <View style={[styles.metricCard, { backgroundColor: theme.colors.background.card }]}>
            <View style={[styles.metricIcon, { backgroundColor: theme.colors.primary[100] }]}>
              <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary[500]} />
            </View>
            <View style={styles.metricContent}>
              <Text style={[styles.metricValue, { color: theme.colors.text.primary }]}>
                {completedTasks}/{totalTasks}
              </Text>
              <Text style={[styles.metricLabel, { color: theme.colors.text.secondary }]}>
                완료한 일정
              </Text>
              <View style={[styles.metricProgress, { backgroundColor: theme.colors.surface }]}>
                <View
                  style={[
                    styles.metricProgressFill,
                    {
                      width: `${completionRate}%`,
                      backgroundColor: theme.colors.primary[500],
                    },
                  ]}
                />
              </View>
            </View>
          </View>

          <View style={[styles.metricCard, { backgroundColor: theme.colors.background.card }]}>
            <View style={[styles.metricIcon, { backgroundColor: theme.colors.success + '20' }]}>
              <Ionicons name="trending-up" size={24} color={theme.colors.success} />
            </View>
            <View style={styles.metricContent}>
              <Text style={[styles.metricValue, { color: theme.colors.text.primary }]}>
                {productivity}%
              </Text>
              <Text style={[styles.metricLabel, { color: theme.colors.text.secondary }]}>
                생산성 점수
              </Text>
              <Text style={[styles.metricChange, { color: theme.colors.success }]}>
                +5% 지난주 대비
              </Text>
            </View>
          </View>

          <View style={[styles.metricCard, { backgroundColor: theme.colors.background.card }]}>
            <View style={[styles.metricIcon, { backgroundColor: theme.colors.warning + '20' }]}>
              <Ionicons name="time" size={24} color={theme.colors.warning} />
            </View>
            <View style={styles.metricContent}>
              <Text style={[styles.metricValue, { color: theme.colors.text.primary }]}>
                {focusTime}h
              </Text>
              <Text style={[styles.metricLabel, { color: theme.colors.text.secondary }]}>
                집중 시간
              </Text>
              <Text style={[styles.metricChange, { color: theme.colors.warning }]}>
                평균 대비 +1.2h
              </Text>
            </View>
          </View>

          <View style={[styles.metricCard, { backgroundColor: theme.colors.background.card }]}>
            <View style={[styles.metricIcon, { backgroundColor: theme.colors.info + '20' }]}>
              <Ionicons name="flame" size={24} color={theme.colors.info} />
            </View>
            <View style={styles.metricContent}>
              <Text style={[styles.metricValue, { color: theme.colors.text.primary }]}>
                {streak}일
              </Text>
              <Text style={[styles.metricLabel, { color: theme.colors.text.secondary }]}>
                연속 달성
              </Text>
              <Text style={[styles.metricChange, { color: theme.colors.info }]}>
                최고 기록!
              </Text>
            </View>
          </View>
        </View>

        {/* 카테고리별 분석 */}
        <View style={[styles.chartCard, { backgroundColor: theme.colors.background.card }]}>
          <View style={styles.chartHeader}>
            <Text style={[styles.chartTitle, { color: theme.colors.text.primary }]}>
              카테고리별 분포
            </Text>
            <TouchableOpacity style={styles.chartAction}>
              <Ionicons name="options" size={20} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.chartContent}>
            <SimpleDonutChart data={categoryData} />
            <View style={styles.chartLegend}>
              {categoryData.map((item, index) => (
                <View key={index} style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                  <Text style={[styles.legendLabel, { color: theme.colors.text.secondary }]}>
                    {item.label}
                  </Text>
                  <Text style={[styles.legendValue, { color: theme.colors.text.primary }]}>
                    {item.percentage}%
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* 주간 성과 트렌드 */}
        <View style={[styles.chartCard, { backgroundColor: theme.colors.background.card }]}>
          <View style={styles.chartHeader}>
            <Text style={[styles.chartTitle, { color: theme.colors.text.primary }]}>
              주간 성과 트렌드
            </Text>
            <Text style={[styles.chartSubtitle, { color: theme.colors.text.secondary }]}>
              일별 완료율 (%)
            </Text>
          </View>
          <BarChart data={weeklyTrend} />
        </View>

        {/* 시간대별 활동 패턴 */}
        <View style={[styles.chartCard, { backgroundColor: theme.colors.background.card }]}>
          <View style={styles.chartHeader}>
            <Text style={[styles.chartTitle, { color: theme.colors.text.primary }]}>
              시간대별 활동 패턴
            </Text>
            <Text style={[styles.chartSubtitle, { color: theme.colors.text.secondary }]}>
              가장 생산적인 시간대를 확인하세요
            </Text>
          </View>
          <ActivityHeatmap data={hourlyActivity} />
        </View>

        {/* 인사이트 카드 */}
        <View style={[styles.insightCard, { backgroundColor: theme.colors.primary[50] }]}>
          <View style={styles.insightHeader}>
            <Ionicons name="bulb" size={24} color={theme.colors.primary[500]} />
            <Text style={[styles.insightTitle, { color: theme.colors.primary[700] }]}>
              AI 인사이트
            </Text>
          </View>
          <Text style={[styles.insightText, { color: theme.colors.primary[600] }]}>
            오후 3시에 가장 높은 생산성을 보이고 있어요. 중요한 업무는 이 시간대에 배치하는 것을 추천해요!
          </Text>
          <TouchableOpacity style={[styles.insightAction, { backgroundColor: theme.colors.primary[500] }]}>
            <Text style={[styles.insightActionText, { color: theme.colors.text.inverse }]}>
              일정 최적화하기
            </Text>
          </TouchableOpacity>
        </View>

        {/* 하단 여백 */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  periodSelector: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
  },
  periodButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  metricsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  metricCard: {
    width: (width - 48) / 2,
    marginHorizontal: 4,
    marginVertical: 8,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  metricIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricContent: {
    flex: 1,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  metricLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  metricProgress: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  metricProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  metricChange: {
    fontSize: 12,
    fontWeight: '600',
  },
  chartCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  chartHeader: {
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  chartSubtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  chartAction: {
    padding: 8,
  },
  chartContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pieChartContainer: {
    alignItems: 'center',
    marginRight: 20,
    position: 'relative',
  },
  pieChart: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pieBackground: {
    position: 'absolute',
  },
  pieSegment: {
    position: 'absolute',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  modernPieChart: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pieRing: {
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  pieChartCenter: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pieChartCenterText: {
    fontSize: 20,
    fontWeight: '700',
  },
  pieChartCenterLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  chartLegend: {
    flex: 1,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  legendLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  legendValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  barChartContainer: {
    position: 'relative',
    paddingTop: 20,
  },
  barChartContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
    paddingHorizontal: 8,
  },
  barItemContainer: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 4,
  },
  barValueTop: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 4,
  },
  barWrapper: {
    justifyContent: 'flex-end',
    marginBottom: 12,
    alignItems: 'center',
  },
  barElement: {
    width: 24,
    borderRadius: 12,
    minHeight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  barLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  chartBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 20,
  },
  gridLineHorizontal: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: 1,
    opacity: 0.1,
  },
  heatmap: {
    paddingVertical: 8,
  },
  heatmapItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  heatmapHour: {
    width: 40,
    fontSize: 14,
    fontWeight: '500',
  },
  heatmapBar: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  heatmapFill: {
    height: '100%',
    borderRadius: 5,
  },
  activityDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    top: 2,
  },
  heatmapValue: {
    width: 40,
    textAlign: 'right',
    fontSize: 12,
    fontWeight: '500',
  },
  insightCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 20,
    borderRadius: 16,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  insightText: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    marginBottom: 16,
  },
  insightAction: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  insightActionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 32,
  },
  donutChartWrapper: {
    position: 'relative',
  },
  donutBackground: {
    position: 'absolute',
  },
  donutSegment: {
    position: 'absolute',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  donutCenter: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  simpleDonutContainer: {
    position: 'relative',
  },
  donutRing: {
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  donutSegmentSimple: {
    position: 'absolute',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  donutCenterSimple: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
