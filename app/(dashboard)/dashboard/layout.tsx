'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Settings, 
  BarChart3, 
  DollarSign, 
  Receipt,
  Menu,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { data: user } = useSWR<any>('/api/user', fetcher);
  const { data: teamData } = useSWR<any>('/api/team', fetcher);

  // 获取计划显示名称
  const getPlanDisplayName = (planName: string) => {
    const planMap: Record<string, string> = {
      'free': 'Free',
      'hobby': 'Hobby',
      'basic': 'Basic',
      'plus': 'Plus',
      'ultra_plus': 'Ultra Plus',
      // 向后兼容
      'professional': 'Pro',
      'enterprise': 'Enterprise'
    };
    return planMap[planName] || 'Free';
  };

  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
    { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
    { href: '/dashboard/usage', icon: BarChart3, label: 'Usage' },
    { href: '/dashboard/spending', icon: DollarSign, label: 'Spending' },
    { href: '/dashboard/billing', icon: Receipt, label: 'Billing & Invoices' }
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="flex min-h-[calc(100dvh-68px)] bg-[#0a0a0a]">
      {/* Mobile header */}
      <div className="lg:hidden fixed top-[68px] left-0 right-0 z-50 flex items-center justify-between bg-[#0a0a0a] border-b border-gray-800 p-4">
        <div className="flex items-center">
          <span className="font-medium text-white">Dashboard</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="text-gray-400 hover:text-white hover:bg-gray-800"
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={`w-64 bg-[#0a0a0a] border-r border-gray-800 flex flex-col lg:block ${
          isSidebarOpen ? 'block' : 'hidden'
        } lg:relative fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0 top-[68px]' : '-translate-x-full'
        }`}
      >
        {/* User info */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <h2 className="text-white font-semibold">
              {user?.name || user?.email?.split('@')[0] || 'User'}
            </h2>
            <ExternalLink className="h-3 w-3 text-gray-500" />
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {getPlanDisplayName(teamData?.planName || 'free')} Plan · {user?.email}
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-2">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                className={`w-full justify-start my-0.5 h-9 px-3 ${
                  isActive(item.href)
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                }`}
                onClick={() => setIsSidebarOpen(false)}
              >
                <item.icon className="h-4 w-4 mr-3" />
                {item.label}
              </Button>
            </Link>
          ))}
        </nav>

        {/* Bottom links */}
        <div className="p-2 border-t border-gray-800">
          <Link href="https://docs.genrtl.ai" target="_blank">
            <Button
              variant="ghost"
              className="w-full justify-start h-9 px-3 text-gray-400 hover:text-white hover:bg-gray-800/50"
            >
              <ExternalLink className="h-4 w-4 mr-3" />
              Docs
            </Button>
          </Link>
          <Link href="mailto:support@genrtl.ai">
            <Button
              variant="ghost"
              className="w-full justify-start h-9 px-3 text-gray-400 hover:text-white hover:bg-gray-800/50"
            >
              <ChevronRight className="h-4 w-4 mr-3" />
              Contact Us
            </Button>
          </Link>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 overflow-y-auto lg:p-0 pt-16 lg:pt-0">
        {children}
      </main>
    </div>
  );
}
