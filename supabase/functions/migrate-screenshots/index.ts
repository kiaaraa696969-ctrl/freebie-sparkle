import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  // Find accounts with base64 screenshots (they start with "data:")
  const { data: accounts, error } = await supabase
    .from("accounts")
    .select("id, screenshot")
    .not("screenshot", "is", null)
    .like("screenshot", "data:%")
    .limit(5);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const base64Accounts = (accounts || []).filter(
    (a: any) => a.screenshot && a.screenshot.startsWith("data:")
  );

  let migrated = 0;
  let failed = 0;

  for (const account of base64Accounts) {
    try {
      const base64String = account.screenshot as string;
      // Extract mime type and data
      const matches = base64String.match(/^data:([^;]+);base64,(.+)$/);
      if (!matches) {
        failed++;
        continue;
      }

      const mimeType = matches[1];
      const base64Data = matches[2];
      const ext = mimeType.split("/")[1] || "png";
      const fileName = `${account.id}.${ext}`;

      // Decode base64 to binary
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("screenshots")
        .upload(fileName, bytes.buffer, {
          contentType: mimeType,
          upsert: true,
        });

      if (uploadError) {
        console.error(`Upload failed for ${account.id}:`, uploadError);
        failed++;
        continue;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("screenshots")
        .getPublicUrl(fileName);

      // Update account with URL
      const { error: updateError } = await supabase
        .from("accounts")
        .update({ screenshot: urlData.publicUrl })
        .eq("id", account.id);

      if (updateError) {
        console.error(`Update failed for ${account.id}:`, updateError);
        failed++;
        continue;
      }

      migrated++;
    } catch (err) {
      console.error(`Migration failed for ${account.id}:`, err);
      failed++;
    }
  }

  return new Response(
    JSON.stringify({
      total: base64Accounts.length,
      migrated,
      failed,
      skipped: (accounts || []).length - base64Accounts.length,
    }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
});
