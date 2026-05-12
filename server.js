const express = require("express");
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());

const AUTH_FILE = path.join(__dirname, "auth.json");

// ============================================
// ROTA PRINCIPAL - INFO DA API
// ============================================
app.get("/", (req, res) => {
  res.json({
    status: "online",
    mensagem: "Playwright API - Sistema de Afiliados ML",
    versao: "2.0",
    endpoints: {
      ofertas: "GET /ofertas - Busca todas as ofertas do dia",
      ofertas_categoria: "GET /ofertas/:categoria - Busca ofertas de uma categoria",
      mercado_simples: "POST /mercado-simples - Gera link de afiliado rápido",
      mercado: "POST /mercado - Gera link de afiliado (tenta encurtar)"
    },
    exemplos: {
      ofertas_geral: "GET /ofertas",
      ofertas_eletronicos: "GET /ofertas/MLB779535-1",
      gerar_link: "POST /mercado-simples com body: {\"url\":\"https://produto...\"}"
    }
  });
});

// ============================================
// ENDPOINT: BUSCAR OFERTAS DO DIA (GERAL)
// ============================================
app.get("/ofertas", async (req, res) => {
  try {
    console.log("🔄 Buscando ofertas do dia...");
    
    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Vai para a página de ofertas
    await page.goto("https://www.mercadolivre.com.br/ofertas", {
      waitUntil: "networkidle",
      timeout: 30000
    });
    
    console.log("📄 Página carregada, extraindo produtos...");
    
    // Extrai os produtos da página
    const produtos = await page.evaluate(() => {
      const items = [];
      
      // Seleciona todos os cards de produtos
      const selectors = [
        'div.poly-card',
        'li.poly-component__item',
        'div[class*="promotion-item"]',
        'a.poly-component__link'
      ];
      
      let cards = [];
      for (const selector of selectors) {
        cards = document.querySelectorAll(selector);
        if (cards.length > 0) {
          console.log(`Encontrou ${cards.length} produtos com seletor: ${selector}`);
          break;
        }
      }
      
      cards.forEach((card, index) => {
        try {
          // Tenta extrair o título
          const tituloElement = card.querySelector('h2, h3, [class*="title"], .poly-component__title');
          const titulo = tituloElement?.textContent?.trim();
          
          // Tenta extrair o preço
          const precoElement = card.querySelector('[class*="price"], .andes-money-amount__fraction');
          const precoTexto = precoElement?.textContent?.trim();
          const preco = precoTexto ? parseFloat(precoTexto.replace(/[^\d,]/g, '').replace(',', '.')) : 0;
          
          // Tenta extrair o link
          const linkElement = card.querySelector('a') || card;
          const link = linkElement?.href || linkElement?.getAttribute('href');
          
          // Tenta extrair a imagem
          const imagemElement = card.querySelector('img');
          const imagem = imagemElement?.src || imagemElement?.getAttribute('data-src');
          
          // Tenta extrair desconto
          const descontoElement = card.querySelector('[class*="discount"], [class*="off"]');
          const desconto = descontoElement?.textContent?.trim();
          
          // Se tem título e link, adiciona
          if (titulo && link && link.includes('mercadolivre.com')) {
            items.push({
              titulo: titulo,
              preco: preco,
              link: link,
              imagem: imagem || '',
              desconto: desconto || '',
              posicao: index + 1
            });
          }
        } catch (error) {
          console.error(`Erro ao extrair produto ${index}:`, error.message);
        }
      });
      
      return items;
    });
    
    await browser.close();
    
    console.log(`✅ Extraídos ${produtos.length} produtos`);
    
    res.json({
      status: "ok",
      total: produtos.length,
      data_extracao: new Date().toISOString(),
      produtos: produtos
    });
    
  } catch (error) {
    console.error("❌ Erro ao buscar ofertas:", error.message);
    res.status(500).json({
      status: "erro",
      mensagem: error.message
    });
  }
});

// ============================================
// ENDPOINT: BUSCAR OFERTAS POR CATEGORIA
// ============================================
app.get("/ofertas/:categoria", async (req, res) => {
  try {
    const { categoria } = req.params;
    console.log(`🔄 Buscando ofertas da categoria: ${categoria}`);
    
    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // URL com categoria específica
    const url = `https://www.mercadolivre.com.br/ofertas?container_id=${categoria}`;
    
    await page.goto(url, {
      waitUntil: "networkidle",
      timeout: 30000
    });
    
    console.log("📄 Página carregada, extraindo produtos...");
    
    const produtos = await page.evaluate(() => {
      const items = [];
      const selectors = [
        'div.poly-card',
        'li.poly-component__item',
        'div[class*="promotion-item"]',
        'a.poly-component__link'
      ];
      
      let cards = [];
      for (const selector of selectors) {
        cards = document.querySelectorAll(selector);
        if (cards.length > 0) break;
      }
      
      cards.forEach((card, index) => {
        try {
          const tituloElement = card.querySelector('h2, h3, [class*="title"]');
          const titulo = tituloElement?.textContent?.trim();
          
          const precoElement = card.querySelector('[class*="price"], .andes-money-amount__fraction');
          const precoTexto = precoElement?.textContent?.trim();
          const preco = precoTexto ? parseFloat(precoTexto.replace(/[^\d,]/g, '').replace(',', '.')) : 0;
          
          const linkElement = card.querySelector('a') || card;
          const link = linkElement?.href || linkElement?.getAttribute('href');
          
          const imagemElement = card.querySelector('img');
          const imagem = imagemElement?.src || imagemElement?.getAttribute('data-src');
          
          const descontoElement = card.querySelector('[class*="discount"], [class*="off"]');
          const desconto = descontoElement?.textContent?.trim();
          
          if (titulo && link && link.includes('mercadolivre.com')) {
            items.push({
              titulo: titulo,
              preco: preco,
              link: link,
              imagem: imagem || '',
              desconto: desconto || '',
              categoria: categoria,
              posicao: index + 1
            });
          }
        } catch (error) {
          console.error(`Erro ao extrair produto ${index}:`, error.message);
        }
      });
      
      return items;
    });
    
    await browser.close();
    
    console.log(`✅ Extraídos ${produtos.length} produtos da categoria ${categoria}`);
    
    res.json({
      status: "ok",
      categoria: categoria,
      total: produtos.length,
      data_extracao: new Date().toISOString(),
      produtos: produtos
    });
    
  } catch (error) {
    console.error("❌ Erro ao buscar ofertas:", error.message);
    res.status(500).json({
      status: "erro",
      mensagem: error.message
    });
  }
});

// ============================================
// ENDPOINT: GERAR LINK DE AFILIADO (SIMPLES)
// ============================================
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

// ============================================
// ENDPOINT: GERAR LINK DE AFILIADO (COM PLAYWRIGHT)
// ============================================
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
        con
