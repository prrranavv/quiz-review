# Supabase Setup Guide

## Prerequisites
1. Create a Supabase account at https://supabase.com
2. Create a new project in your Supabase dashboard

## Storage Bucket Configuration

### Step 1: Create Storage Bucket
1. Go to Storage → Buckets in your Supabase dashboard
2. Click "Create a new bucket"
3. Set bucket name: **`batches`** (must match exactly)
4. Set bucket to **Public** (check "Public bucket" toggle)
5. Keep other settings as default
6. Click "Save"

### Step 2: Configure Environment Variables
1. Go to Settings → API in your Supabase dashboard
2. Copy your Project URL and anon/public key
3. Update the `.env.local` file in your project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Replace the placeholder values with your actual Supabase credentials.

## Bucket Policies (Optional)
The app should work with the default bucket policies, but if you encounter access issues:

1. Go to Storage → Policies
2. For the `batches` bucket, ensure these policies exist:
   - **Allow public uploads**: Enable users to upload files
   - **Allow public downloads**: Enable users to download files
   - **Allow public listing**: Enable users to list files

## Testing the Integration
1. Start your development server: `npm run dev`
2. Upload a CSV file through the app
3. Check your Supabase Storage → Buckets → batches to see the uploaded file
4. Verify the file grid displays your uploaded files

## Features
- ✅ File upload to Supabase Storage
- ✅ File listing and display
- ✅ File download and processing
- ✅ Timestamp-based file naming to prevent conflicts
- ✅ Error handling for upload/download operations

## Troubleshooting
- **Upload fails**: Check if bucket exists and is public
- **Files don't display**: Verify environment variables are correct
- **Permission errors**: Ensure bucket policies allow public access 