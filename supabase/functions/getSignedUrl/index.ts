import { load } from "@std/dotenv";
import { serve } from "std/http/server";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

await load({ export: true });

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_ANON_KEY")! 
);

// Removing character from filePath
function removeCharactersFromFileUploaded(name: string): string {
  return name
    .normalize("NFKD")               
    .replace(/\s+/g, "_")            
    .replace(/[^a-zA-Z0-9._-]/g, "") 
    .toLowerCase();                  
}


serve(async (req) => {
  const url = new URL(req.url);

  const pathname = url.pathname;

  if (pathname.endsWith("/signup")) {
  } 
  else if (pathname.endsWith("/signin")) {
  }
   else if (pathname.endsWith("/uploadFile")) {
  }
   else if (pathname.endsWith("/getSignedUrl")) {
  }
   else {
    return new Response("Not found", { status: 404 });
  }


  // Handles JSON response messages
  function jsonResponse(body: Record<string, unknown>, status = 200) {
    return new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }

  //SignUp
  if (url.pathname === "/signup" && req.method === "POST") {
    try {
      const body = await req.json();
      const { email, password } = body;

      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) return jsonResponse({ error: error.message, code: 400 }, 400);

      return jsonResponse({ data });
    } catch (err) {
      console.error(err);
      return jsonResponse({ error: "Internal Server Error", code: 500 }, 500);
    }
  }

  //SignIn
  if (url.pathname === "/signin" && req.method === "POST") {
    try {
      const body = await req.json();
      const { email, password } = body;

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) return jsonResponse({ error: error.message, code: 401 }, 401);

      return jsonResponse({ data });
    } catch (err) {
      console.error(err);
      return jsonResponse({ error: "Internal Server Error", code: 500 }, 500);
    }
  }

  //Upload file Using multipart form-data
  if (req.method === "POST" && url.pathname === "/uploadFile") {
    try {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) return jsonResponse({ error: "Missing Authorization header", code: 401 }, 401);

      const token = authHeader.replace("Bearer ", "");
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);
      if (userError || !user) return jsonResponse({ error: "Invalid or expired token", code: 401 }, 401);

      // Parse multipart form-data
      const formData = await req.formData();
      const file = formData.get("file") as File;
      if (!file) return jsonResponse({ error: "file is required", code: 400 }, 400);


      const sanitizedName = removeCharactersFromFileUploaded(file.name);
      const filePath = `user-${user.id}/${sanitizedName}`;
      const { error: uploadError } = await supabase.storage
        .from("files")
        .upload(filePath, file.stream(), { upsert: true });

      if (uploadError) throw uploadError;

      await supabase.from("files").insert({ path: filePath, owner_id: user.id });

      return jsonResponse({ filePath });
    } catch (err) {
      console.error(err);
      return jsonResponse({ error: "Internal Server Error", code: 500 }, 500);
    }
  }

  //Get Signed Url
  if (req.method === "POST" && url.pathname === "/getSignedUrl") {
    try {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) return jsonResponse({ error: "Missing Authorization header", code: 401 }, 401);

      const token = authHeader.replace("Bearer ", "");
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);
      if (userError || !user) return jsonResponse({ error: "Invalid or expired token", code: 401 }, 401);

      const { filePath } = await req.json();
      if (!filePath) return jsonResponse({ error: "filePath is required", code: 400 }, 400);

      const { data: file, error: fileError } = await supabase
        .from("files")
        .select("*")
        .eq("path", filePath)
        .eq("owner_id", user.id)
        .single();

      if (fileError || !file) return jsonResponse({ error: "Forbidden", code: 403 }, 403);

      // const expiry = typeof expiresIn === "number" ? expiresIn : 60;
      const expiry = 60;

      const { data: signedUrl, error: urlError } = await supabase.storage
        .from("files")
        .createSignedUrl(filePath, expiry);

      if (urlError || !signedUrl) throw urlError;

      return jsonResponse({ url: signedUrl.signedUrl, expiresIn: expiry });
    } catch (err) {
      console.error(err);
      return jsonResponse({ error: "Internal Server Error", code: 500 }, 500);
    }
  }

  return jsonResponse({ error: "Not Found", code: 404 }, 404);
});
