const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing required backend secrets for discord-webhook", {
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceRoleKey: !!serviceRoleKey,
    });

    return new Response(JSON.stringify({ error: "Server configuration error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data: settings } = await supabase
    .from("site_settings")
    .select("key, value")
    .in("key", ["discord_webhook_url", "discord_role_id"]);

  const settingsMap: Record<string, string> = {};
  (settings || []).forEach((s: any) => { settingsMap[s.key] = s.value; });

  const webhookUrl = settingsMap["discord_webhook_url"]?.trim();
  const roleId = settingsMap["discord_role_id"]?.trim();

  if (!webhookUrl) {
    return new Response(JSON.stringify({ error: "Discord webhook not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { title, category, imageUrl, accountUrl } = await req.json();

    // Category-specific messaging
    const categoryUpper = (category || "").toUpperCase();
    const dropTitle = `🔥 FREE ${categoryUpper} ACCOUNT WITH ${title.toUpperCase()}`;

    const normalizedAccountUrl = typeof accountUrl === "string" ? accountUrl.trim() : "";
    const hasValidAccountUrl = /^https?:\/\//i.test(normalizedAccountUrl);
    const accountLinkLine = hasValidAccountUrl
      ? `> [${categoryUpper} ACCOUNT](${normalizedAccountUrl})\n`
      : `> ${categoryUpper} ACCOUNT\n`;

    const normalizedImageUrl = typeof imageUrl === "string" ? imageUrl.trim() : "";
    const hasValidImageUrl = /^https?:\/\//i.test(normalizedImageUrl);

    const description = [
      `**${dropTitle}**\n`,
      `**CLICK ON THE LINK BELOW TO GET THE ACCESS**\n`,
      accountLinkLine,
      `📌**IMPORTANT:**`,
      `*If you see a "Something went wrong" message pop up, don't worry! That doesn't mean the account isn't working. The account is fine, but too many people are trying to access it at the same time, which is why the error is showing. Just be patient and try again later.` +
      `Please do not attempt to change passwords, enable Steam Guard, or alter any account settings. Any modifications to these accounts may result in them being disabled or locked. Use these accounts responsibly and as intended enjoy.*💗`,
    ].join('\n');

    const embed = {
      description,
      color: 0xe74c3c,
      ...(hasValidImageUrl ? { thumbnail: { url: normalizedImageUrl } } : {}),
    };

    const discordResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: roleId ? `<@&${roleId}>` : undefined,
        embeds: [embed],
      }),
    });

    if (!discordResponse.ok) {
      const errorBody = await discordResponse.text();
      console.error("Discord webhook request failed", {
        status: discordResponse.status,
        statusText: discordResponse.statusText,
        body: errorBody,
      });

      return new Response(JSON.stringify({ error: "Discord rejected webhook payload" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
