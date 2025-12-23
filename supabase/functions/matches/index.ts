/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

/**
 * Health check endpoint for the Lovable Cloud backend
 * The actual match data comes from the external Render scraper
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  return new Response(
    JSON.stringify({
      status: "ok",
      message: "LiveScore API - Match data is served from external scraper",
      timestamp: new Date().toISOString(),
      note: "Set VITE_SCRAPER_URL environment variable to your Render scraper URL",
    }),
    {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    }
  );
});
