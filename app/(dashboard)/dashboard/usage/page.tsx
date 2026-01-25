'use client';

import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Download, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type DateRange = '1d' | '7d' | '30d';

interface UsageRecord {
  id: string;
  timestamp: string;
  type: 'included' | 'on_demand';
  model: string;
  tokens: number;
  cost: number;
}

function formatNumber(num: number): string {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万';
  }
  return num.toLocaleString();
}

function formatCurrency(amount: number): string {
  return `US$${amount.toFixed(2)}`;
}

function formatDateTime(dateStr: string): { date: string; time: string } {
  const date = new Date(dateStr);
  return {
    date: date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    }),
    time: date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true
    })
  };
}

export default function UsagePage() {
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const { data: usageData, isLoading } = useSWR(
    `/api/dashboard/usage?range=${dateRange}`,
    fetcher,
    { refreshInterval: 60000 }
  );
  const { data: teamData, mutate: mutateTeam } = useSWR('/api/team', fetcher);

  // 获取计划显示信息
  const getPlanInfo = (planName: string) => {
    const plans: Record<string, { name: string; price: string; description: string }> = {
      'free': { name: 'Free', price: '$0', description: 'Basic features with limited usage' },
      'hobby': { name: 'Hobby', price: '$0', description: 'Basic features with limited usage' },
      'basic': { name: 'Basic', price: '$20', description: 'Get more usage with enhanced features' },
      'plus': { name: 'Plus', price: '$100', description: 'Get maximum value with advanced features' },
      'ultra_plus': { name: 'Ultra Plus', price: '$200', description: 'Get maximum value with unlimited usage and priority support' },
      // 向后兼容旧计划名
      'professional': { name: 'Pro', price: '$100', description: 'Get maximum value with 10x usage limits' },
      'enterprise': { name: 'Ultra', price: '$200', description: 'Get maximum value with 20x usage limits and early access to advanced features' }
    };
    return plans[planName] || plans['free'];
  };

  // 处理 On-Demand 开关
  const handleOnDemandToggle = async (enabled: boolean) => {
    try {
      await fetch('/api/dashboard/on-demand', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      });
      mutateTeam();
    } catch (error) {
      console.error('Failed to update on-demand setting:', error);
    }
  };

  // 导出 CSV
  const handleExportCSV = async () => {
    try {
      const response = await fetch(`/api/dashboard/usage/export?range=${dateRange}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `usage-${dateRange}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export CSV:', error);
    }
  };

  // 获取日期范围显示
  const getDateRangeDisplay = () => {
    const now = new Date();
    const days = dateRange === '1d' ? 1 : dateRange === '7d' ? 7 : 30;
    const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  const planInfo = getPlanInfo(teamData?.planName || 'free');
  const usageRecords: UsageRecord[] = usageData?.records || [];
  const onDemandEnabled = teamData?.on_demand_enabled ?? false;

  return (
    <div className="min-h-full bg-[#0a0a0a] text-white p-6 lg:p-8">
      {/* Subscription Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <div className="lg:col-span-2 bg-gradient-to-br from-purple-900/30 to-purple-950/30 border border-purple-800/30 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl font-bold">{planInfo.name}</h2>
            <span className="px-2.5 py-0.5 bg-purple-500/20 text-purple-300 text-sm rounded-full">
              Current
            </span>
            <span className="text-gray-400">{planInfo.price}/mo.</span>
          </div>
          <p className="text-gray-400 mb-4">{planInfo.description}</p>
          <Link href="/pricing">
            <Button 
              variant="outline" 
              className="border-gray-700 text-gray-900 bg-white hover:bg-gray-100 hover:text-gray-900"
            >
              Manage Subscription
            </Button>
          </Link>
        </div>

        {/* On-Demand Card */}
        <div className="bg-gray-900/50 border border-gray-800 border-dashed rounded-xl p-6">
          <h3 className="font-semibold mb-2">
            On-Demand Usage is {onDemandEnabled ? 'On' : 'Off'}
          </h3>
          <p className="text-sm text-gray-400 mb-4">
            Go beyond your plan's included quota with on-demand usage
          </p>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="border-gray-700 text-gray-900 bg-white hover:bg-gray-100 hover:text-gray-900"
              onClick={() => handleOnDemandToggle(!onDemandEnabled)}
            >
              {onDemandEnabled ? 'Disable' : 'Enable'} On-Demand Usage
            </Button>
            {onDemandEnabled && (
              <span className="text-xs text-green-400">✓ Enabled</span>
            )}
          </div>
        </div>
      </div>

      {/* Usage Table Section */}
      <div className="bg-gray-900/30 border border-gray-800 rounded-xl">
        {/* Table Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
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
          <Button
            variant="outline"
            size="sm"
            className="border-gray-700 text-gray-900 bg-white hover:bg-gray-100 hover:text-gray-900"
            onClick={handleExportCSV}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-sm text-gray-400 border-b border-gray-800">
                <th className="text-left py-3 px-4 font-medium">Date</th>
                <th className="text-left py-3 px-4 font-medium">Type</th>
                <th className="text-left py-3 px-4 font-medium">Model</th>
                <th className="text-right py-3 px-4 font-medium">Tokens</th>
                <th className="text-right py-3 px-4 font-medium">Cost</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-400 mx-auto"></div>
                  </td>
                </tr>
              ) : usageRecords.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">
                    No usage records for this period
                  </td>
                </tr>
              ) : (
                usageRecords.map((record) => {
                  const dt = formatDateTime(record.timestamp);
                  return (
                    <tr key={record.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                      <td className="py-4 px-4">
                        <span className="text-gray-300">{dt.date}, {dt.time}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          record.type === 'included' 
                            ? 'bg-green-500/10 text-green-400'
                            : 'bg-orange-500/10 text-orange-400'
                        }`}>
                          {record.type === 'included' ? 'Included' : 'On-Demand'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-300">{record.model}</td>
                      <td className="py-4 px-4 text-right text-gray-300">{formatNumber(record.tokens)}</td>
                      <td className="py-4 px-4 text-right">
                        <span className={record.type === 'included' ? 'text-green-400' : 'text-white'}>
                          {formatCurrency(record.cost)} {record.type === 'included' && 'Included'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination (if needed) */}
        {usageRecords.length > 0 && (
          <div className="flex items-center justify-between p-4 border-t border-gray-800">
            <span className="text-sm text-gray-400">
              Showing {usageRecords.length} records
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-gray-700 text-gray-400 hover:bg-gray-800"
                disabled
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-gray-700 text-gray-400 hover:bg-gray-800"
                disabled
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

