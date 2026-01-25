'use client';

import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
  Monitor, 
  Globe, 
  Trash2,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface Session {
  id: string;
  type: 'web' | 'desktop' | 'mobile';
  created_at: string;
  last_active?: string;
  ip_address?: string;
  user_agent?: string;
}

export default function SettingsPage() {
  const { data: user } = useSWR<any>('/api/user', fetcher);
  const { data: settingsData, mutate: mutateSettings } = useSWR('/api/dashboard/settings', fetcher);
  const { data: sessionsData, mutate: mutateSessions } = useSWR<{ sessions: Session[] }>('/api/dashboard/sessions', fetcher);
  
  const [showAllSessions, setShowAllSessions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);

  // 处理数据共享开关
  const handleShareDataToggle = async (enabled: boolean) => {
    try {
      await fetch('/api/dashboard/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ share_data: enabled })
      });
      mutateSettings();
    } catch (error) {
      console.error('Failed to update settings:', error);
    }
  };

  // 处理会话撤销
  const handleRevokeSession = async (sessionId: string) => {
    setRevoking(sessionId);
    try {
      await fetch(`/api/dashboard/sessions/${sessionId}`, {
        method: 'DELETE'
      });
      mutateSessions();
    } catch (error) {
      console.error('Failed to revoke session:', error);
    } finally {
      setRevoking(null);
    }
  };

  // 处理账号删除
  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch('/api/user/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        // 重定向到删除确认页面
        window.location.href = '/delete-account?requested=true';
      }
    } catch (error) {
      console.error('Failed to request account deletion:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  // 格式化会话创建时间
  const formatSessionTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    return `${diffDays} days ago`;
  };

  // 获取会话图标
  const getSessionIcon = (type: string) => {
    switch (type) {
      case 'desktop':
        return <Monitor className="h-4 w-4 text-gray-400" />;
      case 'web':
        return <Globe className="h-4 w-4 text-gray-400" />;
      default:
        return <Monitor className="h-4 w-4 text-gray-400" />;
    }
  };

  const sessions = sessionsData?.sessions || [];
  const displayedSessions = showAllSessions ? sessions : sessions.slice(0, 5);
  const hiddenSessionsCount = sessions.length - 5;

  return (
    <div className="min-h-full bg-[#0a0a0a] text-white p-6 lg:p-8">
      <h1 className="text-2xl font-semibold mb-8">Settings</h1>

      {/* Privacy Section */}
      <section className="mb-10">
        <h2 className="text-sm text-gray-400 uppercase tracking-wide mb-4">Privacy</h2>
        
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-medium">Share Data</h3>
                <span className="px-2 py-0.5 bg-green-500/10 text-green-400 text-xs rounded-full">
                  {settingsData?.share_data ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-sm text-gray-400 mt-1">
                Your codebase, prompts, edits and other usage data will be stored and trained on by Cursor to improve the product.
              </p>
              <a href="#" className="text-sm text-cyan-400 hover:underline mt-2 inline-block">
                Learn More
              </a>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={settingsData?.share_data ?? true}
                onCheckedChange={handleShareDataToggle}
              />
              <Button 
                variant="outline" 
                size="sm"
                className="border-gray-700 text-gray-900 bg-white hover:bg-gray-100 hover:text-gray-900"
              >
                Edit
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Student Verification Section */}
      <section className="mb-10">
        <h2 className="text-sm text-gray-400 uppercase tracking-wide mb-4">Student Verification</h2>
        
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Student Status</h3>
              <p className="text-sm text-gray-400 mt-1">
                Only .edu emails and specific educational domains are eligible for student verification.
              </p>
            </div>
              <Button 
                variant="outline" 
                size="sm"
                className="border-gray-700 text-gray-900 bg-white hover:bg-gray-100 hover:text-gray-900"
                disabled
              >
                <Monitor className="h-4 w-4 mr-2" />
                Not Eligible
              </Button>
          </div>
        </div>
      </section>

      {/* Active Sessions Section */}
      <section className="mb-10">
        <h2 className="text-sm text-gray-400 uppercase tracking-wide mb-4">Active Sessions</h2>
        
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl divide-y divide-gray-800">
          {displayedSessions.map((session) => (
            <div key={session.id} className="flex items-center justify-between p-5">
              <div className="flex items-center gap-3">
                {getSessionIcon(session.type)}
                <div>
                  <h3 className="font-medium capitalize">
                    {session.type === 'desktop' ? 'Desktop App' : session.type === 'web' ? 'Web' : 'Mobile App'}
                  </h3>
                  <p className="text-sm text-gray-400">
                    Created {formatSessionTime(session.created_at)}
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                className="border-gray-700 text-gray-900 bg-white hover:bg-gray-100 hover:text-gray-900"
                onClick={() => handleRevokeSession(session.id)}
                disabled={revoking === session.id}
              >
                {revoking === session.id ? 'Revoking...' : 'Revoke'}
              </Button>
            </div>
          ))}
          
          {hiddenSessionsCount > 0 && !showAllSessions && (
            <div className="p-5">
              <button 
                className="text-sm text-gray-400 hover:text-white flex items-center gap-2"
                onClick={() => setShowAllSessions(true)}
              >
                <span className="text-lg">···</span>
                <span>See {hiddenSessionsCount} more</span>
              </button>
            </div>
          )}
        </div>
        
        <p className="text-sm text-gray-500 mt-3">
          Session revocation may take up to 10 minutes to complete
        </p>
      </section>

      {/* More Section - Delete Account */}
      <section className="mb-10">
        <h2 className="text-sm text-gray-400 uppercase tracking-wide mb-4">More</h2>
        
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Delete Account</h3>
              <p className="text-sm text-gray-400 mt-1">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              className="border-red-900/50 text-red-400 hover:bg-red-900/20 hover:border-red-800"
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete
            </Button>
          </div>
        </div>
      </section>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-500/10 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <h2 className="text-xl font-semibold">Delete Account</h2>
            </div>
            
            <p className="text-gray-400 mb-6">
              Are you sure you want to delete your account? This will permanently remove:
            </p>
            
            <ul className="text-sm text-gray-400 space-y-2 mb-6">
              <li className="flex items-center gap-2">
                <span className="text-red-400">•</span>
                All your personal data and settings
              </li>
              <li className="flex items-center gap-2">
                <span className="text-red-400">•</span>
                Your subscription and billing history
              </li>
              <li className="flex items-center gap-2">
                <span className="text-red-400">•</span>
                All usage history and analytics
              </li>
            </ul>
            
            <p className="text-sm text-red-400 mb-6">
              This action cannot be undone.
            </p>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-gray-700 text-gray-900 bg-white hover:bg-gray-100 hover:text-gray-900"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1 bg-red-600 hover:bg-red-700"
                onClick={handleDeleteAccount}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Account'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

