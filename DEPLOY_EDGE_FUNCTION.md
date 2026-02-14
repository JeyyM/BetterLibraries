# Deploy Teacher Dashboard Edge Function to Supabase

## Prerequisites
1. Install Supabase CLI: https://supabase.com/docs/guides/cli
2. Login to Supabase CLI: `supabase login`
3. Link your project: `supabase link --project-ref YOUR_PROJECT_REF`

## Deploy Command
```powershell
supabase functions deploy get-teacher-dashboard
```

## Alternative: Manual Deployment via Dashboard
1. Go to Supabase Dashboard → Edge Functions
2. Click "Create a new function"
3. Name it: `get-teacher-dashboard`
4. Copy the contents of `supabase/functions/get-teacher-dashboard/index.ts`
5. Paste and deploy

## Testing
```powershell
# Test locally
supabase functions serve

# Test the function
curl -i --location --request POST 'http://localhost:54321/functions/v1/get-teacher-dashboard' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"teacherEmail":"jerrysmith@email.com"}'
```

## Note
Make sure your Supabase project has the SERVICE_ROLE_KEY environment variable set (it's automatic).
