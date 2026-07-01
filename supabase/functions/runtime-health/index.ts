Deno.serve(() => {
  return new Response(
    JSON.stringify({
      ok: true,
      service: "runtime-health",
      runtimePlane: "supabase-oss",
      managedBy: "open-backend-cloud",
    }),
    {
      headers: {
        "content-type": "application/json; charset=utf-8",
      },
    },
  );
});
