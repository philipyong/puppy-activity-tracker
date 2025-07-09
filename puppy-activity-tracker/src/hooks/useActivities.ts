import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Activity, ActivityInsert, ActivityType } from '@/types/database.types'
import { User } from '@supabase/supabase-js'

export function useActivities(user: User | null) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchActivities = useCallback(async () => {
    if (!user) {
      setActivities([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false })

      if (error) throw error
      setActivities(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch activities')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchActivities()
  }, [fetchActivities])

  async function addActivity(
    type: ActivityType,
    notes?: string,
    photoUrl?: string
  ): Promise<Activity> {
    if (!user) throw new Error('User not authenticated')

    try {
      const activityData: ActivityInsert = {
        user_id: user.id,
        type,
        timestamp: new Date().toISOString(),
        notes: notes || null,
        photo_url: photoUrl || null,
      }

      const { data, error } = await supabase
        .from('activities')
        .insert(activityData)
        .select()
        .single()

      if (error) throw error

      setActivities(prev => [data, ...prev])
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add activity')
      throw err
    }
  }

  async function updateActivity(
    id: string,
    updates: Partial<Pick<Activity, 'type' | 'notes' | 'photo_url' | 'timestamp'>>
  ): Promise<Activity> {
    if (!user) throw new Error('User not authenticated')

    try {
      const { data, error } = await supabase
        .from('activities')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error

      setActivities(prev =>
        prev.map(activity =>
          activity.id === id ? data : activity
        ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      )
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update activity')
      throw err
    }
  }

  async function deleteActivity(id: string) {
    if (!user) throw new Error('User not authenticated')

    try {
      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error

      setActivities(prev => prev.filter(activity => activity.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete activity')
      throw err
    }
  }

  return {
    activities,
    loading,
    error,
    addActivity,
    updateActivity,
    deleteActivity,
    refetch: fetchActivities,
  }
}
