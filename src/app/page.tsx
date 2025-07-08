"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Heart,
  Camera,
  Clock,
  Calendar,
  LogOut,
  Mail,
  Lock
} from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/components/AuthProvider";
import { useActivities } from "@/hooks/useActivities";
import { signUp, signIn } from "@/lib/auth-helpers";
import { uploadPhoto } from "@/lib/storage";
import { ActivityType } from "@/types/database.types";

export default function Home() {
  const { user, userProfile, loading: authLoading, signOut } = useAuth();
  const { activities, loading: activitiesLoading, addActivity } = useActivities(user);

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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
        setNewActivity(prev => ({ ...prev, photo: photoUrl }));
      } catch (storageError) {
        console.warn('Storage upload failed, falling back to base64:', storageError);

        // Fallback to base64 if storage fails
        const reader = new FileReader();
        reader.onload = (e) => {
          setNewActivity(prev => ({ ...prev, photo: e.target?.result as string }));
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

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-4 mx-auto">
            <span className="text-4xl">🐕</span>
          </div>
          <p className="text-lg text-orange-800">Loading...</p>
        </div>
      </div>
    );
  }

  // Handle case where user is authenticated but email not verified or profile not created
  if (user && !userProfile && !authLoading) {
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

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-4 mx-auto">
            <span className="text-4xl">🐕</span>
          </div>
          <p className="text-lg text-orange-800">Setting up your profile...</p>
        </div>
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
              <p className="font-semibold text-orange-800">{userProfile.puppy_name}</p>
              <p className="text-sm text-orange-600">with {userProfile.name}</p>
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
                { type: 'poop' as const, label: 'Poop', icon: '💩', color: 'bg-amber-500' },
                { type: 'pee' as const, label: 'Pee', icon: '💧', color: 'bg-blue-500' },
                { type: 'eat' as const, label: 'Eat', icon: '🍽️', color: 'bg-green-500' },
              ].map((activity) => (
                <Button
                  key={activity.type}
                  onClick={() => {
                    setSelectedActivityType(activity.type);
                    setShowAddActivity(true);
                  }}
                  className={`${activity.color} hover:opacity-90 text-white h-16 flex-col space-y-1`}
                >
                  <span className="text-2xl">{activity.icon}</span>
                  <span className="text-sm">{activity.label}</span>
                </Button>
              ))}
              <Button
                onClick={() => {
                  setSelectedActivityType('cry_start');
                  setShowAddActivity(true);
                }}
                className="bg-red-500 hover:opacity-90 text-white h-16 flex-col space-y-1"
              >
                <span className="text-2xl">😢</span>
                <span className="text-sm">Start Crying</span>
              </Button>
            </div>
            <div className="mt-3">
              <Button
                onClick={() => {
                  setSelectedActivityType('cry_stop');
                  setShowAddActivity(true);
                }}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white h-12 flex items-center justify-center space-x-2"
              >
                <span className="text-xl">😊</span>
                <span>Stop Crying</span>
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

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activitiesLoading ? (
                <div className="text-center text-gray-500 py-8">
                  <p>Loading activities...</p>
                </div>
              ) : activities.length > 0 ? (
                activities.slice(0, 10).map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-3 p-3 bg-white rounded-lg border">
                    <span className="text-2xl">{getActivityIcon(activity.type)}</span>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <Badge className={getActivityColor(activity.type)}>
                          {getActivityLabel(activity.type)}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {format(new Date(activity.timestamp), 'HH:mm')}
                        </span>
                      </div>
                      {activity.notes && (
                        <p className="text-sm text-gray-600 mt-1">{activity.notes}</p>
                      )}
                    </div>
                    {activity.photo_url && (
                      <div className="flex items-center space-x-2">
                        <Camera className="h-4 w-4 text-gray-400" />
                        <img
                          src={activity.photo_url}
                          alt="Activity photo"
                          className="w-16 h-16 object-cover rounded-lg border"
                          onClick={() => {
                            // Create modal to view full image
                            const modal = document.createElement('div');
                            modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
                            modal.innerHTML = `
                              <div class="max-w-4xl max-h-4xl p-4">
                                <img src="${activity.photo_url}" class="max-w-full max-h-full object-contain rounded-lg" />
                                <button class="absolute top-4 right-4 text-white text-2xl">&times;</button>
                              </div>
                            `;
                            modal.onclick = (e) => {
                              const target = e.target as HTMLElement;
                              if (target === modal || (target && target.tagName === 'BUTTON')) {
                                document.body.removeChild(modal);
                              }
                            };
                            document.body.appendChild(modal);
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <span className="text-4xl block mb-2">🐾</span>
                  <p>No activities yet. Start tracking {userProfile.puppy_name}'s day!</p>
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
                onChange={handlePhotoUpload}
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
    </div>
  );
}
