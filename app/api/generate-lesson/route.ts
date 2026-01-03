import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  try {
    const { topic, isBulk, sectionTitle, subject } = await req.json();

    const systemPrompt = isBulk 
      ? `You are an expert high school curriculum designer for the ${subject} department. 
         Generate a lesson plan for ${topic}. 
         Return a JSON object with keys: "objective", "bellRinger", "miniLecture", "discussion", "activity", "independentWork".`
      : `You are a ${subject} teacher's assistant. Generate concise content for the "${sectionTitle}" section of a lesson about ${topic}. Output only content.`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "system", content: systemPrompt }, { role: "user", content: topic }],
      model: "llama-3.3-70b-versatile",
      response_format: isBulk ? { type: "json_object" } : undefined,
    });

    const res = completion.choices[0]?.message?.content || "";
    return NextResponse.json(isBulk ? JSON.parse(res) : { content: res });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}