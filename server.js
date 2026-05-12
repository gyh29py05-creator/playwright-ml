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
    mensagem: "Playwright API Running",
    endpoints: {
      login: "GET /login - Cria autenticação no ML",
      mercado: "POST /mercado - Gera link de afiliado",
      status: "GET /status - Verifica se está autenticado"
    }
  });
});

// Verifica se está autenticado
app.get("/status", (req, res) => {
  const isAuthenticated = fs.existsSync(AUTH_FILE);
  res.json({
    status: "ok",
    autenticado: isAuthenticated,
    mensagem: isAuthenticated 
      ? "Autenticação OK - Pode usar /mercado" 
      : "Precisa fazer login primeiro - Acesse /login"
  });
});

// Faz login no ML e salva cookies
app.get("/login", async (req, res) => {
  try {
    console.log("🔄 Iniciando login no Mercado Livre...");
    
    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });
    
    const page = await context.newPage();
    
    // Vai direto para a página de afiliados
    await page.goto("https://www.mercadolivre.com.br/afiliados/linkbuilder#hub", {
      waitUntil: "networkidle",
      timeout: 30000
    });
    
    // Espera um pouco para garantir que carregou
    await page.waitForTimeout(3000);
    
    // Salva o estado de autenticação
    await context.storageState({ path: AUTH_FILE });
    
    await browser.close();
    
    console.log("✅ Login realizado com sucesso!");
    
    res.json({
      status: "ok",
      mensagem: "Autenticação criada com sucesso! Agora você pode usar o endpoint /mercado"
    });
    
  } catch (error) {
    console.error("❌ Erro no login:", error.message);
    res.status(500).json({
      status: "erro",
      mensagem: error.message,
      dica: "Verifique se o Mercado Livre está acessível"
    });
  }
});

// Gera link de afiliado
app.post("/mercado", async (req, res) => {
  try {
    const { url } = req.body;
    
    // Validações
    if (!url) {
      return res.status(400).json({
        status: "erro",
        mensagem: "URL do produto não fornecida",
        exemplo: { url: "https://produto.mercadolivre.com.br/MLB-123456-produto" }
      });
    }
    
    // Verifica se está autenticado
    if (!fs.existsSync(AUTH_FILE)) {
      return res.status(401).json({
        status: "erro",
        mensagem: "Não autenticado! Acesse /login primeiro"
      });
    }
    
    console.log("🔄 Gerando link de afiliado para:", url);
    
    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const context = await browser.newContext({
      storageState: AUTH_FILE,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });
    
    const page = await context.newPage();
    
    // Vai para a página de afiliados
    await page.goto("https://www.mercadolivre.com.br/afiliados/linkbuilder#hub", {
      waitUntil: "networkidle",
      timeout: 30000
    });
    
    // Faz a requisição para criar o link de afiliado
    const response = await page.evaluate(async (productUrl) => {
      try {
        const result = await fetch(
          "https://www.mercadolivre.com.br/affiliate-program/api/v2/affiliates/createLink",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              urls: [productUrl],
              tag: "ragi6098412" // Seu tag de afiliado
            })
          }
        );
        
        if (!result.ok) {
          throw new Error(`HTTP ${result.status}: ${result.statusText}`);
        }
        
        return await result.json();
        
      } catch (error) {
        return { error: error.message };
      }
    }, url);
    
    await browser.close();
    
    // Verifica se deu erro
    if (response.error) {
      console.error("❌ Erro ao gerar link:", response.error);
      return res.status(500).json({
        status: "erro",
        mensagem: response.error
      });
    }
    
    console.log("✅ Link gerado com sucesso!");
    
    res.json({
      status: "ok",
      url_original: url,
      resultado: response
    });
    
  } catch (error) {
    console.error("❌ Erro ao gerar link:", error.message);
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
