'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import { Info } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// 日期范围选项
type DateRange = '1d' | '7d' | '30d';

interface DailyUsage {
  date: string;
  tokens: number;
  cost: number;
  requests: number;
}

function formatNumber(num: number): string {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万';
  }
  return num.toLocaleString();
}

function formatDate(dateStr: string, range: DateRange): string {
  const date = new Date(dateStr);
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const day = date.getDate().toString().padStart(2, '0');
  return `${month} ${day}`;
}

export default function OverviewPage() {
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const { data: analyticsData, isLoading } = useSWR(
    `/api/dashboard/analytics?range=${dateRange}`,
    fetcher,
    { refreshInterval: 60000 }
  );

  // 计算图表数据
  const chartData = useMemo(() => {
    if (!analyticsData?.dailyUsage) return [];
    return analyticsData.dailyUsage as DailyUsage[];
  }, [analyticsData]);

  // 计算统计数据
  const stats = useMemo(() => {
    if (!chartData.length) return { totalTokens: 0, totalRequests: 0 };
    const totalTokens = chartData.reduce((sum, d) => sum + d.tokens, 0);
    const totalRequests = chartData.reduce((sum, d) => sum + d.requests, 0);
    return { totalTokens, totalRequests };
  }, [chartData]);

  // 获取图表的最大值用于缩放
  const maxTokens = useMemo(() => {
    if (!chartData.length) return 1000;
    return Math.max(...chartData.map(d => d.tokens), 1000);
  }, [chartData]);

  // 获取日期范围显示
  const getDateRangeDisplay = () => {
    const now = new Date();
    const days = dateRange === '1d' ? 1 : dateRange === '7d' ? 7 : 30;
    const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  return (
    <div className="min-h-full bg-[#0a0a0a] text-white p-6 lg:p-8">
      {/* Header with date range selector */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="px-4 py-2 bg-gray-800 rounded-lg text-sm text-gray-300">
            {getDateRangeDisplay()}
          </div>
          <div className="flex gap-1 bg-gray-800/50 rounded-lg p-1">
            {(['1d', '7d', '30d'] as DateRange[]).map((range) => (
              <Button
                key={range}
                variant="ghost"
                size="sm"
                onClick={() => setDateRange(range)}
                className={`px-3 h-8 ${
                  dateRange === range
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                {range}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Analytics Section */}
      <div className="mb-8">
        <h2 className="text-lg font-medium mb-6">Your Analytics</h2>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
              <span>Tokens Used</span>
              <Info className="h-3.5 w-3.5 text-gray-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-cyan-400">
                {formatNumber(stats.totalTokens)}
              </span>
              <span className="text-sm text-gray-500">
                / {formatNumber(analyticsData?.totalAllowed || 0)}
              </span>
            </div>
          </div>
          
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
            <div className="text-sm text-gray-400 mb-2">Requests Made</div>
            <span className="text-3xl font-bold">
              {stats.totalRequests}
            </span>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-gray-900/30 border border-gray-800 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-400">
            We released a change in late August 2025 that improved the accuracy of our analytics. 
            This change is only available for users on Cursor 1.5+.{' '}
            <a href="#" className="text-cyan-400 hover:underline">
              Check the documentation
            </a>{' '}
            for more info.
          </p>
        </div>

        {/* Chart */}
        <div className="bg-gray-900/30 border border-gray-800 rounded-xl p-6">
          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No usage data available for this period
            </div>
          ) : (
            <div className="relative h-64">
              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between text-xs text-gray-500">
                <span>{formatNumber(maxTokens)}</span>
                <span>{formatNumber(Math.round(maxTokens * 0.75))}</span>
                <span>{formatNumber(Math.round(maxTokens * 0.5))}</span>
                <span>{formatNumber(Math.round(maxTokens * 0.25))}</span>
                <span>0</span>
              </div>
              
              {/* Chart area */}
              <div className="absolute left-14 right-0 top-0 bottom-8">
                {/* Grid lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div key={i} className="border-t border-gray-800/50" />
                  ))}
                </div>
                
                {/* Bars */}
                <div className="absolute inset-0 flex items-end justify-between gap-1 px-2">
                  {chartData.map((day, index) => {
                    const height = (day.tokens / maxTokens) * 100;
                    return (
                      <div 
                        key={day.date} 
                        className="flex-1 flex flex-col items-center group cursor-pointer"
                      >
                        {/* Tooltip */}
                        <div className="opacity-0 group-hover:opacity-100 absolute -top-12 bg-gray-800 px-3 py-2 rounded-lg text-xs whitespace-nowrap transition-opacity z-10">
                          <div className="text-white font-medium">{formatNumber(day.tokens)} tokens</div>
                          <div className="text-gray-400">{day.requests} requests</div>
                        </div>
                        
                        {/* Bar */}
                        <div 
                          className="w-full bg-cyan-500 rounded-t hover:bg-cyan-400 transition-colors"
                          style={{ 
                            height: `${Math.max(height, 2)}%`,
                            minHeight: '2px'
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* X-axis labels */}
              <div className="absolute left-14 right-0 bottom-0 h-6 flex justify-between px-2 text-xs text-gray-500">
                {chartData.filter((_, i) => {
                  // Show fewer labels for readability
                  const interval = Math.ceil(chartData.length / 10);
                  return i % interval === 0 || i === chartData.length - 1;
                }).map((day) => (
                  <span key={day.date}>{formatDate(day.date, dateRange)}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
