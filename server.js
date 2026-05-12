const express = require("express");
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());

const AUTH_FILE = path.join(__dirname, "auth.json");

// Rota principal
app.get("/", (req, res) => {
  res.json({
    status: "online",
    mensagem: "Playwright API Running - Gerador de Links de Afiliado ML",
    endpoints: {
      mercado: "POST /mercado - Gera link de afiliado",
      mercado_simples: "POST /mercado-simples - Gera link sem playwright (mais rápido)"
    }
  });
});

// Versão SIMPLES - Apenas adiciona tracking_id (RECOMENDADO)
app.post("/mercado-simples", async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({
        status: "erro",
        mensagem: "URL do produto não fornecida",
        exemplo: { 
          url: "https://produto.mercadolivre.com.br/MLB-123456-produto" 
        }
      });
    }
    
    // Validar se é URL do Mercado Livre
    if (!url.includes("mercadolivre.com") && !url.includes("mercadolibre.com")) {
      return res.status(400).json({
        status: "erro",
        mensagem: "URL inválida - deve ser do Mercado Livre"
      });
    }
    
    // Seu tracking_id de afiliado
    const trackingId = "ragi6098412";
    
    // Adiciona o tracking_id na URL
    const affiliateUrl = url.includes('?') 
      ? `${url}&tracking_id=${trackingId}`
      : `${url}?tracking_id=${trackingId}`;
    
    console.log("✅ Link de afiliado gerado:", affiliateUrl);
    
    res.json({
      status: "ok",
      url_original: url,
      url_afiliado: affiliateUrl,
      tracking_id: trackingId,
      mensagem: "Link de afiliado gerado com sucesso!"
    });
    
  } catch (error) {
    console.error("❌ Erro:", error.message);
    res.status(500).json({
      status: "erro",
      mensagem: error.message
    });
  }
});

// Versão com Playwright (se precisar encurtar depois)
app.post("/mercado", async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({
        status: "erro",
        mensagem: "URL do produto não fornecida"
      });
    }
    
    // Primeiro gera o link com tracking_id
    const trackingId = "ragi6098412";
    const affiliateUrl = url.includes('?') 
      ? `${url}&tracking_id=${trackingId}`
      : `${url}?tracking_id=${trackingId}`;
    
    console.log("🔄 Tentando encurtar:", affiliateUrl);
    
    // Tenta encurtar (opcional)
    try {
      const browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const context = await browser.newContext();
      const page = await context.newPage();
      
      // Vai para encurtador do ML
      await page.goto("https://www.mercadolivre.com.br/afiliados/linkbuilder#hub", {
        timeout: 15000
      });
      
      // Tenta encurtar pela API
      const shortened = await page.evaluate(async (longUrl, tag) => {
        try {
          const result = await fetch(
            "https://www.mercadolivre.com.br/affiliate-program/api/v2/affiliates/createLink",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ urls: [longUrl], tag })
            }
          );
          
          if (result.ok) {
            const data = await result.json();
            return data;
          }
          return null;
        } catch (e) {
          return null;
        }
      }, url, trackingId);
      
      await browser.close();
      
      if (shortened && shortened.links && shortened.links[0]) {
        console.log("✅ Link encurtado com sucesso!");
        return res.json({
          status: "ok",
          url_original: url,
          url_afiliado: affiliateUrl,
          url_encurtada: shortened.links[0],
          tracking_id: trackingId
        });
      }
    } catch (e) {
      console.log("⚠️ Não conseguiu encurtar, retornando link normal");
    }
    
    // Se não conseguiu encurtar, retorna o link com tracking_id
    res.json({
      status: "ok",
      url_original: url,
      url_afiliado: affiliateUrl,
      tracking_id: trackingId,
      mensagem: "Link gerado (não encurtado)"
    });
    
  } catch (error) {
    console.error("❌ Erro:", error.message);
    res.status(500).json({
      status: "erro",
      mensagem: error.message
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);
});
