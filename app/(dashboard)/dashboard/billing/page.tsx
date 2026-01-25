'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import { 
  Download, 
  CreditCard, 
  FileText,
  ChevronRight,
  ExternalLink,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { customerPortalAction } from '@/lib/payments/actions';

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

function getStatusIcon(status: string) {
  switch (status) {
    case 'paid':
      return <CheckCircle className="h-4 w-4 text-green-400" />;
    case 'pending':
      return <Clock className="h-4 w-4 text-yellow-400" />;
    case 'failed':
      return <XCircle className="h-4 w-4 text-red-400" />;
    default:
      return <Clock className="h-4 w-4 text-gray-400" />;
  }
}

function getStatusText(status: string) {
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
}

export default function BillingPage() {
  const { data: billingData, isLoading } = useSWR('/api/dashboard/billing', fetcher);
  const { data: teamData } = useSWR('/api/team', fetcher);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const invoices: Invoice[] = billingData?.invoices || [];
  const paymentMethods: PaymentMethod[] = billingData?.payment_methods || [];
  const nextBillingDate = billingData?.next_billing_date;
  const nextBillingAmount = billingData?.next_billing_amount;

  // 下载发票
  const handleDownloadInvoice = async (invoice: Invoice) => {
    if (!invoice.pdf_url) return;
    
    setDownloadingId(invoice.id);
    try {
      window.open(invoice.pdf_url, '_blank');
    } catch (error) {
      console.error('Failed to download invoice:', error);
    } finally {
      setDownloadingId(null);
    }
  };

  // 获取卡片品牌图标
  const getCardBrandIcon = (brand?: string) => {
    // 这里可以返回不同品牌的图标
    return <CreditCard className="h-5 w-5 text-gray-400" />;
  };

  return (
    <div className="min-h-full bg-[#0a0a0a] text-white p-6 lg:p-8">
      <h1 className="text-2xl font-semibold mb-8">Billing & Invoices</h1>

      {/* Billing Overview */}
      <section className="mb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Next Billing */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
            <div className="text-sm text-gray-400 mb-2">Next Billing Date</div>
            <div className="text-2xl font-bold mb-1">
              {nextBillingDate ? formatDate(nextBillingDate) : 'No upcoming billing'}
            </div>
            {nextBillingAmount && (
              <div className="text-gray-400">
                Estimated: {formatCurrency(nextBillingAmount, 'usd')}
              </div>
            )}
          </div>

          {/* Payment Method */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
            <div className="text-sm text-gray-400 mb-2">Payment Method</div>
            {paymentMethods.length > 0 ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getCardBrandIcon(paymentMethods[0].brand)}
                  <div>
                    <div className="font-medium capitalize">
                      {paymentMethods[0].brand || paymentMethods[0].type} •••• {paymentMethods[0].last4}
                    </div>
                    {paymentMethods[0].exp_month && paymentMethods[0].exp_year && (
                      <div className="text-sm text-gray-400">
                        Expires {paymentMethods[0].exp_month}/{paymentMethods[0].exp_year}
                      </div>
                    )}
                  </div>
                </div>
                <form action={customerPortalAction}>
                  <Button
                    type="submit"
                    variant="outline"
                    size="sm"
                    className="border-gray-700 text-gray-900 bg-white hover:bg-gray-100 hover:text-gray-900"
                  >
                    Update
                  </Button>
                </form>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-gray-500">No payment method on file</span>
                <form action={customerPortalAction}>
                  <Button
                    type="submit"
                    variant="outline"
                    size="sm"
                    className="border-gray-700 text-gray-900 bg-white hover:bg-gray-100 hover:text-gray-900"
                  >
                    Add Payment Method
                  </Button>
                </form>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Manage Billing */}
      <section className="mb-10">
        <h2 className="text-sm text-gray-400 uppercase tracking-wide mb-4">Manage Billing</h2>
        
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl divide-y divide-gray-800">
          <form action={customerPortalAction} className="block">
            <button type="submit" className="w-full flex items-center justify-between p-5 hover:bg-gray-800/30 transition-colors text-left">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-gray-400" />
                <div>
                  <div className="font-medium">Manage Subscription</div>
                  <div className="text-sm text-gray-400">Update plan, cancel subscription, or change billing cycle</div>
                </div>
              </div>
              <ExternalLink className="h-4 w-4 text-gray-500" />
            </button>
          </form>
          
          <form action={customerPortalAction} className="block">
            <button type="submit" className="w-full flex items-center justify-between p-5 hover:bg-gray-800/30 transition-colors text-left">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-gray-400" />
                <div>
                  <div className="font-medium">Update Billing Information</div>
                  <div className="text-sm text-gray-400">Update billing address and tax information</div>
                </div>
              </div>
              <ExternalLink className="h-4 w-4 text-gray-500" />
            </button>
          </form>
        </div>
      </section>

      {/* Invoices */}
      <section>
        <h2 className="text-sm text-gray-400 uppercase tracking-wide mb-4">Invoices</h2>
        
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-400 mx-auto"></div>
            </div>
          ) : invoices.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No invoices yet</p>
              <p className="text-sm mt-1">Invoices will appear here after your first billing cycle</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-sm text-gray-400 border-b border-gray-800">
                    <th className="text-left py-3 px-4 font-medium">Invoice</th>
                    <th className="text-left py-3 px-4 font-medium">Date</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-right py-3 px-4 font-medium">Amount</th>
                    <th className="text-right py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                      <td className="py-4 px-4">
                        <span className="text-gray-300 font-mono text-sm">
                          {invoice.number || `INV-${invoice.id.slice(0, 8)}`}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-300">
                        {formatDate(invoice.created_at)}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs ${
                          invoice.status === 'paid' 
                            ? 'bg-green-500/10 text-green-400'
                            : invoice.status === 'pending'
                            ? 'bg-yellow-500/10 text-yellow-400'
                            : invoice.status === 'failed'
                            ? 'bg-red-500/10 text-red-400'
                            : 'bg-gray-500/10 text-gray-400'
                        }`}>
                          {getStatusIcon(invoice.status)}
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
                            >
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-gray-400 hover:text-white"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </a>
                          )}
                          {invoice.pdf_url && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-gray-400 hover:text-white"
                              onClick={() => handleDownloadInvoice(invoice)}
                              disabled={downloadingId === invoice.id}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
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
    </div>
  );
}

