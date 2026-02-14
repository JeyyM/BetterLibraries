// Supabase Edge Function to get teacher dashboard data
// Bypasses RLS for complex aggregations
// @ts-nocheck - Deno runtime, ignore local TypeScript errors
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with SERVICE ROLE (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get teacher email from request
    const { teacherEmail } = await req.json()

    if (!teacherEmail) {
      return new Response(
        JSON.stringify({ error: 'Teacher email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get teacher info
    const { data: teacherData, error: teacherError } = await supabaseAdmin
      .from('users')
      .select('name, id')
      .eq('email', teacherEmail)
      .eq('role', 'teacher')
      .single()

    if (teacherError || !teacherData) {
      return new Response(
        JSON.stringify({ error: 'Teacher not found', details: teacherError }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get teacher's class
    const { data: classData, error: classError } = await supabaseAdmin
      .from('classes')
      .select('name, id')
      .eq('teacher_id', teacherData.id)
      .single()

    if (classError || !classData) {
      return new Response(
        JSON.stringify({ error: 'Class not found', details: classError }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get students in class
    const { data: enrollments, error: enrollError } = await supabaseAdmin
      .from('class_enrollments')
      .select(`
        student_id,
        users!class_enrollments_student_id_fkey(id, email, name, lexile_level)
      `)
      .eq('class_id', classData.id)
      .eq('status', 'active')

    if (enrollError) {
      return new Response(
        JSON.stringify({ error: 'Failed to get enrollments', details: enrollError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const studentIds = enrollments?.map((e: any) => {
      const user = Array.isArray(e.users) ? e.users[0] : e.users
      return user?.id
    }).filter(Boolean) || []

    let studentStats: any[] = []
    let avgLexile = 0
    let weeklyBooks = 0
    let participation = 0

    if (studentIds.length > 0) {
      // Get quiz attempts for weekly books and participation
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const { data: attempts } = await supabaseAdmin
        .from('quiz_attempts')
        .select('student_id, completed_at')
        .in('student_id', studentIds)
        .gte('completed_at', sevenDaysAgo.toISOString())
        .not('completed_at', 'is', null)

      weeklyBooks = attempts?.length || 0

      // Calculate participation (students with activity in last 7 days)
      const activeStudentIds = new Set(attempts?.map((a: any) => a.student_id) || [])
      participation = Math.round((activeStudentIds.size / studentIds.length) * 100)

      // Get all quiz attempts for books read count
      const { data: allAttempts } = await supabaseAdmin
        .from('quiz_attempts')
        .select('student_id, id')
        .in('student_id', studentIds)
        .not('completed_at', 'is', null)

      // Calculate average lexile
      const lexileLevels = enrollments
        ?.map((e: any) => {
          const user = Array.isArray(e.users) ? e.users[0] : e.users
          return user?.lexile_level || 0
        })
        .filter((l: number) => l > 0) || []

      avgLexile = lexileLevels.length > 0
        ? Math.round(lexileLevels.reduce((sum: number, l: number) => sum + l, 0) / lexileLevels.length)
        : 0

      // Build student stats
      studentStats = enrollments?.map((e: any) => {
        const user = Array.isArray(e.users) ? e.users[0] : e.users
        const studentAttempts = allAttempts?.filter((a: any) => a.student_id === user?.id) || []

        return {
          id: user?.id,
          name: user?.name || 'Unknown',
          email: user?.email || '',
          lexile: user?.lexile_level || 0,
          booksRead: studentAttempts.length,
        }
      }).filter((s: any) => s.id) || []

      // Sort by lexile
      studentStats.sort((a: any, b: any) => a.lexile - b.lexile)
    }

    // Build leaderboard (sort by books read)
    const leaderboard = [...studentStats].sort((a: any, b: any) => b.booksRead - a.booksRead).slice(0, 5)

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          teacherName: teacherData.name,
          className: classData.name,
          avgLexile,
          weeklyBooks,
          participation,
          students: studentStats,
          leaderboard,
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
