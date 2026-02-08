'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import { 
  FileText,
  ExternalLink
} from 'lucide-react';
import { customerPortalAction } from '@/lib/payments/actions';
import { useTranslation } from '@/lib/contexts/language-context';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface Invoice {
  id: string;
  number: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed' | 'draft';
  created_at: string;
  due_date?: string;
  pdf_url?: string;
  hosted_invoice_url?: string;
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'alipay' | 'wechat_pay';
  last4?: string;
  brand?: string;
  exp_month?: number;
  exp_year?: number;
  is_default: boolean;
}

interface IncludedUsage {
  total_tokens: number;
  total_cost: number;
  by_model: Record<string, { tokens: number; cost: number }>;
  period_start: string;
  period_end: string;
}

interface OnDemandUsage {
  total_cost: number;
  by_type: Record<string, { count: number; cost: number }>;
  period_start: string;
  period_end: string;
}

function formatCurrency(amount: number, currency: string = 'usd'): string {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  });
  return formatter.format(amount / 100); // Stripe amounts are in cents
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export default function BillingPage() {
  const { data: billingData, isLoading } = useSWR('/api/dashboard/billing', fetcher);
  const [selectedMonth, setSelectedMonth] = useState<string>('2026年1月');
  const { t } = useTranslation();

  const invoices: Invoice[] = billingData?.invoices || [];
  const includedUsage: IncludedUsage | null = billingData?.included_usage;
  const onDemandUsage: OnDemandUsage | null = billingData?.on_demand_usage;
  const currentPeriodStart = billingData?.current_period_start;
  const currentPeriodEnd = billingData?.current_period_end;

  // 格式化周期日期
  const formatPeriod = (start?: string, end?: string) => {
    if (!start || !end) return '';
    const startDate = new Date(start);
    const endDate = new Date(end);
    return `${startDate.getFullYear()}年${startDate.getMonth() + 1}月${startDate.getDate()}日 - ${endDate.getFullYear()}年${endDate.getMonth() + 1}月${endDate.getDate()}日`;
  };

  // 格式化Token数量（添加万位分隔符）
  const formatTokens = (tokens: number): string => {
    return tokens.toLocaleString('zh-CN');
  };

  // 格式化状态文本
  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Paid';
      case 'pending':
        return 'Pending';
      case 'failed':
        return 'Failed';
      case 'draft':
        return 'Draft';
      default:
        return status;
    }
  };

  return (
    <div className="min-h-full bg-[#0a0a0a] text-white p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold">{t('billingAndInvoices')}</h1>
        <form action={customerPortalAction}>
          <Button
            type="submit"
            variant="outline"
            size="sm"
            className="border-gray-700 text-black font-bold bg-white hover:bg-gray-100"
          >
            {t('manageSubscription')}
          </Button>
        </form>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
        </div>
      ) : (
        <>
          {/* Included Usage Section */}
          <section className="mb-8">
            <h2 className="text-lg font-medium mb-4">{t('includedUsage')}</h2>
            <div className="text-sm text-gray-400 mb-3">
              {currentPeriodStart && currentPeriodEnd 
                ? formatPeriod(currentPeriodStart, currentPeriodEnd)
                : t('cycleStarting') + ' N/A'
              }
            </div>
            
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">{t('item')}</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">{t('tokens')}</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">{t('cost')}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-800/50">
                    <td className="py-3 px-4 text-gray-400 font-medium">{t('includedInProPlus')}</td>
                    <td className="py-3 px-4"></td>
                    <td className="py-3 px-4"></td>
                  </tr>
                  {includedUsage && Object.keys(includedUsage.by_model).length > 0 ? (
                    <>
                      {Object.entries(includedUsage.by_model).map(([model, data]) => (
                        <tr key={model} className="border-b border-gray-800/30">
                          <td className="py-3 px-4 pl-8 text-gray-300">{model}</td>
                          <td className="py-3 px-4 text-right text-gray-300">
                            {formatTokens(data.tokens)} {t('tokens').toLowerCase()}
                          </td>
                          <td className="py-3 px-4 text-right text-gray-300">
                            US${data.cost.toFixed(2)} <span className="text-gray-500">{t('included')}</span>
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-gray-800/20">
                        <td className="py-3 px-4 font-medium">{t('total')}</td>
                        <td className="py-3 px-4 text-right font-medium">
                          {formatTokens(includedUsage.total_tokens)}
                        </td>
                        <td className="py-3 px-4 text-right font-medium">
                          US${includedUsage.total_cost.toFixed(2)} <span className="text-gray-500">{t('included')}</span>
                        </td>
                      </tr>
                    </>
                  ) : (
                    <tr>
                      <td colSpan={3} className="py-8 px-4 text-center text-gray-500">
                        {t('noUsageInPeriod')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* On-Demand Usage Section */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium">{t('onDemandUsage')}</h2>
              <div className="text-sm text-gray-400">
                {t('cycleStarting')} {currentPeriodStart ? formatDate(currentPeriodStart) : 'N/A'}
              </div>
            </div>
            
            {onDemandUsage ? (
              <>
                <div className="text-sm text-gray-400 mb-3">
                  {formatPeriod(onDemandUsage.period_start, onDemandUsage.period_end)}
                </div>
                
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 mb-4">
                  <div className="text-3xl font-bold mb-1">
                    US${onDemandUsage.total_cost.toFixed(2)}
                  </div>
                </div>

                <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-800">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">{t('type')}</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">{t('tokens')}</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">{t('cost')}</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">{t('qty')}</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">{t('total')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(onDemandUsage.by_type).map(([type, data]) => (
                        <tr key={type} className="border-b border-gray-800/30">
                          <td className="py-3 px-4 text-gray-300 capitalize">{type}</td>
                          <td className="py-3 px-4 text-right text-gray-300">-</td>
                          <td className="py-3 px-4 text-right text-gray-300">-</td>
                          <td className="py-3 px-4 text-right text-gray-300">{data.count}</td>
                          <td className="py-3 px-4 text-right text-gray-300">
                            US${data.cost.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-gray-800/20">
                        <td className="py-3 px-4 font-medium">{t('subtotal')}</td>
                        <td className="py-3 px-4"></td>
                        <td className="py-3 px-4"></td>
                        <td className="py-3 px-4"></td>
                        <td className="py-3 px-4 text-right font-medium">
                          US${onDemandUsage.total_cost.toFixed(2)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                <div className="text-3xl font-bold mb-1">US$0.00</div>
                <div className="text-sm text-gray-400 mt-4">{t('noOnDemandUsage')}</div>
              </div>
            )}
          </section>

          {/* Invoices Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium">{t('invoices')}</h2>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option>2026年1月</option>
                <option>2025年12月</option>
                <option>2025年11月</option>
              </select>
            </div>
            
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl">
              {isLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-400 mx-auto"></div>
                </div>
              ) : invoices.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{t('noInvoicesYet')}</p>
                  <p className="text-sm mt-1">{t('invoicesWillAppearAfterFirstBillingCycle')}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-sm text-gray-400 border-b border-gray-800">
                        <th className="text-left py-3 px-4 font-medium">{t('date')}</th>
                        <th className="text-left py-3 px-4 font-medium">{t('description')}</th>
                        <th className="text-left py-3 px-4 font-medium">{t('status')}</th>
                        <th className="text-right py-3 px-4 font-medium">{t('amount')}</th>
                        <th className="text-right py-3 px-4 font-medium">{t('invoice')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((invoice) => (
                        <tr key={invoice.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                          <td className="py-4 px-4 text-gray-300">
                            {formatDate(invoice.created_at)}
                          </td>
                          <td className="py-4 px-4 text-gray-300">
                            {invoice.number || 'Subscription Payment'}
                          </td>
                          <td className="py-4 px-4">
                            <span className="capitalize text-gray-300">
                              {getStatusText(invoice.status)}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right text-gray-300">
                            {formatCurrency(invoice.amount, invoice.currency)}
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {invoice.hosted_invoice_url && (
                                <a 
                                  href={invoice.hosted_invoice_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-cyan-400 hover:text-cyan-300 text-sm flex items-center gap-1"
                                >
                                  {t('view')}
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

