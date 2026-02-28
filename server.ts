import express from "express";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.post("/api/send-request-email", async (req, res) => {
    console.log("Received email request:", req.body);
    const { to, subject, body } = req.body;
    const apiKey = (process.env.RESEND_API_KEY || "re_83hGkH69_CPMJEgn2zsD7rPQnX97Ct2ej").trim();

    if (!process.env.RESEND_API_KEY) {
        console.warn("RESEND_API_KEY not found in environment, using hardcoded fallback.");
    }
    console.log("Using API Key starting with:", apiKey.substring(0, 5) + "...");

    if (!to || !Array.isArray(to) || to.length === 0) {
        console.error("Invalid recipients:", to);
        return res.status(400).json({ error: "No recipients provided or invalid format" });
    }

    try {
        console.log("Sending email via Resend to:", to);
        const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                from: "onboarding@resend.dev",
                to: to,
                subject: subject,
                html: body.replace(/\n/g, '<br>')
            })
        });

        const contentType = response.headers.get("content-type");
        let data;
        if (contentType && contentType.includes("application/json")) {
            data = await response.json();
        } else {
            data = { message: await response.text() };
        }
        
        console.log("Resend API response:", data);
        
        if (response.ok) {
            res.json({ success: true, data });
        } else {
            console.error("Resend API error details:", data);
            res.status(response.status || 500).json({ error: data });
        }
    } catch (error) {
        console.error("Error in /api/send-request-email:", error);
        res.status(500).json({ error: "Internal server error while sending email", details: error instanceof Error ? error.message : String(error) });
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
    // In production, serve static files from dist
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
        res.sendFile("dist/index.html", { root: "." });
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
