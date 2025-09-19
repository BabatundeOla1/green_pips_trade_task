import { load } from "@std/dotenv";
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const env = await load({export: true});
// console.log("Loaded ENV:", env);

const supabaseUrl = Deno.env.get("SUPABASE_URL")!
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")! 
const supabase = createClient(supabaseUrl, supabaseKey)
// console.log("Supabase from .env: ", supabaseUrl, supabaseKey.substring(0, 10))

Deno.serve({ port: 8787 }, async (req) => {
  const url = new URL(req.url);

  if (req.method === "POST" && url.pathname === "/uploadFile") {
    try {
      //Validate JWT
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        return new Response("Missing Authorization header", { status: 401 });
      }

      const token = authHeader.replace("Bearer ", "");
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser(token);

      if (userError || !user) {
        return new Response("Invalid or expired token", { status: 401 });
      }

      //Parse request body
      const { filePath } = await req.json();
      if (!filePath) {
        return new Response("filePath is required", { status: 400 });
      }

      //Check file ownership
      const { data: file, error: fileError } = await supabase
        .from("files")
        .select("*")
        .eq("path", filePath)
        .eq("owner_id", user.id)
        .single();

      if (fileError || !file) {
        return new Response("Forbidden", { status: 403 });
      }

      //Generate signed URL
      const { data: signedUrl, error: urlError } = await supabase.storage
        .from("files")
        .createSignedUrl(filePath, 60);

      if (urlError || !signedUrl) {
        return new Response("Error creating signed URL", { status: 500 });
      }

      return new Response(
        JSON.stringify({ url: signedUrl.signedUrl }),
        { headers: { "Content-Type": "application/json" } },
      );
    } catch (err) {
      console.error(err);
      return new Response("Internal Server Error", { status: 500 });
    }
  }

  return new Response("Not Found", { status: 404 });
});
