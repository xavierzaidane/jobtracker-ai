import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const webhookUrl =
      process.env.NEXT_PUBLIC_N8N_REPLY_WEBHOOK_URL ||
      process.env.N8N_REPLY_WEBHOOK_URL ||
      "http://localhost:5678/webhook/send-recruiter-reply";

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify(body),
    });

    const responseText = await res.text();
    let data: any = {};
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { raw: responseText };
    }

    if (!res.ok) {
      return NextResponse.json(
        {
          success: false,
          error: data.message || `n8n webhook error (${res.status})`,
        },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (err: any) {
    console.error("Error proxying to n8n webhook:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to reach n8n webhook" },
      { status: 502 }
    );
  }
}

