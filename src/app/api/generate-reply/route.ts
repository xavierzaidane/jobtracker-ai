import { NextRequest, NextResponse } from "next/server";

interface GenerateReplyPayload {
  company: string;
  role: string;
  sender?: string;
  emailSubject?: string;
  emailContent?: string;
  tone: "accept_time" | "reschedule" | "skill_test" | "clarify";
  customInstructions?: string;
  candidateName?: string;
}

export async function POST(req: NextRequest) {
  try {
    const payload: GenerateReplyPayload = await req.json();
    const {
      company,
      role,
      sender = "Recruiter",
      emailSubject = "",
      emailContent = "",
      tone = "accept_time",
      customInstructions = "",
      candidateName = "Xavier",
    } = payload;

    const apiKey = process.env.GEMINI_API_KEY?.trim() || "";

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing GEMINI_API_KEY in frontend/.env.local. Please add your Google AI Studio API key.",
        },
        { status: 400 }
      );
    }

    const toneDescriptions = {
      accept_time:
        "Enthusiastically accept the interview. If the recruiter proposed specific dates or times, confirm them. If they provided a scheduling link, confirm receipt and mention you will book a slot.",
      reschedule:
        "Thank the recruiter for the interview invitation, politely state you have a scheduling conflict with the proposed time, and offer 2-3 alternate windows. Strictly prioritize any times or days mentioned in candidate's custom instructions.",
      skill_test:
        "Acknowledge receipt of the skill assessment, take-home test, or coding challenge. Confirm you have access to the instructions and state a clear target delivery timeframe (e.g. within 48 hours or by the deadline).",
      clarify:
        "Thank the recruiter for reaching out and politely ask concise clarifying questions about the role, interview format, next steps, or technical expectations.",
    };

    const prompt = `You are an expert career assistant drafting a professional email response on behalf of candidate ${candidateName}.
    
CONTEXT:
Company: ${company}
Role: ${role}
Recruiter Sender: ${sender}
Original Email Subject: ${emailSubject || "Interview / Application Update"}
Original Email Content from Recruiter:
"""
${emailContent || "We would like to invite you for an interview to discuss the role."}
"""

DESIRED TONE & GOAL:
${toneDescriptions[tone] || toneDescriptions.accept_time}

${
  customInstructions
    ? `ADDITIONAL CANDIDATE INSTRUCTIONS (PRIORITIZE THESE):\n"${customInstructions}"\n`
    : ""
}

INSTRUCTIONS:
1. Write a direct, natural, professional email reply from ${candidateName}.
2. Do not write generic robotic filler. Keep it concise, warm, and confident.
3. If the recruiter email mentioned specific names, dates, or topics, address them naturally.
4. Output STRICTLY a JSON object with exactly these fields:
   - "subject": string (e.g. "Re: ${emailSubject || `Interview for ${role} at ${company}`}")
   - "body": string (complete formatted email body including salutation and sign-off from ${candidateName})
   - "intent": string ("interview_accept", "interview_reschedule", "skill_test_acknowledge", or "interview_clarify")`;

    // Supported models in Google AI Studio
    const envModel = process.env.GEMINI_MODEL?.trim();
    const modelNames = Array.from(
      new Set(
        [
          envModel,
          "gemini-2.5-flash",
          "gemini-2.5-flash-lite",
          "gemini-2.0-flash",
          "gemini-1.5-flash",
          "gemini-3.6-flash",
        ].filter(Boolean)
      )
    ) as string[];
    let geminiResponseText = "";
    let lastApiError = "";

    for (const model of modelNames) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.3,
              responseMimeType: "application/json",
            },
          }),
        });

        if (res.ok) {
          const resJson = await res.json();
          geminiResponseText =
            resJson.candidates?.[0]?.content?.parts?.[0]?.text || "";
          if (geminiResponseText) break;
        } else {
          const errText = await res.text();
          let parsedMessage = errText;
          try {
            const errObj = JSON.parse(errText);
            parsedMessage = errObj.error?.message || errObj.message || errText;
          } catch {}
          lastApiError = `Gemini API (${res.status}): ${parsedMessage}`;
        }
      } catch (networkErr: any) {
        lastApiError = `Network error connecting to Gemini API: ${networkErr.message}`;
      }
    }

    if (!geminiResponseText) {
      return NextResponse.json(
        {
          success: false,
          error:
            lastApiError ||
            "Gemini API returned an empty response. Please verify your GEMINI_API_KEY permissions.",
        },
        { status: 502 }
      );
    }

    // Clean JSON markdown fences if present
    const cleanedText = geminiResponseText
      .replace(/^```json\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    const parsed = JSON.parse(cleanedText);

    return NextResponse.json({
      success: true,
      isAIGenerated: true,
      subject:
        parsed.subject ||
        `Re: ${emailSubject || `Interview for ${role} at ${company}`}`,
      body: parsed.body,
      intent: parsed.intent || tone,
    });
  } catch (err: any) {
    console.error("Error in generate-reply endpoint:", err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to process Gemini reply generation.",
      },
      { status: 500 }
    );
  }
}
