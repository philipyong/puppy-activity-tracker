import { supabase } from './supabase'

const BUCKET_NAME = 'puppy-photos'

export async function uploadPhoto(file: File, userId: string): Promise<string> {
  try {
    // Create unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Upload error:', error)
      throw error
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName)

    return publicUrl
  } catch (error) {
    console.error('Error uploading photo:', error)
    throw error
  }
}

export async function deletePhoto(photoUrl: string): Promise<void> {
  try {
    // Extract filename from URL
    const urlParts = photoUrl.split('/')
    const fileName = urlParts[urlParts.length - 1]

    if (!fileName) return

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([fileName])

    if (error) {
      console.error('Delete error:', error)
      throw error
    }
  } catch (error) {
    console.error('Error deleting photo:', error)
    throw error
  }
}

// Function to ensure bucket exists (for setup)
export async function ensureBucketExists(): Promise<void> {
  try {
    const { data: buckets } = await supabase.storage.listBuckets()

    const bucketExists = buckets?.some(bucket => bucket.name === BUCKET_NAME)

    if (!bucketExists) {
      const { error } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        fileSizeLimit: 5242880, // 5MB
      })

      if (error && !error.message.includes('already exists')) {
        throw error
      }
    }
  } catch (error) {
    console.error('Error ensuring bucket exists:', error)
    // Don't throw - we'll fall back to base64 if storage isn't available
  }
}
