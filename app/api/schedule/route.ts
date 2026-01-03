import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date'); 
  const calendarId = process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_ID;
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

  if (!date || !calendarId || !apiKey) return NextResponse.json({ scheduleType: 'NONE' });

  try {
    // We fetch from 05:00:00 on the requested day to 05:00:00 the next day 
    // This shift ensures we capture Arizona's full school day regardless of UTC offsets.
    const timeMin = `${date}T00:00:00Z`;
    const timeMax = `${date}T23:59:59Z`;

    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?key=${apiKey}&timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`;

    const response = await fetch(url, { 
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
    });
    
    const data = await response.json();
    const events = data.items || [];

    let detectedType = 'NONE';

    // LOGIC: Check events for keywords
    for (const event of events) {
      const title = (event.summary || "").toUpperCase();
      
      // If ANY event says "No School" or "Break" or "Retreat", we default to NONE 
      // UNLESS a specific Schedule is also found later.
      if (title.includes('NO SCHOOL') || title.includes('BREAK') || title.includes('OFFICE CLOSED')) {
        detectedType = 'NONE';
      }

      if (title.includes('SCHEDULE A') || title === 'A DAY') {
        detectedType = 'A';
        break; // Priority found
      } 
      if (title.includes('SCHEDULE B') || title === 'B DAY') {
        detectedType = 'B';
        if (title.includes('ASSEMBLY')) detectedType = 'B-Assembly';
        if (title.includes('EARLY')) detectedType = 'B-Early';
        if (title.includes('LATE')) detectedType = 'B-Late';
        break;
      }
      if (title.includes('SCHEDULE C') || title === 'C DAY') {
        detectedType = 'C';
        break;
      }
      if (title.includes('LATE ARRIVAL')) detectedType = 'B-Late';
      if (title.includes('ASSEMBLY')) detectedType = 'B-Assembly';
    }

    return NextResponse.json({ scheduleType: detectedType });
  } catch (error) {
    return NextResponse.json({ scheduleType: 'NONE' });
  }
}