# Teacher Vetting Assignment Setup

To enable the assignment functionality for teacher vetting folders, you need to create the assignments table in your Supabase database.

## Quick Setup

1. **Open Supabase Dashboard**
   - Go to [your Supabase project dashboard](https://supabase.com/dashboard)
   - Navigate to **SQL Editor** in the sidebar

2. **Run the Schema**
   - Copy the entire contents of `teacher-vetting-assignments-schema.sql`
   - Paste it into the SQL Editor
   - Click **Run** to execute the script

3. **Verify Setup**
   - Refresh your teacher vetting page
   - You should now see assignment functionality (assign buttons) on folder cards
   - The error message should disappear

## What This Creates

The schema creates:
- **`teacher_vetting_assignments` table** - Stores folder assignments
- **Indexes** - For fast lookups
- **RLS Policies** - For secure access
- **Triggers** - For auto-updating timestamps
- **View** - For assignment statistics (optional)

## Features Enabled

Once set up, you can:
- ✅ **Assign folders** to specific people by email/name
- ✅ **Edit assignments** to reassign or update details
- ✅ **View assignment status** directly on folder cards
- ✅ **Track assignment history** with timestamps
- ✅ **Delete entire folders** (removes assignments + feedback + files)

## Troubleshooting

**Still seeing "Assignment table not found" error?**
- Make sure you ran the entire SQL script
- Check that the table exists in your database schema
- Refresh the page after creating the table

**Assignment buttons not appearing?**
- This is normal if the table doesn't exist yet
- Run the SQL schema first, then refresh

**Want to remove assignment functionality?**
- Simply don't run the SQL schema
- The app works perfectly without assignments
- Folders will show "Assignment feature not available"

## File Structure

```
teacher-vetting-assignments-schema.sql  ← Run this in Supabase
TEACHER_VETTING_SETUP.md               ← This guide
components/TeacherVettingFileGrid.tsx  ← Main component
utils/supabase.ts                      ← Assignment functions
```

## Next Steps

After setup:
1. Upload a teacher vetting CSV file
2. Click the assign button (👤+) on any folder
3. Enter assignee name and email
4. Save the assignment

The folder will now show the assignee information and you can edit or delete as needed! 