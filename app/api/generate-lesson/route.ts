import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  const { prompt } = await req.json();

  const completion = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "llama3-70b-8192", // Using the 70b model for better lesson planning
  });

  return Response.json({ 
    content: completion.choices[0]?.message?.content || "" 
  });
}