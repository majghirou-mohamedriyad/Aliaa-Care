import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const OPENWA_URL = Deno.env.get("OPENWA_URL") || "http://185.197.249.4:2785";
const OPENWA_API_KEY = Deno.env.get("OPENWA_API_KEY") || "owa_k1_8e8d1dad118d422c4b0bcc77723a9719eca52913e6813b2f84e32fb479f223cf";
const envSession = Deno.env.get("OPENWA_SESSION_ID");
const OPENWA_SESSION_ID = (!envSession || envSession === "7160c79d-aef0-4c64-b6f0-aeb466f0d76f")
  ? "5d4375fc-95a8-4740-8b08-afdb4ea8dba3"
  : envSession;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { phone, message } = await req.json();

    if (!phone || !message) {
      throw new Error("Missing phone or message");
    }

    // Format phone number
    let cleanedPhone = phone.replace(/\D/g, "");
    if (cleanedPhone.startsWith("0")) cleanedPhone = "212" + cleanedPhone.substring(1);
    if (cleanedPhone.length === 9) cleanedPhone = "212" + cleanedPhone;

    // Clean URL to avoid double slashes
    let baseUrl = OPENWA_URL?.endsWith("/") ? OPENWA_URL.slice(0, -1) : OPENWA_URL;

    // OpenWA send-text endpoint
    const fullUrl = `${baseUrl}/api/sessions/${OPENWA_SESSION_ID}/messages/send-text`;

    const payload = {
      chatId: `${cleanedPhone}@c.us`,
      text: message
    };

    console.log(`[OpenWA] Sending to: ${fullUrl}`);
    console.log(`[OpenWA] Payload: ${JSON.stringify(payload)}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (OPENWA_API_KEY) {
      headers["X-API-Key"] = OPENWA_API_KEY;
    }

    const response = await fetch(fullUrl, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const result = await response.json();
    console.log(`[OpenWA] Response status: ${response.status}`);
    console.log(`[OpenWA] Response data: ${JSON.stringify(result)}`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: response.status,
    });
  } catch (error) {
    console.error("OpenWA Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
