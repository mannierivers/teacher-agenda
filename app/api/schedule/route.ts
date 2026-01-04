import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date'); 
  const calendarId = process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_ID;
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

  if (!date || !calendarId) return NextResponse.json({ scheduleType: 'NONE', schoolEvents: [] });

  try {
    const timeMin = `${date}T00:00:00Z`;
    const timeMax = `${date}T23:59:59Z`;
    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?key=${apiKey}&timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`;

    const response = await fetch(url, { cache: 'no-store' });
    const data = await response.json();
    const items = data.items || [];

    let detectedType = 'NONE';
    const schoolEvents: string[] = [];

    items.forEach((event: any) => {
      const title = (event.summary || "").toUpperCase();
      if (title.includes('SCHEDULE A')) detectedType = 'A';
      else if (title.includes('SCHEDULE B')) {
        detectedType = 'B';
        if (title.includes('ASSEMBLY')) detectedType = 'B-Assembly';
        else if (title.includes('EARLY')) detectedType = 'B-Early';
        else if (title.includes('LATE')) detectedType = 'B-Late';
      } 
      else if (title.includes('SCHEDULE C')) detectedType = 'C';
      
      const isScheduleLabel = title.includes('SCHEDULE') || title === 'A' || title === 'B' || title === 'C';
      if (!isScheduleLabel && title.length > 2) schoolEvents.push(event.summary);
    });

    return NextResponse.json({ scheduleType: detectedType, schoolEvents });
  } catch (error) {
    return NextResponse.json({ scheduleType: 'NONE', schoolEvents: [] });
  }
}