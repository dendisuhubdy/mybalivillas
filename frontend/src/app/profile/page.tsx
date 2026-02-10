'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getProfile, updateProfile } from '@/lib/api';
import { User } from '@/lib/types';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    avatar_url: '',
  });

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login?redirect=/profile');
      return;
    }

    async function loadProfile() {
      try {
        const response = await getProfile();
        const u = response.data;
        setUser(u);
        setFormData({
          full_name: u.full_name || u.name || '',
          phone: u.phone || '',
          avatar_url: u.avatar_url || '',
        });
      } catch {
        setError('Failed to load profile. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
    setSuccessMsg('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name.trim()) {
      setError('Name is required');
      return;
    }

    setIsSaving(true);
    setError('');
    setSuccessMsg('');

    try {
      const response = await updateProfile({
        full_name: formData.full_name,
        phone: formData.phone || undefined,
        avatar_url: formData.avatar_url || undefined,
      });

      const updated = response.data;
      setUser(updated);

      // Update localStorage
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      const merged = {
        ...stored,
        full_name: updated.full_name,
        name: updated.full_name,
        phone: updated.phone,
        avatar_url: updated.avatar_url,
      };
      localStorage.setItem('user', JSON.stringify(merged));
      window.dispatchEvent(new Event('auth-change'));

      setIsEditing(false);
      setSuccessMsg('Profile updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const displayName = user?.full_name || user?.name || '';
  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const roleBadgeColor = {
    admin: 'bg-red-100 text-red-700',
    agent: 'bg-blue-100 text-blue-700',
    user: 'bg-gray-100 text-gray-700',
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3 text-gray-500">
          <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading profile...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500">{error || 'Unable to load profile'}</p>
          <button onClick={() => router.push('/login')} className="btn-primary mt-4">
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-gray-50 py-12">
      <div className="container-custom max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>

        {successMsg && (
          <div className="mt-4 rounded-lg bg-green-50 border border-green-200 p-4">
            <p className="text-sm text-green-700">{successMsg}</p>
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-8 shadow-card">
          {/* Avatar & Name Header */}
          <div className="flex items-center gap-5">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={displayName}
                className="h-20 w-20 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-600 text-2xl font-bold text-white">
                {initials}
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-gray-900">{displayName}</h2>
              <p className="text-sm text-gray-500">{user.email}</p>
              <span className={`mt-1 inline-block rounded-full px-3 py-0.5 text-xs font-medium ${roleBadgeColor[user.role] || roleBadgeColor.user}`}>
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </span>
            </div>
          </div>

          {isEditing ? (
            <form onSubmit={handleSave} className="mt-8 space-y-5 border-t border-gray-100 pt-8">
              <div>
                <label htmlFor="full_name" className="label-field">Full Name *</label>
                <input id="full_name" name="full_name" type="text" required value={formData.full_name} onChange={handleChange} className="input-field" />
              </div>
              <div>
                <label htmlFor="phone" className="label-field">Phone</label>
                <input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="+62 xxx" className="input-field" />
              </div>
              <div>
                <label htmlFor="avatar_url" className="label-field">Avatar URL</label>
                <input id="avatar_url" name="avatar_url" type="url" value={formData.avatar_url} onChange={handleChange} placeholder="https://example.com/avatar.jpg" className="input-field" />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button type="submit" disabled={isSaving} className="btn-primary !py-2.5 !px-6">
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" onClick={() => setIsEditing(false)} className="btn-outline !py-2.5 !px-6">
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="mt-8 space-y-4 border-t border-gray-100 pt-8">
              <div className="flex justify-between">
                <div>
                  <p className="text-xs font-medium uppercase text-gray-400">Email</p>
                  <p className="mt-1 text-sm text-gray-900">{user.email}</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-gray-400">Phone</p>
                <p className="mt-1 text-sm text-gray-900">{user.phone || 'Not set'}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-gray-400">Member Since</p>
                <p className="mt-1 text-sm text-gray-900">
                  {user.created_at
                    ? new Date(user.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'Unknown'}
                </p>
              </div>
              <div className="pt-2">
                <button onClick={() => setIsEditing(true)} className="btn-primary !py-2.5 !px-6">
                  Edit Profile
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
