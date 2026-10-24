import "dotenv/config";
import express from "express";

const app = express();
const PORT = Number(process.env.PORT || 8788);

app.disable("x-powered-by");
app.use(express.json({ limit: "100kb" }));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    app: "CaprichoBaby",
    mode: "local",
    instagramConfigured: Boolean(
      process.env.INSTAGRAM_APP_ID &&
      process.env.INSTAGRAM_APP_SECRET &&
      process.env.INSTAGRAM_REDIRECT_URI
    ),
    message: "Backend local funcionando."
  });
});

app.get("/api/instagram/status", (_req, res) => {
  const configured = Boolean(
    process.env.INSTAGRAM_APP_ID &&
    process.env.INSTAGRAM_APP_SECRET &&
    process.env.INSTAGRAM_REDIRECT_URI
  );

  res.json({
    configured,
    connected: false,
    message: configured
      ? "Credenciais encontradas. O fluxo OAuth ainda precisa ser habilitado."
      : "Integração aguardando configuração do aplicativo Meta."
  });
});


// CAPRICHO_INSTAGRAM_IMPORT_TEST
app.post("/api/instagram/image", async (req, res) => {
  try {
    const raw = String(req.body?.url || "");
    let postUrl;

    try {
      postUrl = new URL(raw);
    } catch {
      return res.status(400).json({ error: "URL inválida." });
    }

    const host = postUrl.hostname.toLowerCase();
    if (
      postUrl.protocol !== "https:" ||
      !(host === "instagram.com" || host.endsWith(".instagram.com") ||
        host === "instagr.am" || host.endsWith(".instagr.am")) ||
      !/^\/(p|reel|tv)\/[A-Za-z0-9_-]+\/?/.test(postUrl.pathname)
    ) {
      return res.status(400).json({
        error: "Cole o link de uma publicação, Reel ou vídeo público do Instagram."
      });
    }

    postUrl.search = "";
    postUrl.hash = "";

    const pageResponse = await fetch(postUrl.href, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/131.0.0.0 Mobile Safari/537.36",
        "Accept": "text/html,application/xhtml+xml"
      },
      signal: AbortSignal.timeout(12000),
      redirect: "follow"
    });

    if (!pageResponse.ok) {
      return res.status(502).json({
        error: "O Instagram bloqueou ou recusou a consulta. Tente pela galeria."
      });
    }

    const finalHost = new URL(pageResponse.url).hostname.toLowerCase();
    if (!(finalHost === "instagram.com" || finalHost.endsWith(".instagram.com"))) {
      return res.status(502).json({ error: "Redirecionamento inesperado do Instagram." });
    }

    const html = await pageResponse.text();
    const meta = html.match(/<meta[^>]+(?:property|name)=["']og:image["'][^>]+content=["']([^"']+)["'][^>]*>/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']og:image["'][^>]*>/i);

    if (!meta?.[1]) {
      return res.status(422).json({
        error: "Não encontrei a imagem. A publicação pode ser privada ou o Instagram pode ter bloqueado o acesso."
      });
    }

    const imageUrl = meta[1]
      .replace(/&amp;/g, "&")
      .replace(/&#x26;/gi, "&");

    const parsedImage = new URL(imageUrl);
    if (parsedImage.protocol !== "https:" ||
        !/(^|\.)cdninstagram\.com$|(^|\.)fbcdn\.net$|(^|\.)instagram\.com$/i.test(parsedImage.hostname)) {
      return res.status(422).json({ error: "A origem da imagem não foi reconhecida como Instagram." });
    }

    const imageResponse = await fetch(parsedImage.href, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Referer": "https://www.instagram.com/"
      },
      signal: AbortSignal.timeout(12000),
      redirect: "follow"
    });

    if (!imageResponse.ok) {
      return res.status(502).json({ error: "Não foi possível baixar a imagem da publicação." });
    }

    const contentType = (imageResponse.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
    if (!["image/jpeg", "image/png", "image/webp"].includes(contentType)) {
      return res.status(415).json({ error: "A publicação não retornou uma imagem compatível." });
    }

    const declaredSize = Number(imageResponse.headers.get("content-length") || 0);
    if (declaredSize > 8 * 1024 * 1024) {
      return res.status(413).json({ error: "A imagem é grande demais para importar." });
    }

    const bytes = Buffer.from(await imageResponse.arrayBuffer());
    if (!bytes.length || bytes.length > 8 * 1024 * 1024) {
      return res.status(413).json({ error: "A imagem está vazia ou excede 8 MB." });
    }

    res.set("Cache-Control", "no-store");
    return res.json({
      imageDataUrl: `data:${contentType};base64,${bytes.toString("base64")}`
    });
  } catch {
    return res.status(502).json({
      error: "Falha ao consultar o Instagram. Ele pode bloquear a extração automática."
    });
  }
});

app.listen(PORT, "127.0.0.1", () => {
  console.log(`CaprichoBaby API local: http://127.0.0.1:${PORT}`);
  console.log("Servidor limitado ao próprio aparelho.");
});
