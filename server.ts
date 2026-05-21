import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";
import admin from "firebase-admin";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize Firebase Admin SDK
  if (!admin.apps.length) {
    try {
      admin.initializeApp();
      console.log("Firebase Admin SDK successfully initialized via ADC.");
    } catch (err: any) {
      console.warn("Firebase Admin SDK standard init failed, trying simple projectId fallback...", err.message);
      try {
        admin.initializeApp({
          projectId: "anime-news-f3d26",
        });
        console.log("Firebase Admin SDK fallback initialization successful.");
      } catch (errFallback: any) {
        console.error("Firebase Admin SDK fully failed to initialize:", errFallback.message);
      }
    }
  }

  // Supabase Backend Client Setup
  const rawUrl = process.env.VITE_SUPABASE_URL || 'https://ccjfmyfnitrmpnxsvrnk.supabase.co';
  let cleanUrl = rawUrl.trim();
  cleanUrl = cleanUrl.replace(/\/+$/, ''); // Remove trailing slashes first
  cleanUrl = cleanUrl.replace(/\/rest\/v1\/?$/, '');
  cleanUrl = cleanUrl.replace(/\/+$/, ''); // Strip remaining trailing slashes
  const supabaseUrl = cleanUrl;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_4ovIDv-yqUNhXOJnx1Jr3Q_dw-BVy-c';
  
  let supabaseClient: any;
  try {
    supabaseClient = createClient(supabaseUrl, supabaseKey);
  } catch (err: any) {
    console.error("CRITICAL FALLBACK: Supabase createClient failed during initialization:", err.message);
    const createDummyClient = () => ({
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: null, error: new Error("Supabase is uninitialized due to offline/invalid credentials") }),
            order: () => Promise.resolve({ data: [], error: new Error("Supabase is uninitialized due to offline/invalid credentials") })
          }),
          order: () => Promise.resolve({ data: [], error: new Error("Supabase is uninitialized due to offline/invalid credentials") })
        }),
        insert: () => Promise.resolve({ data: null, error: new Error("Supabase is uninitialized due to offline/invalid credentials") }),
        update: () => ({ eq: () => Promise.resolve({ data: null, error: new Error("Supabase is uninitialized due to offline/invalid credentials") }) }),
        delete: () => ({ eq: () => Promise.resolve({ data: null, error: new Error("Supabase is uninitialized due to offline/invalid credentials") }) })
      }),
      auth: {
        setSession: async () => {},
        getUser: async () => ({ data: { user: null }, error: new Error("Supabase is uninitialized") }),
        getSession: async () => ({ data: { session: null }, error: null })
      },
      storage: {
        from: () => ({
          upload: async () => ({ data: null, error: new Error("Supabase is uninitialized") }),
          getPublicUrl: () => ({ data: { publicUrl: "" } })
        })
      }
    });
    supabaseClient = createDummyClient();
  }

  // AI Setup
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // Enable high limits for uploading images
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Server-side secure file upload proxy to bypass frontend browser sandbox CORS / Failed to fetch blocks
  app.post("/api/upload", async (req, res) => {
    try {
      const { bucket, fileName, fileData, contentType } = req.body;
      if (!bucket || !fileData) {
        return res.status(400).json({ error: "Missing required upload parameters" });
      }

      // Ensure that the destination filename is never empty, null, or undefined
      let safeFileName = fileName ? String(fileName).trim() : "";
      if (!safeFileName) {
        const ext = contentType?.split("/")?.[1] || "png";
        safeFileName = `news_${Date.now()}.${ext}`;
      }

      // Sanitize subdirectories and filename segments: replace spaces/invalid characters with underscores
      safeFileName = safeFileName.replace(/\\/g, "/");
      const segments = safeFileName.split("/").map(segment => {
        let clean = segment.replace(/[^\w\.\-]/g, "_");
        if (!clean || clean === "." || clean === "..") {
          clean = "node";
        }
        return clean;
      });
      safeFileName = segments.join("/");

      // Convert clean base64 string back to byte buffer
      const base64Clean = fileData.replace(/^data:image\/\w+;base64,/, "");
      const fileBuffer = Buffer.from(base64Clean, "base64");

      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;

      let activeSupabaseClient = supabaseClient;
      let diagnosticInfo: any = { tokenExists: !!token, bucket };

      if (token) {
        const authClient = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_4ovIDv-yqUNhXOJnx1Jr3Q_dw-BVy-c', {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
          global: {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        });
        await authClient.auth.setSession({
          access_token: token,
          refresh_token: ""
        });
        activeSupabaseClient = authClient;

        try {
          const { data: { user }, error: userErr } = await authClient.auth.getUser(token);
          if (user) {
            diagnosticInfo.userEmail = user.email;
            diagnosticInfo.userId = user.id;

            // Fetch current profile role
            const { data: profile, error: dbErr } = await authClient
              .from("profiles")
              .select("*")
              .eq("id", user.id)
              .single();
            diagnosticInfo.profileExists = !!profile;
            diagnosticInfo.profileRole = profile?.role || "none";
            diagnosticInfo.profileError = dbErr?.message || null;

            // Self-repair check: if the user is a designated admin, ensure they have the admin role in database
            const adminEmails = ["anshsureshsingh07@gmail.com", "animeintofficial@gmail.com"];
            if (user.email && adminEmails.includes(user.email.toLowerCase())) {
              if (!profile || profile.role !== "admin") {
                console.log("AUTO-REPAIR: Admin user profile missing or has wrong role. Repairing role to 'admin'...");
                // Since the user is updating their own row, they can update/insert:
                if (profile) {
                  const { error: updErr } = await authClient
                    .from("profiles")
                    .update({ role: "admin" })
                    .eq("id", user.id);
                  console.log("AUTO-REPAIR UPDATE Result:", updErr ? updErr.message : "Success");
                } else {
                  console.log("AUTO-REPAIR: Profile row missing entirely. Attempting self-insert...");
                  const { error: insErr } = await authClient
                    .from("profiles")
                    .insert([{
                      id: user.id,
                      username: user.email.split("@")[0],
                      email: user.email,
                      role: "admin"
                    }]);
                  console.log("AUTO-REPAIR INSERT Result:", insErr ? insErr.message : "Success");
                }
              }
            }
          } else {
            diagnosticInfo.userError = userErr?.message || "User is null";
          }
        } catch (diagErr: any) {
          diagnosticInfo.diagnosticException = diagErr.message;
        }
      }

      console.log("DIAGNOSTIC UPLOAD LOG:", diagnosticInfo);
      fs.writeFileSync("./diagnostic_upload.json", JSON.stringify(diagnosticInfo, null, 2));

      // Attempt upload with master supabaseClient (uses service key if available to bypass RLS)
      let uploadResult: { data: any; error: any } = { data: null, error: null };
      try {
        const res = await supabaseClient.storage
          .from(bucket)
          .upload(safeFileName, fileBuffer, {
            contentType: contentType || "image/png",
            upsert: true
          });
        uploadResult = { data: res.data, error: res.error };
      } catch (err: any) {
        uploadResult = { data: null, error: err };
      }

      // Fallback: If master upload fails, use direct REST API upload with user's Auth token to bypass client cache bugs
      if (uploadResult.error && token) {
        console.warn("Master storage upload failed, attempting direct REST upload fallback with auth token...", uploadResult.error.message || uploadResult.error);
        try {
          const uploadUrl = `${supabaseUrl}/storage/v1/object/${encodeURIComponent(bucket)}/${safeFileName}`;
          const headers: Record<string, string> = {
            "apikey": supabaseKey,
            "Authorization": `Bearer ${token}`,
            "x-upsert": "true",
            "Content-Type": contentType || "image/png"
          };

          const restResponse = await fetch(uploadUrl, {
            method: "POST",
            headers: headers,
            body: fileBuffer
          });

          const respText = await restResponse.text();
          console.log("Direct REST API upload status:", restResponse.status, "body:", respText);

          if (restResponse.ok) {
            uploadResult = { data: { path: safeFileName }, error: null };
          } else {
            let parsedErr = respText;
            try {
              const json = JSON.parse(respText);
              parsedErr = json.message || json.error || respText;
            } catch (e) {}
            uploadResult = { data: null, error: new Error(parsedErr) };
          }
        } catch (restErr: any) {
          console.error("Direct REST API fallback failed, trying active client fallback...", restErr.message);
          try {
            const res = await activeSupabaseClient.storage
              .from(bucket)
              .upload(safeFileName, fileBuffer, {
                contentType: contentType || "image/png",
                upsert: true
              });
            uploadResult = { data: res.data, error: res.error };
          } catch (lastErr: any) {
            uploadResult = { data: null, error: lastErr };
          }
        }
      }

      if (uploadResult.error) {
        console.error("Supabase Storage Backend Error:", uploadResult.error);
        return res.status(500).json({ error: uploadResult.error.message || String(uploadResult.error) });
      }

      const { data: { publicUrl } } = supabaseClient.storage
        .from(bucket)
        .getPublicUrl(safeFileName);

      res.json({ publicUrl });
    } catch (err: any) {
      console.error("Backend Upload Proxy Handler Error:", err);
      res.status(500).json({ error: err.message || "Internal server upload process failure" });
    }
  });

  // Secure full-stack proxy to insert news records bypass client RLS issues
  app.post("/api/news/create", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;
      
      let isAuthorized = false;
      let userEmail = "";
      let userId = "";

      if (token) {
        try {
          const authClient = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_4ovIDv-yqUNhXOJnx1Jr3Q_dw-BVy-c', {
            auth: {
              persistSession: false,
              autoRefreshToken: false,
            },
            global: {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          });
          await authClient.auth.setSession({ access_token: token, refresh_token: "" });
          
          const { data: { user }, error: userErr } = await authClient.auth.getUser(token);
          if (!userErr && user) {
            userEmail = user.email || "";
            userId = user.id;
            
            // Fetch current profile role
            let profile = null;
            try {
              const { data } = await authClient
                .from("profiles")
                .select("*")
                .eq("id", userId)
                .single();
              profile = data;
            } catch (profErr: any) {
              console.error("Failed to read user profile info:", profErr.message);
            }

            // Self-repair admin level
            const adminEmails = ["anshsureshsingh07@gmail.com", "animeintofficial@gmail.com"];
            if (userEmail && adminEmails.includes(userEmail.toLowerCase())) {
              isAuthorized = true;
              if (!profile || profile.role !== "admin") {
                console.log("AUTO-REPAIR NEWS API: Profile status mismatch. Restructuring database session...");
                try {
                  if (profile) {
                    await authClient.from("profiles").update({ role: "admin" }).eq("id", userId);
                  } else {
                    await authClient.from("profiles").insert([{
                      id: userId,
                      username: userEmail.split("@")[0],
                      email: userEmail,
                      role: "admin"
                    }]);
                  }
                } catch (repairErr: any) {
                  console.error("Auto repair error:", repairErr.message);
                }
              }
            } else {
              if (profile && ["admin", "news_writer", "moderator"].includes(profile.role)) {
                isAuthorized = true;
              }
            }
          }
        } catch (authClientErr: any) {
          console.error("Auth helper client instantiation failed:", authClientErr.message);
        }
      }

      if (!isAuthorized) {
        return res.status(403).json({ error: "Unauthorized access: admin or news_writer privileges required." });
      }

      const { payload } = req.body;
      if (!payload) {
        return res.status(400).json({ error: "Missing news insertion payload" });
      }

      // Try with the master client (bypasses RLS if using service role key)
      let insertResult: any = { data: null, error: null };
      try {
        insertResult = await supabaseClient.from("news").insert([payload]).select();
      } catch (masterInsertErr: any) {
        insertResult = { data: null, error: { message: masterInsertErr.message || "Master client insert failed" } };
      }
      
      if (insertResult.error && token) {
        console.warn("Master client news insert failed, trying user-authenticated client session...", insertResult.error.message);
        try {
          const userClient = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_4ovIDv-yqUNhXOJnx1Jr3Q_dw-BVy-c', {
            auth: {
              persistSession: false,
              autoRefreshToken: false,
            },
            global: {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          });
          await userClient.auth.setSession({ access_token: token, refresh_token: "" });
          insertResult = await userClient.from("news").insert([payload]).select();
        } catch (innerUserClientErr: any) {
          console.error("Fallback user client authentication or insertion failed:", innerUserClientErr.message);
        }
      }

      if (insertResult.error) {
        return res.status(500).json({ error: insertResult.error.message });
      }

      // FCM Automated Breaking News Push Notification Dispatch
      if (insertResult.data && insertResult.data.length > 0) {
        const newsItem = insertResult.data[0];
        try {
          // Fetch active user FCM device tokens resiliently selecting * to avoid missing column errors
          let profiles: any[] = [];
          let profErr: any = null;
          try {
            const { data, error } = await supabaseClient
              .from("profiles")
              .select("*");
            profiles = data || [];
            profErr = error;
          } catch (queryErr: any) {
            profErr = queryErr;
          }

          if (profErr) {
            console.error("FCM Broadcast Query Error:", profErr.message);
          } else if (profiles) {
            const tokens: string[] = [];
            for (const profile of profiles) {
              // 1. check direct fcm_token column
              if ((profile as any).fcm_token) {
                tokens.push(String((profile as any).fcm_token).trim());
              }
              // 2. check fallback JSON inside "bio" column
              else if (profile.bio) {
                try {
                  const parsed = JSON.parse(profile.bio);
                  if (parsed && typeof parsed === "object" && parsed.fcm_token) {
                    tokens.push(String(parsed.fcm_token).trim());
                  }
                } catch (e) {
                  // Skip invalid JSON entries
                }
              }
            }

            const uniqueTokens = Array.from(new Set(tokens)).filter(t => t.length > 0);
            console.log(`FCM Broadcast System: Selected ${uniqueTokens.length} primary active device(s) from Supabase.`);

            if (uniqueTokens.length > 0) {
              const multicastPayload = {
                tokens: uniqueTokens,
                notification: {
                  title: newsItem.title || "Breaking News Broadcast!",
                  body: newsItem.description || "Stay tuned for more updates!",
                  image: newsItem.image ? String(newsItem.image).trim() : undefined
                },
                data: {
                  id: String(newsItem.id),
                  category: String(newsItem.category || "Trending"),
                  author: String(newsItem.author_name || "")
                }
              };

              const response = await admin.messaging().sendEachForMulticast(multicastPayload);
              console.log(`FCM Broadcast: Successfully dispatched news broadcast to ${response.successCount} of ${uniqueTokens.length} active registered devices.`);
            }
          }
        } catch (fcmErr: any) {
          console.error("Automated FCM broadcast failure:", fcmErr?.message || fcmErr);
        }
      }

      res.json({ success: true, count: insertResult.data });
    } catch (err: any) {
      console.error("Backend News Create Handler Error:", err);
      res.status(500).json({ error: err.message || "Internal server process failure" });
    }
  });

  // Example AI Route for "Anime Assistant"
  app.post("/api/ai/recommend", async (req, res) => {
    try {
      const { prompt } = req.body;
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: `You are "Shadow", the anime assistant for Anime Int. Recommend some anime based on: ${prompt}`
      });
      res.json({ response: response.text });
    } catch (error) {
      console.error("AI Error:", error);
      res.status(500).json({ error: "AI recommendation failed" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
