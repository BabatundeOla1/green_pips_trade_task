// import { load } from "@std/dotenv";
// import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// await load({ export: true });

// const supabase = createClient(
//   Deno.env.get("SUPABASE_URL")!,
//   Deno.env.get("SUPABASE_ANON_KEY")! // Use anon key for client ops
// );

// Deno.serve(async (req) => {
//   const url = new URL(req.url);

//   //SIGNUP
//   if (url.pathname === "/signup" && req.method === "POST") {
//     const body = await req.json();
//     const { email, password } = body;

//     const { data, error } = await supabase.auth.signUp({ email, password });
//     if (error) return new Response(error.message, { status: 400 });

//     return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
//   }

//   //SIGNIN
//   if (url.pathname === "/signin" && req.method === "POST") {
//     const body = await req.json();
//     const { email, password } = body;

//     const { data, error } = await supabase.auth.signInWithPassword({ email, password });
//     if (error) return new Response(error.message, { status: 401 });

//     return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
//   }

//   //UPLOAD FILE
//   if (req.method === "POST" && url.pathname === "/uploadFile") {
//     try {
//       const authHeader = req.headers.get("Authorization");
//       if (!authHeader) return new Response("Missing Authorization header", { status: 401 });

//       const token = authHeader.replace("Bearer ", "");
//       const { data: { user }, error: userError } = await supabase.auth.getUser(token);
//       if (userError || !user) return new Response("Invalid or expired token", { status: 401 });

//       // Parse multipart form-data
//       const formData = await req.formData();
//       const file = formData.get("file") as File;
//       if (!file) return new Response("file is required", { status: 400 });

//       const filePath = `user-${user.id}/${file.name}`;
//       const { error: uploadError } = await supabase.storage
//         .from("files")
//         .upload(filePath, file.stream(), { upsert: true });

//       if (uploadError) throw uploadError;

//       // Save metadata in DB
//       await supabase.from("files").insert({ path: filePath, owner_id: user.id });

//       return new Response(JSON.stringify({ filePath }), {
//         headers: { "Content-Type": "application/json" },
//       });
//     } catch (err) {
//       console.error(err);
//       return new Response("Internal Server Error", { status: 500 });
//     }
//   }

//   //GET SIGNED URL
//   if (req.method === "POST" && url.pathname === "/getSignedUrl") {
//     try {
//       const authHeader = req.headers.get("Authorization");
//       if (!authHeader) return new Response("Missing Authorization header", { status: 401 });

//       const token = authHeader.replace("Bearer ", "");
//       const { data: { user }, error: userError } = await supabase.auth.getUser(token);
//       if (userError || !user) return new Response("Invalid or expired token", { status: 401 });

//       const { filePath } = await req.json();
//       if (!filePath) return new Response("filePath is required", { status: 400 });

//       // Verify ownership in DB
//       const { data: file, error: fileError } = await supabase
//         .from("files")
//         .select("*")
//         .eq("path", filePath)
//         .eq("owner_id", user.id)
//         .single();

//       if (fileError || !file) return new Response("Forbidden", { status: 403 });

//       const { data: signedUrl, error: urlError } = await supabase.storage
//         .from("files")
//         .createSignedUrl(filePath, 60);

//       if (urlError || !signedUrl) throw urlError;

//       return new Response(JSON.stringify({ url: signedUrl.signedUrl }), {
//         headers: { "Content-Type": "application/json" },
//       });
//     } catch (err) {
//       console.error(err);
//       return new Response("Internal Server Error", { status: 500 });
//     }
//   }
//   return new Response("Not Found", { status: 404 });
// });




import { load } from "@std/dotenv";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

await load({ export: true });

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_ANON_KEY")! 
);

Deno.serve(async (req) => {
  const url = new URL(req.url);

  // Utility for JSON responses
  function jsonResponse(body: Record<string, unknown>, status = 200) {
    return new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }

  //SIGNUP
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

  //SIGNIN
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

  //UPLOAD FILE
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

      const filePath = `user-${user.id}/${file.name}`;
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

  //GET SIGNED URL
  if (req.method === "POST" && url.pathname === "/getSignedUrl") {
    try {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) return jsonResponse({ error: "Missing Authorization header", code: 401 }, 401);

      const token = authHeader.replace("Bearer ", "");
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);
      if (userError || !user) return jsonResponse({ error: "Invalid or expired token", code: 401 }, 401);

      const { filePath, expiresIn } = await req.json();
      if (!filePath) return jsonResponse({ error: "filePath is required", code: 400 }, 400);

      const { data: file, error: fileError } = await supabase
        .from("files")
        .select("*")
        .eq("path", filePath)
        .eq("owner_id", user.id)
        .single();

      if (fileError || !file) return jsonResponse({ error: "Forbidden", code: 403 }, 403);

      const expiry = typeof expiresIn === "number" ? expiresIn : 60; // default 60 seconds
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
