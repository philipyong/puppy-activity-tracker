"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Heart,
  Camera,
  Clock,
  Calendar,
  LogOut,
  Mail,
  Lock,
  Edit,
  Trash2,
  MoreVertical,
  Search,
  Filter,
  BarChart3
} from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/components/AuthProvider";
import { useActivities } from "@/hooks/useActivities";
import { signUp, signIn } from "@/lib/auth-helpers";
import { uploadPhoto } from "@/lib/storage";
import { ActivityType, Activity } from "@/types/database.types";

export default function Home() {
  const { user, userProfile, loading: authLoading, emailVerified, signOut } = useAuth();
  const { activities, loading: activitiesLoading, addActivity, updateActivity, deleteActivity } = useActivities(user);

  const [showAuth, setShowAuth] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    puppyName: '',
    password: ''
  });
  const [newActivity, setNewActivity] = useState({ notes: '', photo: '' });
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [selectedActivityType, setSelectedActivityType] = useState<ActivityType | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Edit activity states
  const [showEditActivity, setShowEditActivity] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [editFormData, setEditFormData] = useState({ notes: '', photo: '', type: 'poop' as ActivityType, timestamp: '' });

  // Delete activity states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingActivity, setDeletingActivity] = useState<Activity | null>(null);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<ActivityType | 'all'>('all');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [displayLimit, setDisplayLimit] = useState(20);

  useEffect(() => {
    if (!authLoading && !user) {
      setShowAuth(true);
    }
  }, [authLoading, user]);

  const handleAuth = async () => {
    try {
      setAuthSubmitting(true);
      setAuthError(null);

      if (isSignUp) {
        await signUp(formData.email, formData.password, formData.name, formData.puppyName);
        alert('Check your email for the confirmation link!');
      } else {
        await signIn(formData.email, formData.password);
      }

      setShowAuth(false);
      setFormData({ email: '', name: '', puppyName: '', password: '' });
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleAddActivity = async (type: ActivityType) => {
    try {
      await addActivity(type, newActivity.notes || undefined, newActivity.photo || undefined);
      setNewActivity({ notes: '', photo: '' });
      setShowAddActivity(false);
      setSelectedActivityType(null);
    } catch (error) {
      console.error('Failed to add activity:', error);
      alert('Failed to add activity. Please try again.');
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('Photo must be smaller than 5MB');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    try {
      setUploadingPhoto(true);

      // Try to upload to Supabase Storage first
      try {
        const photoUrl = await uploadPhoto(file, user.id);
        if (isEdit) {
          setEditFormData(prev => ({ ...prev, photo: photoUrl }));
        } else {
          setNewActivity(prev => ({ ...prev, photo: photoUrl }));
        }
      } catch (storageError) {
        console.warn('Storage upload failed, falling back to base64:', storageError);

        // Fallback to base64 if storage fails
        const reader = new FileReader();
        reader.onload = (e) => {
          if (isEdit) {
            setEditFormData(prev => ({ ...prev, photo: e.target?.result as string }));
          } else {
            setNewActivity(prev => ({ ...prev, photo: e.target?.result as string }));
          }
        };
        reader.readAsDataURL(file);
      }
    } catch (error) {
      console.error('Photo upload error:', error);
      alert('Failed to upload photo. Please try again.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleEditActivity = (activity: Activity) => {
    setEditingActivity(activity);
    setEditFormData({
      notes: activity.notes || '',
      photo: activity.photo_url || '',
      type: activity.type,
      timestamp: format(new Date(activity.timestamp), "yyyy-MM-dd'T'HH:mm")
    });
    setShowEditActivity(true);
  };

  const handleUpdateActivity = async () => {
    if (!editingActivity) return;

    try {
      const updates: Partial<Activity> = {
        type: editFormData.type,
        notes: editFormData.notes || null,
        photo_url: editFormData.photo || null,
        timestamp: new Date(editFormData.timestamp).toISOString()
      };

      await updateActivity(editingActivity.id, updates);
      setShowEditActivity(false);
      setEditingActivity(null);
      setEditFormData({ notes: '', photo: '', type: 'poop', timestamp: '' });
    } catch (error) {
      console.error('Failed to update activity:', error);
      alert('Failed to update activity. Please try again.');
    }
  };

  const handleDeleteActivity = async () => {
    if (!deletingActivity) return;

    try {
      await deleteActivity(deletingActivity.id);
      setShowDeleteConfirm(false);
      setDeletingActivity(null);
    } catch (error) {
      console.error('Failed to delete activity:', error);
      alert('Failed to delete activity. Please try again.');
    }
  };

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'poop': return '💩';
      case 'pee': return '💧';
      case 'eat': return '🍽️';
      case 'cry_start': return '😢';
      case 'cry_stop': return '😊';
    }
  };

  const getActivityLabel = (type: ActivityType) => {
    switch (type) {
      case 'poop': return 'Pooped';
      case 'pee': return 'Peed';
      case 'eat': return 'Ate';
      case 'cry_start': return 'Started Crying';
      case 'cry_stop': return 'Stopped Crying';
    }
  };

  const getActivityColor = (type: ActivityType) => {
    switch (type) {
      case 'poop': return 'bg-amber-100 text-amber-800';
      case 'pee': return 'bg-blue-100 text-blue-800';
      case 'eat': return 'bg-green-100 text-green-800';
      case 'cry_start': return 'bg-red-100 text-red-800';
      case 'cry_stop': return 'bg-emerald-100 text-emerald-800';
    }
  };

  const formatActivityTime = (timestamp: string) => {
    const activityDate = new Date(timestamp);
    const today = new Date();
    const isToday = format(activityDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
    const isYesterday = format(activityDate, 'yyyy-MM-dd') === format(new Date(today.getTime() - 24 * 60 * 60 * 1000), 'yyyy-MM-dd');

    if (isToday) {
      return `Today, ${format(activityDate, 'h:mm a')}`;
    } else if (isYesterday) {
      return `Yesterday, ${format(activityDate, 'h:mm a')}`;
    } else {
      return format(activityDate, 'MMM d, h:mm a');
    }
  };

  // Filter activities based on search, type, and date range
  const filteredActivities = activities.filter(activity => {
    const matchesSearch = searchQuery === '' ||
      activity.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getActivityLabel(activity.type).toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = filterType === 'all' || activity.type === filterType;

    // Date range filtering
    const activityDate = new Date(activity.timestamp);
    const matchesDateFrom = dateFrom === '' || activityDate >= new Date(dateFrom + 'T00:00:00');
    const matchesDateTo = dateTo === '' || activityDate <= new Date(dateTo + 'T23:59:59');

    return matchesSearch && matchesFilter && matchesDateFrom && matchesDateTo;
  });

  // Paginated activities for display
  const displayedActivities = filteredActivities.slice(0, displayLimit);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-4 mx-auto">
            <span className="text-4xl">🐕</span>
          </div>
          <p className="text-lg text-orange-800 mb-2">Loading...</p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>

          {/* Debug info for production */}
          <div className="mt-8 text-xs text-gray-500 max-w-md">
            <p>If this takes more than 10 seconds, there might be a connection issue.</p>
            <button
              onClick={() => {
                console.log('🔍 Debug Info:');
                console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 30) + '...');
                console.log('Supabase Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Present' : 'Missing');
                console.log('Environment:', process.env.NODE_ENV);
                alert('Check browser console for debug info');
              }}
              className="mt-2 text-orange-600 hover:text-orange-800 underline"
            >
              Debug Connection
            </button>
            <button
              onClick={() => window.location.reload()}
              className="ml-4 mt-2 text-orange-600 hover:text-orange-800 underline"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Handle case where user is authenticated but email not verified
  if (user && !emailVerified && !authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-4xl">🐕</span>
            </div>
            <CardTitle className="text-2xl text-orange-800">Almost There!</CardTitle>
            <CardDescription>
              Please check your email and verify your account to continue.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                We sent a verification email to: <strong>{user.email}</strong>
              </p>
              <p className="text-sm text-gray-500">
                Click the link in the email to activate your account, then refresh this page.
              </p>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="flex-1"
              >
                Refresh Page
              </Button>
              <Button
                onClick={signOut}
                variant="outline"
                className="flex-1"
              >
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle case where user is verified but profile not loaded (temporary issue)
  if (user && emailVerified && !userProfile && !authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-4xl">🐕</span>
            </div>
            <CardTitle className="text-2xl text-orange-800">Loading Your Profile...</CardTitle>
            <CardDescription>
              Having trouble loading your profile. This might be a temporary issue.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                Your email is verified, but we're having trouble loading your profile.
              </p>
              <p className="text-sm text-gray-500">
                Try refreshing the page or continue without profile data.
              </p>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="flex-1"
              >
                Refresh Page
              </Button>
              <Button
                onClick={signOut}
                variant="outline"
                className="flex-1"
              >
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user || showAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-4xl">🐕</span>
            </div>
            <CardTitle className="text-2xl text-orange-800">Puppy Tracker</CardTitle>
            <CardDescription>
              {isSignUp ? 'Create your account' : 'Sign in to continue'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {authError && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                {authError}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter your email"
                  className="pl-10"
                />
              </div>
            </div>

            {isSignUp && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Your Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter your name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="puppyName">Puppy's Name</Label>
                  <Input
                    id="puppyName"
                    value={formData.puppyName}
                    onChange={(e) => setFormData(prev => ({ ...prev, puppyName: e.target.value }))}
                    placeholder="What's your puppy's name?"
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter your password"
                  className="pl-10"
                />
              </div>
            </div>

            <Button
              onClick={handleAuth}
              className="w-full bg-orange-500 hover:bg-orange-600"
              disabled={authLoading || !formData.email || !formData.password || (isSignUp && (!formData.name || !formData.puppyName))}
            >
              {authLoading ? 'Loading...' : isSignUp ? 'Create Account' : 'Sign In'}
              <Heart className="ml-2 h-4 w-4" />
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setAuthError(null);
                }}
                className="text-sm text-orange-600 hover:text-orange-800 underline"
              >
                {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }



  const todayActivities = activities.filter(activity =>
    format(new Date(activity.timestamp), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-orange-100 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-xl">🐕</span>
            </div>
            <div>
              <p className="font-semibold text-orange-800">{userProfile?.puppy_name || 'Your Puppy'}</p>
              <p className="text-sm text-orange-600">with {userProfile?.name || user?.email?.split('@')[0] || 'You'}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="text-orange-600 hover:text-orange-800"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Quick Action Buttons */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Clock className="mr-2 h-5 w-5 text-orange-500" />
              Quick Log Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {[
                { type: 'poop' as const, label: 'Poop', icon: '💩', color: 'border-amber-200 hover:border-amber-300 hover:bg-amber-50 text-amber-700' },
                { type: 'pee' as const, label: 'Pee', icon: '💧', color: 'border-blue-200 hover:border-blue-300 hover:bg-blue-50 text-blue-700' },
                { type: 'eat' as const, label: 'Eat', icon: '🍽️', color: 'border-green-200 hover:border-green-300 hover:bg-green-50 text-green-700' },
              ].map((activity) => (
                <Button
                  key={activity.type}
                  variant="outline"
                  onClick={() => {
                    setSelectedActivityType(activity.type);
                    setShowAddActivity(true);
                  }}
                  className={`${activity.color} h-20 flex-col space-y-2 bg-white border-2 transition-all duration-200 hover:scale-[1.02] hover:shadow-sm`}
                >
                  <span className="text-3xl">{activity.icon}</span>
                  <span className="text-sm font-medium">{activity.label}</span>
                </Button>
              ))}
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedActivityType('cry_start');
                  setShowAddActivity(true);
                }}
                className="border-red-200 hover:border-red-300 hover:bg-red-50 text-red-700 h-20 flex-col space-y-2 bg-white border-2 transition-all duration-200 hover:scale-[1.02] hover:shadow-sm"
              >
                <span className="text-3xl">😢</span>
                <span className="text-sm font-medium">Start Crying</span>
              </Button>
            </div>
            <div className="mt-3">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedActivityType('cry_stop');
                  setShowAddActivity(true);
                }}
                className="w-full border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50 text-emerald-700 h-14 flex items-center justify-center space-x-3 bg-white border-2 transition-all duration-200 hover:scale-[1.01] hover:shadow-sm"
              >
                <span className="text-2xl">😊</span>
                <span className="font-medium">Stop Crying</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Today's Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Calendar className="mr-2 h-5 w-5 text-orange-500" />
              Today's Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="space-y-1">
                <p className="text-2xl font-bold text-amber-600">
                  {todayActivities.filter(a => a.type === 'poop').length}
                </p>
                <p className="text-sm text-gray-600">Poops</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-blue-600">
                  {todayActivities.filter(a => a.type === 'pee').length}
                </p>
                <p className="text-sm text-gray-600">Pees</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-green-600">
                  {todayActivities.filter(a => a.type === 'eat').length}
                </p>
                <p className="text-sm text-gray-600">Meals</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-red-600">
                  {todayActivities.filter(a => a.type === 'cry_start').length}
                </p>
                <p className="text-sm text-gray-600">Cry Episodes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search and Filter */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span className="flex items-center">
                <Search className="mr-2 h-5 w-5 text-orange-500" />
                Activities
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAnalytics(!showAnalytics)}
                className="flex items-center space-x-1 text-orange-600 hover:text-orange-700 hover:bg-orange-50 transition-colors"
              >
                <BarChart3 className="h-4 w-4" />
                <span className="text-sm font-medium">Analytics</span>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Search and Type Filter Row */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <Input
                    placeholder="Search activities or notes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="sm:w-40">
                  <Select value={filterType} onValueChange={(value: ActivityType | 'all') => setFilterType(value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="poop">💩 Poop</SelectItem>
                      <SelectItem value="pee">💧 Pee</SelectItem>
                      <SelectItem value="eat">🍽️ Eat</SelectItem>
                      <SelectItem value="cry_start">😢 Crying</SelectItem>
                      <SelectItem value="cry_stop">😊 Happy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Quick Filters Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm text-gray-600 font-medium">Quick Filters</Label>
                  {(dateFrom || dateTo) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setDateFrom('');
                        setDateTo('');
                      }}
                      className="h-7 px-2 text-xs text-gray-500 hover:text-gray-700"
                    >
                      Clear Dates
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: 'Today', days: 0 },
                    { label: 'Last 7 days', days: 7 },
                    { label: 'Last 30 days', days: 30 },
                    { label: 'Last 3 months', days: 90 }
                  ].map(({ label, days }) => (
                    <Button
                      key={label}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const today = new Date();
                        const startDate = new Date();
                        startDate.setDate(today.getDate() - days);
                        setDateFrom(format(startDate, 'yyyy-MM-dd'));
                        setDateTo(format(today, 'yyyy-MM-dd'));
                      }}
                      className="h-8 text-xs bg-white hover:bg-gray-50 border-gray-200 transition-colors"
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Custom Date Range */}
              <div className="space-y-2">
                <Label className="text-sm text-gray-600 font-medium">Custom Date Range</Label>
                <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                  <div className="flex-1">
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full"
                      placeholder="From date"
                    />
                  </div>
                  <div className="flex items-center justify-center sm:px-2">
                    <span className="text-gray-400 text-sm">to</span>
                  </div>
                  <div className="flex-1">
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full"
                      placeholder="To date"
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Analytics */}
        {showAnalytics && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <BarChart3 className="mr-2 h-5 w-5 text-orange-500" />
                Weekly Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-amber-600">
                    {activities.filter(a => {
                      const activityDate = new Date(a.timestamp);
                      const weekAgo = new Date();
                      weekAgo.setDate(weekAgo.getDate() - 7);
                      return a.type === 'poop' && activityDate >= weekAgo;
                    }).length}
                  </p>
                  <p className="text-sm text-gray-600">Poops This Week</p>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-blue-600">
                    {activities.filter(a => {
                      const activityDate = new Date(a.timestamp);
                      const weekAgo = new Date();
                      weekAgo.setDate(weekAgo.getDate() - 7);
                      return a.type === 'pee' && activityDate >= weekAgo;
                    }).length}
                  </p>
                  <p className="text-sm text-gray-600">Pees This Week</p>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-green-600">
                    {activities.filter(a => {
                      const activityDate = new Date(a.timestamp);
                      const weekAgo = new Date();
                      weekAgo.setDate(weekAgo.getDate() - 7);
                      return a.type === 'eat' && activityDate >= weekAgo;
                    }).length}
                  </p>
                  <p className="text-sm text-gray-600">Meals This Week</p>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-orange-600">
                    {(activities.filter(a => {
                      const activityDate = new Date(a.timestamp);
                      const weekAgo = new Date();
                      weekAgo.setDate(weekAgo.getDate() - 7);
                      return a.type === 'poop' && activityDate >= weekAgo;
                    }).length / 7).toFixed(1)}
                  </p>
                  <p className="text-sm text-gray-600">Daily Avg Poops</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span>
                {searchQuery || filterType !== 'all' || dateFrom || dateTo ? 'Filtered Results' : 'Recent Activities'}
                {(searchQuery || filterType !== 'all' || dateFrom || dateTo) && (
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    ({filteredActivities.length} found)
                  </span>
                )}
              </span>
              {(searchQuery || filterType !== 'all' || dateFrom || dateTo) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setFilterType('all');
                    setDateFrom('');
                    setDateTo('');
                    setDisplayLimit(20);
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  Clear All
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activitiesLoading ? (
                <div className="text-center text-gray-500 py-8">
                  <p>Loading activities...</p>
                </div>
              ) : filteredActivities.length > 0 ? (
                <>
                  {displayedActivities.map((activity) => (
                  <div key={activity.id} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    {/* Header Row */}
                    <div className="flex items-start justify-between p-4">
                      <div className="flex items-center space-x-3 flex-1">
                        <div className="flex-shrink-0">
                          <span className="text-2xl">{getActivityIcon(activity.type)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <Badge className={`${getActivityColor(activity.type)} font-medium`}>
                              {getActivityLabel(activity.type)}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatActivityTime(activity.timestamp)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {/* Photo Thumbnail */}
                        {activity.photo_url && (
                          <div
                            className="relative group cursor-pointer rounded-lg overflow-hidden border border-gray-200 hover:border-orange-300 transition-colors flex-shrink-0"
                            onClick={() => {
                              // Create modal to view full image
                              const modal = document.createElement('div');
                              modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4';
                              modal.innerHTML = `
                                <div class="relative max-w-4xl max-h-full">
                                  <img src="${activity.photo_url}" class="max-w-full max-h-full object-contain rounded-lg" />
                                  <button class="absolute top-4 right-4 bg-black bg-opacity-50 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-75 transition-colors">
                                    <span class="text-xl leading-none">&times;</span>
                                  </button>
                                </div>
                              `;
                              modal.onclick = (e) => {
                                const target = e.target as HTMLElement;
                                if (target === modal || target.tagName === 'BUTTON' || target.tagName === 'SPAN') {
                                  document.body.removeChild(modal);
                                }
                              };
                              document.body.appendChild(modal);
                            }}
                          >
                            <img
                              src={activity.photo_url}
                              alt="Activity photo"
                              className="w-12 h-12 object-cover"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-colors flex items-center justify-center">
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="bg-white bg-opacity-90 rounded-full p-1">
                                  <Camera className="h-3 w-3 text-gray-700" />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Actions Dropdown */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full flex-shrink-0"
                            >
                              <MoreVertical className="h-4 w-4 text-gray-400" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem
                              onClick={() => handleEditActivity(activity)}
                              className="flex items-center space-x-2 cursor-pointer"
                            >
                              <Edit className="h-4 w-4" />
                              <span>Edit</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setDeletingActivity(activity);
                                setShowDeleteConfirm(true);
                              }}
                              className="flex items-center space-x-2 cursor-pointer text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span>Delete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Notes Row (if exists) */}
                    {activity.notes && (
                      <div className="px-4 pb-3">
                        <div className="bg-gray-50 rounded-lg p-3 border-l-4 border-orange-200">
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {activity.notes}
                          </p>
                        </div>
                      </div>
                    )}


                  </div>
                  ))}

                  {/* Load More Button */}
                  {filteredActivities.length > displayLimit && (
                    <div className="text-center pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setDisplayLimit(prev => prev + 20)}
                        className="bg-white hover:bg-gray-50 text-gray-700 border-gray-200 transition-colors"
                      >
                        Load More ({filteredActivities.length - displayLimit} remaining)
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <span className="text-4xl block mb-2">
                    {searchQuery || filterType !== 'all' || dateFrom || dateTo ? '🔍' : '🐾'}
                  </span>
                  <p>
                    {searchQuery || filterType !== 'all' || dateFrom || dateTo
                      ? 'No activities match your search criteria. Try adjusting your filters or date range.'
                      : `No activities yet. Start tracking ${userProfile?.puppy_name || 'your puppy'}'s day!`
                    }
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Activity Dialog */}
      <Dialog open={showAddActivity} onOpenChange={setShowAddActivity}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <span className="mr-2 text-2xl">
                {selectedActivityType && getActivityIcon(selectedActivityType)}
              </span>
              Add {selectedActivityType && getActivityLabel(selectedActivityType)} Activity
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={newActivity.notes}
                onChange={(e) => setNewActivity(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Any additional notes..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="photo">Photo (optional)</Label>
              <Input
                id="photo"
                type="file"
                accept="image/*"
                onChange={(e) => handlePhotoUpload(e, false)}
                className="cursor-pointer"
                disabled={uploadingPhoto}
              />
              {uploadingPhoto && (
                <div className="flex items-center space-x-2 text-sm text-orange-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
                  <span>Uploading photo...</span>
                </div>
              )}
              {newActivity.photo && !uploadingPhoto && (
                <div className="mt-2">
                  <img
                    src={newActivity.photo}
                    alt="Preview"
                    className="w-full h-32 object-cover rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={() => setNewActivity(prev => ({ ...prev, photo: '' }))}
                    className="mt-1 text-xs text-red-600 hover:text-red-800"
                  >
                    Remove photo
                  </button>
                </div>
              )}
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowAddActivity(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => selectedActivityType && handleAddActivity(selectedActivityType)}
                className="flex-1 bg-orange-500 hover:bg-orange-600"
              >
                Add Activity
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Activity Dialog */}
      <Dialog open={showEditActivity} onOpenChange={setShowEditActivity}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <span className="mr-2 text-2xl">
                {editFormData.type && getActivityIcon(editFormData.type)}
              </span>
              Edit {editFormData.type && getActivityLabel(editFormData.type)} Activity
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editType">Activity Type</Label>
              <select
                id="editType"
                value={editFormData.type}
                onChange={(e) => setEditFormData(prev => ({ ...prev, type: e.target.value as ActivityType }))}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="poop">💩 Poop</option>
                <option value="pee">💧 Pee</option>
                <option value="eat">🍽️ Eat</option>
                <option value="cry_start">😢 Start Crying</option>
                <option value="cry_stop">😊 Stop Crying</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editTimestamp">Date & Time</Label>
              <Input
                id="editTimestamp"
                type="datetime-local"
                value={editFormData.timestamp}
                onChange={(e) => setEditFormData(prev => ({ ...prev, timestamp: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editNotes">Notes (optional)</Label>
              <Textarea
                id="editNotes"
                value={editFormData.notes}
                onChange={(e) => setEditFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Any additional notes..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editPhoto">Photo (optional)</Label>
              <Input
                id="editPhoto"
                type="file"
                accept="image/*"
                onChange={(e) => handlePhotoUpload(e, true)}
                className="cursor-pointer"
                disabled={uploadingPhoto}
              />
              {uploadingPhoto && (
                <div className="flex items-center space-x-2 text-sm text-orange-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
                  <span>Uploading photo...</span>
                </div>
              )}
              {editFormData.photo && !uploadingPhoto && (
                <div className="mt-2">
                  <img
                    src={editFormData.photo}
                    alt="Preview"
                    className="w-full h-32 object-cover rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={() => setEditFormData(prev => ({ ...prev, photo: '' }))}
                    className="mt-1 text-xs text-red-600 hover:text-red-800"
                  >
                    Remove photo
                  </button>
                </div>
              )}
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowEditActivity(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateActivity}
                className="flex-1 bg-orange-500 hover:bg-orange-600"
              >
                Update Activity
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <Trash2 className="mr-2 h-5 w-5 text-red-500" />
              Delete Activity
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this {deletingActivity && getActivityLabel(deletingActivity.type).toLowerCase()} activity?
              {deletingActivity?.notes && (
                <span className="block mt-2 text-sm italic">"{deletingActivity.notes}"</span>
              )}
              <span className="block mt-2 text-xs text-gray-500">
                {deletingActivity && formatActivityTime(deletingActivity.timestamp)}
              </span>
              <br />
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteActivity}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Delete Activity
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
