import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const WAHA_URL = Deno.env.get("WAHA_URL") || "http://waha:3000";
const WAHA_API_KEY = Deno.env.get("WAHA_API_KEY") || "038e00c4bf9448b2a0fe948ea9b2b141";

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
    const { phone, message, buttons } = await req.json();

    if (!phone || !message) {
      throw new Error("Missing phone or message");
    }

    // Format phone
    let cleanedPhone = phone.replace(/\D/g, "");
    if (cleanedPhone.startsWith("0")) cleanedPhone = "212" + cleanedPhone.substring(1);
    if (cleanedPhone.length === 9) cleanedPhone = "212" + cleanedPhone;

    const hasButtons = buttons && Array.isArray(buttons) && buttons.length > 0;
    
    // Clean URL to avoid double slashes
    let baseUrl = WAHA_URL?.endsWith("/") ? WAHA_URL.slice(0, -1) : WAHA_URL;
    
    // Auto-rewrite public IP to internal Docker service name if running inside VPS
    if (baseUrl && (baseUrl.includes("185.197.249.4") || baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1"))) {
      baseUrl = "http://waha:3000";
    }
    
    // On utilise sendPoll car c'est beaucoup plus compatible que les boutons classiques
    const endpoint = hasButtons ? "sendPoll" : "sendText";
    const fullUrl = `${baseUrl}/api/${endpoint}`;

    const payload: any = {
      chatId: `${cleanedPhone}@c.us`,
      session: "default"
    };

    if (hasButtons) {
      payload.name = message; // Dans un sondage, le texte principal est le 'name'
      payload.options = buttons.map((b: any) => b.text);
      payload.multipleAnswers = false;
    } else {
      payload.text = message;
    }

    console.log(`[WAHA] Sending to: ${fullUrl}`);
    console.log(`[WAHA] Payload: ${JSON.stringify(payload)}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(fullUrl, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json", 
        "X-Api-Key": WAHA_API_KEY || "" 
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const result = await response.json();
    console.log(`[WAHA] Response status: ${response.status}`);
    console.log(`[WAHA] Response data: ${JSON.stringify(result)}`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: response.status,
    });
  } catch (error) {
    console.error("WAHA Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
