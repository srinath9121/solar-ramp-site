import { NextRequest, NextResponse } from "next/server";

const HF = "https://srinath44-solar-ramp-unseen.hf.space";
const UNSEEN_START = 180_000;

export async function POST(req: NextRequest) {
  try {
    const { sample_idx = 0, theta = 0.30, session_id } = await req.json();

    // ── Call HuggingFace Gradio ───────────────────────────────
    const hfRes = await fetch(`${HF}/run/predict`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ data: [sample_idx, theta, false], fn_index: 0 }),
      signal:  AbortSignal.timeout(35_000),
    });

    if (!hfRes.ok) {
      return NextResponse.json({ error: `HF error ${hfRes.status}` }, { status: 502 });
    }

    const hf      = await hfRes.json();
    const summary: string = hf.data?.[3] ?? "";
    const verdict: string = hf.data?.[4] ?? "";
    const parsed  = parse(summary);

    // ── Log to Supabase ───────────────────────────────────────
    let sid = session_id;
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const db = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
      );

      // Create session if needed
      if (!sid) {
        const { data: sess } = await db
          .from("solar_sessions")
          .insert({ user_agent: req.headers.get("user-agent") ?? "", referrer: req.headers.get("referer") ?? "" })
          .select("id").single();
        sid = sess?.id;
      }

      // Log prediction
      if (parsed) {
        await db.from("solar_predictions").insert({
          session_id:  sid ?? null,
          sample_idx,
          abs_row:     sample_idx + UNSEEN_START,
          timestamp:   parsed.ts,
          pred_class:  parsed.pred,
          true_class:  parsed.true_,
          correct:     parsed.correct,
          p_noramp:    parsed.p0,
          p_moderate:  parsed.p1,
          p_severe:    parsed.p2,
          pred_pv:     parsed.predPv,
          true_pv:     parsed.truePv,
          drop_pct:    parsed.drop,
          theta,
        });
      }
    } catch (dbErr) {
      console.warn("[supabase]", dbErr);
      // non-fatal — don't block the response
    }

    return NextResponse.json({
      session_id: sid,
      sample_idx,
      abs_row:    sample_idx + UNSEEN_START,
      verdict,
      summary,
      pred_class: parsed?.pred   ?? 0,
      true_class: parsed?.true_  ?? 0,
      correct:    parsed?.correct ?? false,
      p_noramp:   parsed?.p0     ?? 0,
      p_moderate: parsed?.p1     ?? 0,
      p_severe:   parsed?.p2     ?? 0,
      pred_pv:    parsed?.predPv,
      true_pv:    parsed?.truePv,
      drop_pct:   parsed?.drop,
    });

  } catch (err: any) {
    console.error("[/api/predict]", err);
    return NextResponse.json({ error: err.message ?? "Internal error" }, { status: 500 });
  }
}

// Parse the Gradio summary string
function parse(s: string) {
  try {
    const lines = s.split("\n");
    const get   = (k: string) => lines.find(l=>l.includes(k))?.split(":").slice(1).join(":").trim()??"";
    const num   = (k: string) => parseFloat(get(k).replace("%","")) || 0;
    const emoji = (str: string) => str.includes("🔴")?2:str.includes("🟡")?1:0;
    return {
      ts:      get("Timestamp"),
      pred:    emoji(lines.find(l=>l.includes("Class")&&!l.includes("True"))??"") as 0|1|2,
      true_:   emoji(lines.find(l=>l.includes("True Label"))??"")              as 0|1|2,
      correct: s.includes("✅"),
      p0:      num("P(No-Ramp)")  / 100,
      p1:      num("P(Moderate)") / 100,
      p2:      num("P(Severe)")   / 100,
      predPv:  parseFloat(get("PV (t+10)")) || undefined,
      truePv:  parseFloat(lines.find(l=>l.includes("PV")&&l.includes("True"))?.match(/([\d.]+)\s*kW/)?.[1]??"") || undefined,
      drop:    num("Drop"),
    };
  } catch { return null; }
}

export async function GET() {
  return NextResponse.json({ status: "ok", space: HF });
}
