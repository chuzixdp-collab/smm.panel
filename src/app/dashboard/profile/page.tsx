'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Shield,
  Wallet,
  Calendar,
  Save,
  Lock,
  Key,
  ChevronRight,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  balance: number;
  spent: number;
  createdAt: string;
}

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit profile
  const [name, setName] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Change password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const json = await res.json();
        const user = json.data?.user || json.data || json.user;
        setProfile(user);
        setName(user?.name || '');
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      toast.error('Name cannot be empty');
      return;
    }
    setSavingProfile(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (res.ok) {
        toast.success('Profile updated successfully');
        fetchProfile();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Failed to update profile');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword) {
      toast.error('Please enter your current password');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setChangingPassword(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'change_password',
          currentPassword,
          newPassword,
        }),
      });
      if (res.ok) {
        toast.success('Password changed successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Failed to change password');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Profile Settings</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your account information</p>
      </div>

      {loading ? (
        <ProfileSkeleton />
      ) : (
        <div className="space-y-6">
          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' as const }}
          >
            <Card className="border-slate-200">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                  {/* Avatar */}
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-xl font-bold flex-shrink-0">
                    {getInitials(profile?.name || 'U')}
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h2 className="text-lg font-semibold text-slate-900">{profile?.name}</h2>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 mt-1">
                      <span className="inline-flex items-center gap-1.5 text-sm text-slate-500">
                        <Mail className="h-3.5 w-3.5" />
                        {profile?.email}
                      </span>
                      <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 w-fit mx-auto sm:mx-0">
                        <Shield className="h-3 w-3 mr-1" />
                        {profile?.role || 'User'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <Separator className="my-5" />

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-xs text-slate-500">Balance</p>
                    <p className="text-lg font-semibold text-slate-900 mt-0.5">
                      {formatCurrency(profile?.balance || 0)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-500">Total Spent</p>
                    <p className="text-lg font-semibold text-slate-900 mt-0.5">
                      {formatCurrency(profile?.spent || 0)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-500">Role</p>
                    <p className="text-lg font-semibold text-slate-900 mt-0.5 capitalize">
                      {profile?.role || 'User'}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-500">Joined</p>
                    <p className="text-lg font-semibold text-slate-900 mt-0.5">
                      {profile?.createdAt ? formatDate(profile.createdAt) : '—'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Edit Profile */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' as const, delay: 0.05 }}
          >
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <User className="h-5 w-5" />
                  Edit Profile
                </CardTitle>
                <CardDescription>Update your account name</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      className="bg-indigo-600 hover:bg-indigo-700"
                      onClick={handleSaveProfile}
                      disabled={savingProfile}
                    >
                      {savingProfile ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      Save
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Change Password */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' as const, delay: 0.1 }}
          >
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <Lock className="h-5 w-5" />
                  Change Password
                </CardTitle>
                <CardDescription>Update your account password</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 6 characters"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                    />
                  </div>
                </div>
                <Button
                  className="bg-indigo-600 hover:bg-indigo-700"
                  onClick={handleChangePassword}
                  disabled={changingPassword}
                >
                  {changingPassword ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Lock className="h-4 w-4" />
                  )}
                  Change Password
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* API Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' as const, delay: 0.15 }}
          >
            <Card
              className="border-slate-200 cursor-pointer hover:border-indigo-200 hover:shadow-sm transition-all"
              onClick={() => router.push('/dashboard/api')}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
                      <Key className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-900">API Access</h3>
                      <p className="text-sm text-slate-500">Manage your API keys</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-400" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Delete Account */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' as const, delay: 0.2 }}
          >
            <Card className="border-red-200">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <h3 className="font-medium text-red-600">Delete Account</h3>
                    <p className="text-sm text-slate-500 mt-0.5">
                      Permanently delete your account and all associated data. This action cannot be undone.
                    </p>
                    <Button
                      variant="outline"
                      className="mt-3 text-red-600 border-red-200 hover:bg-red-50"
                      disabled
                    >
                      Delete My Account
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  );
}
