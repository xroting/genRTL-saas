'use client';

import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Info, AlertTriangle } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export default function SpendingPage() {
  const { data: teamData, mutate: mutateTeam } = useSWR('/api/team', fetcher);
  const { data: spendingData, isLoading } = useSWR('/api/dashboard/spending', fetcher);
  const [isUpdating, setIsUpdating] = useState(false);

  // 处理 On-Demand 开关
  const handleOnDemandToggle = async (enabled: boolean) => {
    setIsUpdating(true);
    try {
      await fetch('/api/dashboard/on-demand', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      });
      mutateTeam();
    } catch (error) {
      console.error('Failed to update on-demand setting:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const onDemandEnabled = teamData?.on_demand_enabled ?? false;
  const onDemandSpending = spendingData?.on_demand_total || 0;
  const spendingLimit = spendingData?.spending_limit;
  const billingCycleEnd = spendingData?.billing_cycle_end;

  return (
    <div className="min-h-full bg-[#0a0a0a] text-white p-6 lg:p-8">
      {/* On-Demand Usage Section */}
      <section className="mb-10">
        <h2 className="text-sm text-gray-400 uppercase tracking-wide mb-4">On-Demand Usage</h2>
        
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold">On-Demand Usage</h3>
                <span className="px-2.5 py-0.5 bg-blue-500/10 text-blue-400 text-xs rounded-full">
                  Recommended
                </span>
              </div>
              <p className="text-gray-400">
                Allow users on your team to go beyond included usage limits. On-demand usage is billed in arrears.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={onDemandEnabled}
                onCheckedChange={handleOnDemandToggle}
                disabled={isUpdating}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Spending Overview (only show if on-demand is enabled) */}
      {onDemandEnabled && (
        <>
          {/* Current Period Spending */}
          <section className="mb-10">
            <h2 className="text-sm text-gray-400 uppercase tracking-wide mb-4">Current Billing Period</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* On-Demand Total */}
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
                <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                  <span>On-Demand Spending</span>
                  <Info className="h-3.5 w-3.5 text-gray-500" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-orange-400">
                    {formatCurrency(onDemandSpending)}
                  </span>
                </div>
                {billingCycleEnd && (
                  <p className="text-sm text-gray-500 mt-2">
                    Billing cycle ends {new Date(billingCycleEnd).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </p>
                )}
              </div>

              {/* Spending Limit */}
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
                <div className="text-sm text-gray-400 mb-2">Spending Limit</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">
                    {spendingLimit ? formatCurrency(spendingLimit) : 'No limit'}
                  </span>
                </div>
                <Button
                  variant="link"
                  className="text-cyan-400 hover:text-cyan-300 p-0 h-auto mt-2"
                >
                  {spendingLimit ? 'Edit limit' : 'Set limit'}
                </Button>
              </div>
            </div>
          </section>

          {/* Spending Breakdown */}
          <section className="mb-10">
            <h2 className="text-sm text-gray-400 uppercase tracking-wide mb-4">Spending Breakdown</h2>
            
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-sm text-gray-400 border-b border-gray-800">
                      <th className="text-left py-3 px-4 font-medium">Category</th>
                      <th className="text-right py-3 px-4 font-medium">Tokens Used</th>
                      <th className="text-right py-3 px-4 font-medium">Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={3} className="py-8 text-center text-gray-500">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-400 mx-auto"></div>
                        </td>
                      </tr>
                    ) : !spendingData?.breakdown?.length ? (
                      <tr>
                        <td colSpan={3} className="py-8 text-center text-gray-500">
                          No on-demand usage yet this billing period
                        </td>
                      </tr>
                    ) : (
                      <>
                        {spendingData.breakdown.map((item: any, index: number) => (
                          <tr key={index} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                            <td className="py-4 px-4">
                              <span className="text-gray-300">{item.category}</span>
                            </td>
                            <td className="py-4 px-4 text-right text-gray-300">
                              {item.tokens.toLocaleString()}
                            </td>
                            <td className="py-4 px-4 text-right text-orange-400">
                              {formatCurrency(item.cost)}
                            </td>
                          </tr>
                        ))}
                        {/* Total Row */}
                        <tr className="bg-gray-800/30">
                          <td className="py-4 px-4 font-medium">Total</td>
                          <td className="py-4 px-4 text-right font-medium">
                            {spendingData.breakdown.reduce((sum: number, item: any) => sum + item.tokens, 0).toLocaleString()}
                          </td>
                          <td className="py-4 px-4 text-right font-medium text-orange-400">
                            {formatCurrency(onDemandSpending)}
                          </td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Warning if approaching limit */}
          {spendingLimit && onDemandSpending >= spendingLimit * 0.8 && (
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-orange-400">Approaching spending limit</h3>
                <p className="text-sm text-gray-400 mt-1">
                  You've used {((onDemandSpending / spendingLimit) * 100).toFixed(0)}% of your spending limit. 
                  Consider increasing your limit to avoid service interruption.
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Message when on-demand is disabled */}
      {!onDemandEnabled && (
        <div className="bg-gray-900/30 border border-gray-800 rounded-xl p-8 text-center">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Info className="h-8 w-8 text-gray-500" />
          </div>
          <h3 className="text-lg font-medium mb-2">On-Demand Usage is Disabled</h3>
          <p className="text-gray-400 max-w-md mx-auto mb-4">
            Enable on-demand usage to continue using the service when you exceed your included quota. 
            On-demand usage is billed at the end of each billing cycle.
          </p>
          <Button
            onClick={() => handleOnDemandToggle(true)}
            className="bg-cyan-600 hover:bg-cyan-700"
            disabled={isUpdating}
          >
            Enable On-Demand Usage
          </Button>
        </div>
      )}
    </div>
  );
}

