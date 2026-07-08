import "jsr:@supabase/functions-js/edge-runtime.d.ts";

type IdeasWebhookPayload = {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  schema: string;
  record: {
    id?: string;
    idea_text?: string;
    created_at?: string;
  } | null;
  old_record: unknown;
};

function formatMessage(payload: IdeasWebhookPayload) {
  const idea = payload.record?.idea_text ?? "(empty)";
  const createdAt = payload.record?.created_at ?? new Date().toISOString();
  const id = payload.record?.id ?? "unknown";
  return [
    "jsonRender · 新用户创意",
    `时间: ${createdAt}`,
    `ID: ${id}`,
    `内容: ${idea}`
  ].join("\n");
}

function buildWebhookBody(payload: IdeasWebhookPayload, webhookType: string) {
  const text = formatMessage(payload);

  if (webhookType === "slack") {
    return JSON.stringify({ text });
  }

  if (webhookType === "discord") {
    return JSON.stringify({ content: text });
  }

  return JSON.stringify({
    title: "jsonRender · 新用户创意",
    text,
    payload
  });
}

async function sendTelegramMessage(text: string) {
  const token = Deno.env.get("TELEGRAM_BOT_TOKEN");
  const chatId = Deno.env.get("TELEGRAM_CHAT_ID");

  if (!token || !chatId) {
    return new Response(JSON.stringify({ error: "TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not set" }), {
      status: 500,
      headers: { "content-type": "application/json" }
    });
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text
    })
  });

  const responseText = await response.text();
  if (!response.ok) {
    return new Response(
      JSON.stringify({
        error: "Telegram API failed",
        status: response.status,
        body: responseText
      }),
      { status: 502, headers: { "content-type": "application/json" } }
    );
  }

  return new Response(JSON.stringify({ ok: true, channel: "telegram", response: responseText }), {
    status: 200,
    headers: { "content-type": "application/json" }
  });
}

async function sendWebhookMessage(payload: IdeasWebhookPayload) {
  const webhookUrl = Deno.env.get("NOTIFY_WEBHOOK_URL");
  if (!webhookUrl) {
    return new Response(JSON.stringify({ error: "NOTIFY_WEBHOOK_URL is not set" }), {
      status: 500,
      headers: { "content-type": "application/json" }
    });
  }

  const webhookType = (Deno.env.get("NOTIFY_WEBHOOK_TYPE") || "generic").toLowerCase();
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: buildWebhookBody(payload, webhookType)
  });

  const responseText = await response.text();
  if (!response.ok) {
    return new Response(
      JSON.stringify({
        error: "Notification webhook failed",
        status: response.status,
        body: responseText
      }),
      { status: 502, headers: { "content-type": "application/json" } }
    );
  }

  return new Response(JSON.stringify({ ok: true, channel: webhookType, response: responseText }), {
    status: 200,
    headers: { "content-type": "application/json" }
  });
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let payload: IdeasWebhookPayload;
  try {
    payload = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "content-type": "application/json" }
    });
  }

  if (payload.type !== "INSERT" || payload.table !== "ideas") {
    return new Response(JSON.stringify({ ok: true, skipped: true }), {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  }

  const text = formatMessage(payload);
  const notifyChannel = (Deno.env.get("NOTIFY_CHANNEL") || "telegram").toLowerCase();

  if (notifyChannel === "telegram") {
    return sendTelegramMessage(text);
  }

  return sendWebhookMessage(payload);
});
