export async function POST(req: NextRequest) {
  try {
    // 1. Auth
    const token = req.cookies.get(SESSION_COOKIE)?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const session = await verifySession(token);
    if (!session) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

    // 2. Load user
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, balance, last_checkin_at')
      .eq('id', session.userId)
      .maybeSingle();

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // 3. Check if already checked in today
    const nowUTC = new Date();
    const todayEAT = getEATDateString(nowUTC);

    if (user.last_checkin_at) {
      const lastCheckinDate = new Date(user.last_checkin_at);
      const lastCheckinEAT = getEATDateString(lastCheckinDate);

      if (lastCheckinEAT === todayEAT) {
        return NextResponse.json(
          { error: 'You have already checked in today. Come back tomorrow!' },
          { status: 400 }
        );
      }
    }

    // 4. Add bonus to balance
    const newBalance = Number(user.balance ?? 0) + CHECKIN_BONUS;

    // 🚨 CHECK FOR DATABASE ERRORS HERE
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        balance: newBalance,
        last_checkin_at: nowUTC.toISOString(),
      })
      .eq('id', session.userId);

    if (updateError) {
      console.error('DB Update failed:', updateError);
      return NextResponse.json({ error: 'Failed to update balance in database' }, { status: 500 });
    }

    // 5. Log the transaction
    await supabaseAdmin.from('tesla_transactions').insert({
      user_id: session.userId,
      type: 'daily_checkin',
      amount: CHECKIN_BONUS,
      status: 'completed',
      meta: { reason: 'Daily check-in bonus' },
    });

    return NextResponse.json({
      success: true,
      bonus: CHECKIN_BONUS,
      newBalance, // Return the new balance to the frontend
      message: `You received UGX ${CHECKIN_BONUS.toLocaleString()} for checking in today!`,
    });

  } catch (err) {
    console.error('Check-in error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
