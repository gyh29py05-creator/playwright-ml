const express = require("express");
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());

const AUTH_FILE = path.join(__dirname, "auth.json");

// =====================================================
// CREDENCIAIS CREATORS API AMAZON
// =====================================================
require('dotenv').config();

const CREATORS_CLIENT_ID = process.env.AMAZON_CLIENT_ID;
const CREATORS_CLIENT_SECRET = process.env.AMAZON_CLIENT_SECRET;
const AMAZON_TAG = process.env.AMAZON_TAG || "giseleramosd-20";

if (!CREATORS_CLIENT_ID || !CREATORS_CLIENT_SECRET) {
  throw new Error('⚠️ ERRO: Credenciais da Amazon não encontradas! Configure o arquivo .env');
}

let creatorsToken = null;
let creatorsTokenExpiry = null;

// ============================================
// FUNÇÃO: PEGAR TOKEN CREATORS API (v3.1 LwA)
// ============================================
async function getCreatorsToken() {
  const agora = Date.now();
  if (creatorsToken && creatorsTokenExpiry && agora < creatorsTokenExpiry - 60000) {
    console.log("🔑 Reutilizando token Creators API");
    return creatorsToken;
  }
  console.log("🔄 Buscando novo token Creators API...");
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: CREATORS_CLIENT_ID,
    client_secret: CREATORS_CLIENT_SECRET,
    scope: "creatorsapi::default"
  });
  const response = await fetch("https://api.amazon.com/auth/o2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString()
  });
  if (!response.ok) {
    const erro = await response.text();
    throw new Error(`Erro ao obter token: ${response.status} - ${erro}`);
  }
  const data = await response.json();
  creatorsToken = data.access_token;
  creatorsTokenExpiry = agora + (data.expires_in * 1000);
  console.log("✅ Token Creators API obtido com sucesso");
  return creatorsToken;
}

// ============================================
// ROTA PRINCIPAL - INFO DA API
// ============================================
app.get("/", (req, res) => {
  res.json({
    status: "online",
    mensagem: "Playwright API - Sistema de Afiliados ML + Amazon + Shein",
    versao: "6.0",
    endpoints: {
      ofertas: "GET /ofertas - Busca todas as ofertas do dia (ML)",
      ofertas_categoria: "GET /ofertas/:categoria - Busca ofertas de uma categoria (ML)",
      mercado_simples: "POST /mercado-simples - Gera link de afiliado rápido (ML)",
      mercado: "POST /mercado - Gera link de afiliado (tenta encurtar) (ML)",
      mercado_oficial: "POST /mercado-oficial - Gera link meli.la oficial (ML)",
      amazon: "GET /amazon - Busca ofertas Amazon (nacionais + internacionais)",
      amazon_link: "POST /amazon-link - Gera link de afiliado Amazon",
      amazon_buscar: "POST /amazon-buscar - Busca produtos via Creators API",
      amazon_produto: "POST /amazon-produto - Pega detalhes de produto por ASIN via Creators API",
      shein: "GET /shein?categoria=moda - Busca produtos Shein",
      shein_categorias: "Categorias: moda, moda-feminina, moda-masculina, maquiagem, aesthetics, camisetas, linho, promocao",
      debug_screenshot: "GET /debug-screenshot - Ver último screenshot do Playwright"
    }
  });
});

// ============================================
// ENDPOINT: BUSCAR OFERTAS DO DIA (GERAL) - ML
// ============================================
app.get("/ofertas", async (req, res) => {
  try {
    console.log("🔄 Buscando ofertas do dia...");
    const browser = await chromium.launch({
      headless: true,
      args: [
  "--no-sandbox",
  "--disable-setuid-sandbox", 
  "--disable-blink-features=AutomationControlled",
  "--disable-dev-shm-usage",
  "--disable-gpu",
  "--single-process"
],
    });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      locale: 'pt-BR'
    });
    const page = await context.newPage();
    await page.goto("https://www.mercadolivre.com.br/ofertas", { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(3000);
    // Scroll progressivo para carregar mais produtos
for (let i = 1; i <= 5; i++) {
  await page.evaluate((step) => {
    window.scrollTo(0, (document.body.scrollHeight / 5) * step);
  }, i);
  await page.waitForTimeout(2000);
}
await page.waitForTimeout(3000);

    const produtos = await page.evaluate(() => {
      const items = [];
      const possiveisSeletores = [
        'article', 'div[class*="ui-search-result"]', 'li[class*="ui-search-layout__item"]',
        'div.poly-card', 'div[class*="poly-component"]', 'li.poly-component__item', 'div[class*="promotion-item"]'
      ];
      let todosCards = [];
      for (const seletor of possiveisSeletores) {
        const cards = Array.from(document.querySelectorAll(seletor));
        if (cards.length > 0) { todosCards = cards; break; }
      }
      todosCards.forEach((card, index) => {
        try {
          const possiveisTitulos = ['h2', 'h3', 'a[class*="title"]', '.poly-component__title', '[class*="ui-search-item__title"]', 'p[class*="promotion-item__title"]'];
          let titulo = '';
          for (const sel of possiveisTitulos) {
            const el = card.querySelector(sel);
            if (el && el.textContent.trim()) { titulo = el.textContent.trim(); break; }
          }
          const possiveisPrecos = ['.andes-money-amount__fraction', '[class*="price-tag-fraction"]', 'span[class*="price"]', '.price-tag-amount'];
          let precoTexto = '';
          for (const sel of possiveisPrecos) {
            const els = card.querySelectorAll(sel);
            if (els.length > 0) { precoTexto = els[0].textContent.trim(); break; }
          }
          const preco = precoTexto ? parseFloat(precoTexto.replace(/[^\d,]/g, '').replace(',', '.')) : 0;
          let precoOriginal = 0;
          const precoOriginalEl = card.querySelector('s .andes-money-amount__fraction, .andes-money-amount--previous .andes-money-amount__fraction');
          if (precoOriginalEl) precoOriginal = parseFloat(precoOriginalEl.textContent.trim().replace(/[^\d,]/g, '').replace(',', '.'));
          let desconto = '';
          const descontoEl = card.querySelector('[class*="discount"], [class*="off"], .poly-price__discount');
          if (descontoEl) desconto = descontoEl.textContent.trim();
          let parcelas = '';
          const parcelasEl = card.querySelector('[class*="installment"], [class*="parcela"], .poly-price__installments');
          if (parcelasEl) parcelas = parcelasEl.textContent.trim();
          let avaliacao = 0;
          const avaliacaoEl = card.querySelector('[class*="rating"], .poly-reviews__rating');
          if (avaliacaoEl) avaliacao = parseFloat(avaliacaoEl.textContent.trim()) || 0;
          let numReviews = 0;
          const reviewsEl = card.querySelector('[class*="reviews__total"], [class*="rating__count"]');
          if (reviewsEl) numReviews = parseInt(reviewsEl.textContent.replace(/[^\d]/g, '')) || 0;
          let cupom = '';
          const cupomEl = card.querySelector('[class*="coupon"], [class*="cupom"]');
          if (cupomEl) cupom = cupomEl.textContent.trim();
          let freteGratis = false;
          const freteEl = card.querySelector('[class*="shipping"], [class*="frete"]');
          if (freteEl) freteGratis = freteEl.textContent.toLowerCase().includes('grátis');
          const linkElement = card.querySelector('a');
          const link = linkElement ? linkElement.href : '';
          const imgElement = card.querySelector('img');
          const imagem = imgElement ? (imgElement.src || imgElement.getAttribute('data-src') || '') : '';
          if ((titulo && titulo.length > 3) || (link && link.includes('MLB'))) {
            items.push({ titulo: titulo || 'Sem título', preco, preco_original: precoOriginal, desconto, parcelas, avaliacao, num_reviews: numReviews, cupom, frete_gratis: freteGratis, link, imagem, posicao: index + 1 });
          }
        } catch (error) { console.error(`Erro no card ${index}:`, error.message); }
      });
      return items;
    });

    await browser.close();
    console.log(`✅ Extraídos ${produtos.length} produtos`);
    if (produtos.length === 0) {
      return res.json({ status: "aviso", total: 0, mensagem: "Nenhum produto encontrado.", data_extracao: new Date().toISOString(), produtos: [] });
    }
    res.json({ status: "ok", total: produtos.length, data_extracao: new Date().toISOString(), produtos });
  } catch (error) {
    console.error("❌ Erro ao buscar ofertas:", error.message);
    res.status(500).json({ status: "erro", mensagem: error.message });
  }
});

// ============================================
// ENDPOINT: BUSCAR OFERTAS POR CATEGORIA - ML
// ============================================
app.get("/ofertas/:categoria", async (req, res) => {
  try {
    const { categoria } = req.params;
    console.log(`🔄 Buscando ofertas da categoria: ${categoria}`);
    const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.goto(`https://www.mercadolivre.com.br/ofertas?container_id=${categoria}`, { waitUntil: "networkidle", timeout: 30000 });

    const produtos = await page.evaluate(() => {
      const items = [];
      const selectors = ['div.poly-card', 'li.poly-component__item', 'div[class*="promotion-item"]', 'a.poly-component__link'];
      let cards = [];
      for (const selector of selectors) { cards = document.querySelectorAll(selector); if (cards.length > 0) break; }
      cards.forEach((card, index) => {
        try {
          const titulo = card.querySelector('h2, h3, [class*="title"]')?.textContent?.trim();
          const precoTexto = card.querySelector('[class*="price"], .andes-money-amount__fraction')?.textContent?.trim();
          const preco = precoTexto ? parseFloat(precoTexto.replace(/[^\d,]/g, '').replace(',', '.')) : 0;
          const linkElement = card.querySelector('a') || card;
          const link = linkElement?.href || linkElement?.getAttribute('href');
          const imagem = card.querySelector('img')?.src || card.querySelector('img')?.getAttribute('data-src');
          const desconto = card.querySelector('[class*="discount"], [class*="off"]')?.textContent?.trim();
          const parcelas = card.querySelector('[class*="installment"], [class*="parcela"]')?.textContent?.trim() || '';
          const avaliacaoEl = card.querySelector('[class*="rating"]');
          const avaliacao = avaliacaoEl ? parseFloat(avaliacaoEl.textContent.trim()) || 0 : 0;
          const freteEl = card.querySelector('[class*="shipping"], [class*="frete"]');
          const freteGratis = freteEl ? freteEl.textContent.toLowerCase().includes('grátis') : false;
          if (titulo && link && link.includes('mercadolivre.com')) {
            items.push({ titulo, preco, desconto: desconto || '', parcelas, avaliacao, frete_gratis: freteGratis, link, imagem: imagem || '', posicao: index + 1 });
          }
        } catch (error) { console.error(`Erro ao extrair produto ${index}:`, error.message); }
      });
      return items;
    });

    await browser.close();
    res.json({ status: "ok", categoria, total: produtos.length, data_extracao: new Date().toISOString(), produtos });
  } catch (error) {
    res.status(500).json({ status: "erro", mensagem: error.message });
  }
});

// ============================================
// ENDPOINT: GERAR LINK DE AFILIADO SIMPLES - ML
// ============================================
app.post("/mercado-simples", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ status: "erro", mensagem: "URL do produto não fornecida" });
    if (!url.includes("mercadolivre.com") && !url.includes("mercadolibre.com")) return res.status(400).json({ status: "erro", mensagem: "URL inválida - deve ser do Mercado Livre" });
    const trackingId = "ragi6098412";
    const affiliateUrl = url.includes('?') ? `${url}&tracking_id=${trackingId}` : `${url}?tracking_id=${trackingId}`;
    res.json({ status: "ok", url_original: url, url_afiliado: affiliateUrl, tracking_id: trackingId, mensagem: "Link de afiliado gerado com sucesso!" });
  } catch (error) {
    res.status(500).json({ status: "erro", mensagem: error.message });
  }
});

// ============================================
// ENDPOINT: GERAR LINK DE AFILIADO PLAYWRIGHT - ML
// ============================================
app.post("/mercado", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ status: "erro", mensagem: "URL não fornecida" });
    const trackingId = "ragi6098412";
    const affiliateUrl = url.includes('?') ? `${url}&tracking_id=${trackingId}` : `${url}?tracking_id=${trackingId}`;
    try {
      const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto("https://www.mercadolivre.com.br/afiliados/linkbuilder#hub", { timeout: 15000 });
      const shortened = await page.evaluate(async (longUrl, tag) => {
        try {
          const result = await fetch("https://www.mercadolivre.com.br/affiliate-program/api/v2/affiliates/createLink", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ urls: [longUrl], tag }) });
          if (result.ok) return await result.json();
          return null;
        } catch (e) { return null; }
      }, url, trackingId);
      await browser.close();
      if (shortened && shortened.urls && shortened.urls[0]) {
        return res.json({ status: "ok", url_original: url, url_afiliado: shortened.urls[0].short_url || affiliateUrl, url_encurtada: shortened.urls[0].short_url, tracking_id: trackingId });
      }
    } catch (e) { console.log("⚠️ Não conseguiu encurtar"); }
    res.json({ status: "ok", url_original: url, url_afiliado: affiliateUrl, tracking_id: trackingId, mensagem: "Link gerado (não encurtado)" });
  } catch (error) {
    res.status(500).json({ status: "erro", mensagem: error.message });
  }
});

// ============================================
// ENDPOINT: GERAR LINK MELI.LA OFICIAL - ML
// ============================================
app.post('/mercado-oficial', async (req, res) => {
  try {
    const { url } = req.body;
    const cookie = process.env.ML_COOKIE || '';
    const response = await fetch('https://www.mercadolivre.com.br/affiliate-program/api/v2/affiliates/createLink', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': cookie, 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      body: JSON.stringify({ urls: [url], tag: 'ragi6098412' })
    });
    const data = await response.json();
    const shortUrl = data.urls?.[0]?.short_url;
    res.json({ status: 'ok', url_original: url, url_afiliado: shortUrl || url, meli_la: shortUrl });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

// ============================================
// ENDPOINT: BUSCAR OFERTAS AMAZON (nacionais + internacionais + bugs)
// ============================================
app.get("/amazon", async (req, res) => {
  try {
    const { tipo = "todos" } = req.query; // tipos: nacionais, internacionais, todos
    console.log(`🔄 Buscando ofertas Amazon - tipo: ${tipo}`);

    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled']
    });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      locale: 'pt-BR',
      extraHTTPHeaders: { 'Accept-Language': 'pt-BR,pt;q=0.9' }
    });
    const page = await context.newPage();

    // URL com filtro nacional (shipped from Brazil)
    const urlNacional = "https://www.amazon.com.br/s?k=casa+cozinha&i=home&rh=p_76%3A11&dc&ref=sr_nr_p_76_1";
    const urlGeral = "https://www.amazon.com.br/s?k=casa+e+decoracao&i=home&bbn=16209062011&rh=n%3A16209062011&dc&ref=sr_nr_n_1";

    // Busca nacionais
    let produtosNacionais = [];
    if (tipo === "nacionais" || tipo === "todos") {
      await page.goto(urlNacional, { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForTimeout(4000);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
      await page.waitForTimeout(2000);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(2000);
      produtosNacionais = await extrairProdutosAmazon(page, "nacional");
    }

    // Busca todos (inclui internacionais)
    let produtosTodos = [];
    if (tipo === "internacionais" || tipo === "todos") {
      await page.goto(urlGeral, { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForTimeout(4000);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
      await page.waitForTimeout(2000);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(2000);
      produtosTodos = await extrairProdutosAmazon(page, "internacional");
    }

    await browser.close();

    // Combina e remove duplicatas por ASIN
    const todosProdutos = [...produtosNacionais, ...produtosTodos];
    const unicos = todosProdutos.filter((p, i, arr) => arr.findIndex(x => x.asin === p.asin) === i);
    const bugs = unicos.filter(p => p.possivel_bug);

    console.log(`✅ Amazon: ${unicos.length} produtos (${produtosNacionais.length} nacionais, ${produtosTodos.length} internacionais) | ${bugs.length} bugs`);
    res.json({
      status: "ok",
      total: unicos.length,
      nacionais: produtosNacionais.length,
      internacionais: produtosTodos.length,
      bugs_detectados: bugs.length,
      data_extracao: new Date().toISOString(),
      produtos: unicos
    });
  } catch (error) {
    console.error("❌ Erro Amazon:", error.message);
    res.status(500).json({ status: "erro", mensagem: error.message });
  }
});

// Função auxiliar para extrair produtos da Amazon
async function extrairProdutosAmazon(page, origem) {
  return await page.evaluate((origem) => {
    const items = [];
    const cards = Array.from(document.querySelectorAll('div[data-component-type="s-search-result"]'));
    cards.forEach((card, index) => {
      try {
        const titulo = card.querySelector('h2 a span, h2 span')?.textContent?.trim() || '';
        const precoInteiro = card.querySelector('.a-price-whole')?.textContent?.replace(/[^\d]/g, '') || '0';
        const precoFracao = card.querySelector('.a-price-fraction')?.textContent?.replace(/[^\d]/g, '') || '00';
        const preco = parseFloat(`${precoInteiro}.${precoFracao}`) || 0;
        const precoOrigTexto = card.querySelector('.a-text-price .a-offscreen')?.textContent?.trim() || '';
        const preco_original = parseFloat(precoOrigTexto.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
        const desconto = card.querySelector('span.a-letter-space + span, [class*="savingsPercentage"]')?.textContent?.trim() || '';
        const avaliacaoTexto = card.querySelector('span.a-icon-alt')?.textContent?.trim() || '';
        const avaliacao = parseFloat(avaliacaoTexto.replace(',', '.')) || 0;
        const num_reviews = parseInt(card.querySelector('span[aria-label*="estrelas"] + span, a[href*="customerReviews"] span')?.textContent?.replace(/[^\d]/g, '')) || 0;
        const imagem = card.querySelector('img.s-image')?.src || '';
        const linkEl = card.querySelector('h2 a, a.a-link-normal');
        let link = linkEl?.href || '';
        if (link && !link.startsWith('http')) link = 'https://www.amazon.com.br' + link;
        const asin = card.getAttribute('data-asin') || '';
        const frete_gratis = !!card.querySelector('i[aria-label="Amazon Prime"], [data-testid*="prime"]');

        // Detectar bug de preço (desconto >= 70%)
        const pctDesconto = preco_original > 0 ? Math.round((preco_original - preco) / preco_original * 100) : 0;
        const possivel_bug = pctDesconto >= 70;

        if (titulo && titulo.length > 3 && preco > 0) {
          items.push({ titulo, preco, preco_original, desconto, pct_desconto: pctDesconto, possivel_bug, avaliacao, num_reviews, imagem, link, asin, frete_gratis, origem, posicao: index + 1 });
        }
      } catch (e) { console.error(`Erro no card ${index}:`, e.message); }
    });
    return items;
  }, origem);
}

// ============================================
// ENDPOINT: GERAR LINK DE AFILIADO AMAZON
// ============================================
app.post("/amazon-link", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ status: "erro", mensagem: "URL do produto não fornecida" });
    if (!url.includes("amazon.com.br") && !url.includes("amzn.to")) return res.status(400).json({ status: "erro", mensagem: "URL inválida - deve ser da Amazon Brasil" });
    let asin = '';
    const asinMatch = url.match(/\/dp\/([A-Z0-9]{10})|\/gp\/product\/([A-Z0-9]{10})/);
    if (asinMatch) asin = asinMatch[1] || asinMatch[2];
    const urlAfiliado = asin ? `https://www.amazon.com.br/dp/${asin}?tag=${AMAZON_TAG}` : (url.includes('?') ? `${url}&tag=${AMAZON_TAG}` : `${url}?tag=${AMAZON_TAG}`);
    res.json({ status: "ok", url_original: url, url_afiliado: urlAfiliado, asin: asin || "não encontrado", tag: AMAZON_TAG, mensagem: "Link de afiliado Amazon gerado com sucesso!" });
  } catch (error) {
    res.status(500).json({ status: "erro", mensagem: error.message });
  }
});

// ============================================
// ENDPOINT: BUSCAR PRODUTOS VIA CREATORS API
// ============================================
app.post("/amazon-buscar", async (req, res) => {
  try {
    const { keywords, categoria = "All", pagina = 1 } = req.body;
    if (!keywords) return res.status(400).json({ status: "erro", mensagem: "Campo 'keywords' obrigatório" });
    console.log(`🔍 Buscando na Creators API: "${keywords}"`);
    const token = await getCreatorsToken();
    const payload = {
      keywords, partnerTag: AMAZON_TAG, partnerType: "Associates", searchIndex: categoria,
      itemPage: pagina, itemCount: 10,
      resources: ["itemInfo.title", "itemInfo.byLineInfo", "offersV2.listings.price", "offersV2.listings.condition", "images.primary.medium", "customerReviews.count", "customerReviews.starRating", "itemInfo.features"],
      marketplace: "www.amazon.com.br", languagesOfPreference: ["pt_BR"]
    };
    const response = await fetch("https://affiliate-program.amazon.com/creatorapi/paapi5/searchitems", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}`, "x-marketplace": "www.amazon.com.br" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const erro = await response.text();
      return res.status(response.status).json({ status: "erro", mensagem: `Erro na Creators API: ${response.status}`, detalhe: erro });
    }
    const data = await response.json();
    const produtos = (data.SearchResult?.Items || []).map((item, index) => ({
      asin: item.ASIN || '',
      titulo: item.ItemInfo?.Title?.DisplayValue || '',
      preco: item.OffersV2?.Listings?.[0]?.Price?.Amount || 0,
      moeda: item.OffersV2?.Listings?.[0]?.Price?.Currency || 'BRL',
      preco_formatado: item.OffersV2?.Listings?.[0]?.Price?.DisplayAmount || '',
      imagem: item.Images?.Primary?.Medium?.URL || '',
      avaliacao: item.CustomerReviews?.StarRating?.Value || 0,
      num_reviews: item.CustomerReviews?.Count || 0,
      url_afiliado: `https://www.amazon.com.br/dp/${item.ASIN}?tag=${AMAZON_TAG}`,
      posicao: index + 1
    }));
    res.json({ status: "ok", keywords, total: produtos.length, pagina, data_extracao: new Date().toISOString(), produtos });
  } catch (error) {
    res.status(500).json({ status: "erro", mensagem: error.message });
  }
});

// ============================================
// ENDPOINT: DETALHES DE PRODUTO POR ASIN
// ============================================
app.post("/amazon-produto", async (req, res) => {
  try {
    const { asin } = req.body;
    if (!asin) return res.status(400).json({ status: "erro", mensagem: "Campo 'asin' obrigatório" });
    console.log(`🔍 Buscando produto ASIN: ${asin}`);
    const token = await getCreatorsToken();
    const payload = {
      itemIds: [asin], partnerTag: AMAZON_TAG, partnerType: "Associates",
      resources: ["itemInfo.title", "itemInfo.byLineInfo", "itemInfo.features", "offersV2.listings.price", "offersV2.listings.condition", "offersV2.listings.deliveryInfo.isPrimeEligible", "images.primary.large", "customerReviews.count", "customerReviews.starRating"],
      marketplace: "www.amazon.com.br", languagesOfPreference: ["pt_BR"]
    };
    const response = await fetch("https://affiliate-program.amazon.com/creatorapi/paapi5/getitems", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}`, "x-marketplace": "www.amazon.com.br" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const erro = await response.text();
      return res.status(response.status).json({ status: "erro", mensagem: `Erro na Creators API: ${response.status}`, detalhe: erro });
    }
    const data = await response.json();
    const item = data.ItemsResult?.Items?.[0];
    if (!item) return res.json({ status: "aviso", mensagem: "Produto não encontrado", asin });
    res.json({
      status: "ok", asin,
      titulo: item.ItemInfo?.Title?.DisplayValue || '',
      preco: item.OffersV2?.Listings?.[0]?.Price?.Amount || 0,
      preco_formatado: item.OffersV2?.Listings?.[0]?.Price?.DisplayAmount || '',
      prime: item.OffersV2?.Listings?.[0]?.DeliveryInfo?.IsPrimeEligible || false,
      imagem: item.Images?.Primary?.Large?.URL || '',
      avaliacao: item.CustomerReviews?.StarRating?.Value || 0,
      num_reviews: item.CustomerReviews?.Count || 0,
      features: item.ItemInfo?.Features?.DisplayValues || [],
      url_afiliado: `https://www.amazon.com.br/dp/${asin}?tag=${AMAZON_TAG}`,
      tag: AMAZON_TAG
    });
  } catch (error) {
    res.status(500).json({ status: "erro", mensagem: error.message });
  }
});

// ============================================
// ENDPOINT LEGADO: ENCURTAR LINK AMAZON
// ============================================
app.post('/encurtar-link', async (req, res) => {
  const { asin } = req.body;
  if (!asin) return res.status(400).json({ status: 'erro', mensagem: 'ASIN obrigatório' });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    extraHTTPHeaders: { 'Accept-Language': 'pt-BR,pt;q=0.9' }
  });
  await context.addCookies([
    { name: 'session-id', value: '132-2538792-9842543', domain: '.amazon.com.br', path: '/' },
    { name: 'ubid-acbbr', value: '134-1696896-9118130', domain: '.amazon.com.br', path: '/' },
    { name: 'lc-acbbr', value: 'pt_BR', domain: '.amazon.com.br', path: '/' },
    { name: 'i18n-prefs', value: 'BRL', domain: '.amazon.com.br', path: '/' }
  ]);
  const page = await context.newPage();
  try {
    const url = `https://www.amazon.com.br/associates/sitestripe/getShortUrl?asin=${asin}&tag=${AMAZON_TAG}&linkType=text`;
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const body = await page.textContent('body');
    const json = JSON.parse(body);
    await browser.close();
    if (json && json.shortUrl) return res.json({ status: 'ok', url_curta: json.shortUrl, asin });
    return res.json({ status: 'erro', mensagem: 'Link não gerado', resposta: json });
  } catch (err) {
    await browser.close();
    return res.status(500).json({ status: 'erro', mensagem: err.message });
  }
});

// ============================================
// ENDPOINT: BUSCAR PRODUTOS SHEIN (Playwright)
// ============================================
app.get("/shein", async (req, res) => {
  try {
    const { categoria = "moda" } = req.query;
    console.log(`🔄 Buscando produtos Shein - categoria: ${categoria}`);

    const urls = {
      "moda":          "https://br.shein.com/Women-Clothing-sc-017172961.html",
      "moda-feminina": "https://br.shein.com/Women-Clothing-sc-017172961.html",
      "moda-masculina":"https://br.shein.com/Men-Clothing-sc-00864889.html",
      "maquiagem":     "https://br.shein.com/Beauty-cat-1954.html?sort=7",
      "aesthetics":    "https://br.shein.com/Women-Y2K-cat-2467.html?sort=7",
      "camisetas":     "https://br.shein.com/Women-Tops-cat-1738.html?sort=7",
      "linho":         "https://br.shein.com/Women-Linen-cat-3007.html?sort=7",
      "casa":          "https://br.shein.com/Home-cat-1766.html?sort=7",
      "promocao":      "https://br.shein.com/promotion/flash-sale"
    };

    const url = urls[categoria] || urls["moda"];

    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled']
    });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      locale: 'pt-BR'
    });

  // Adicionar cookies da Shein (login)
await context.addCookies([
  {
    name: 'memberId',
    value: '1180825914',
    domain: '.shein.com',
    path: '/'
  },
  {
    name: 'AT',
    value: 'MDEwMDE.eyJiIjo3LCJnIjoxNzc4ODgyNzY1LCJyIjoiWmZnQ2pvIiwidCI6MiwibSI6MTE4MDgyNTkxNCwibCI6MTc3ODg4Mjc2NX0.c7e8197dce8ec6cd.3345b7409e3d797c64baf023ec7356f6a80d14db69ba2638e3f090f0a6d18dc3',
    domain: '.shein.com',
    path: '/'
  },
  {
    name: 'cf_clearance',
    value: '29_m.tjJTI28tvBqR15x.1tLdNCPj4uAwwVOD1O05bo-1778890425-1.2.1.1-KEi4p3v21FU5hkQ2wJ9FnEqKYZqGHtAdyzKcbqMB7imnmUdnu3Gj6cnEKI0SidchJcuwn7ssSO0sdOWqe5RqAydwxH4dde_CZvzvnnb0TeawKS0PtB5QWiwyH5FBjOjK3m4ROfw_2qCXwygX9cBI87ZT5YCdOO4mHiBjEAt8O.e_rS5lVKzwrnYxnuohn8ZBcfMrRp.gWSPxXdsh_z6rj67jvaoZAR4g9opZSjWV.zFDoCoY4.rDV1v_PaqNZM2MbJj8IF3nkoHe7AAhOCbsfhpyb4x9vHCjzP.itOjRdfCkjro56BIg61G7uWDDQ7KypIvXmXdhCYvVAoN4Hr6j1g',
    domain: '.shein.com',
    path: '/'
  },
  {
    name: 'sessionID_shein',
    value: 's%3A7S7sthaovE_Sy9eCpmLnzrOlwWc0Fwmi.37UHrLYj4Eq6Bfxhb4gOBJOuPly4kkpD32FjScputO4',
    domain: '.shein.com',
    path: '/'
  },
  {
    name: 'armorUuid',
    value: '2026051605285157efa2e475111728c96c6d64d94744ee00036ba3c3ded99e00',
    domain: '.shein.com',
    path: '/'
  }
]);
    const page = await context.newPage();
await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(15000);

    // Fechar popup se aparecer
    try {
      await page.click('[class*="close"], [class*="Close"], .sui-popup-close, button[class*="close"]', { timeout: 5000 });
      console.log('✅ Popup fechado!');
      await page.waitForTimeout(1000);
    } catch(e) {
      console.log('ℹ️ Nenhum popup encontrado');
    }

    // Espera os cards aparecerem
    try {
      await page.waitForSelector('[da-eid]', { timeout: 15000 });
      console.log('✅ Cards Shein encontrados!');
    } catch(e) {
      console.log('⚠️ Timeout esperando cards...');
    }

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await page.waitForTimeout(3000);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(3000);

    // Screenshot para debug (topo da página)
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/tmp/shein-debug.png' });
    console.log('📸 Screenshot salvo!');

    const produtos = await page.evaluate(() => {
      const items = [];

      // Tenta múltiplos seletores
      const seletores = [
        '[da-eid]',
        '.bsc-cart-item-mini__wrap',
        '.product-item-v3',
        '.S-product-item',
        'div[class*="product-item"]',
        'section[class*="product"]'
      ];

      let cards = [];
      let seletorUsado = '';
      for (const sel of seletores) {
        const found = Array.from(document.querySelectorAll(sel));
        if (found.length > 0) {
          cards = found;
          seletorUsado = sel;
          break;
        }
      }

      console.log(`Seletor usado: ${seletorUsado} | Cards: ${cards.length}`);

      cards.forEach((card, index) => {
        try {
          const eid = card.getAttribute('da-eid') || '';
          const link = eid ? `https://br.shein.com/p-p-${eid}.html` : '';

          const titulo = card.querySelector('[class*="title"], [class*="name"], [class*="goods-title"]')?.textContent?.trim() || '';

          const precoTexto = card.querySelector('[class*="price-new"], [class*="sale-price"], [class*="price"]')?.textContent?.trim() || '';
          const precoMatch = precoTexto.match(/R\$[\d.,]+/);
          const precoLimpo = precoMatch ? precoMatch[0] : '';
          const preco = parseFloat(precoLimpo.replace('R$', '').replace(/\./g, '').replace(',', '.')) || 0;

          const precoOrigEl = card.querySelector('[class*="del"], [class*="through"], [class*="original"], [class*="price-del"]');
          const precoOrigTexto = precoOrigEl?.textContent?.trim() || '';
          const preco_original = parseFloat(precoOrigTexto.replace('R$', '').replace(/\./g, '').replace(',', '.')) || 0;

          const descontoEl = card.querySelector('[class*="discount"], [class*="off-value"], [class*="sale-discount"]');
          const desconto = descontoEl?.textContent?.trim() || '';

          const img = card.querySelector('img');
          const imagem = img?.src || img?.getAttribute('data-src') || img?.getAttribute('data-lazyload') || '';

          const avaliacaoEl = card.querySelector('[class*="star"], [class*="rating"]');
          const avaliacao = parseFloat(avaliacaoEl?.textContent?.trim()) || 0;

          const vendidosEl = card.querySelector('[class*="sold"], [class*="vendido"]');
          const vendidos = vendidosEl?.textContent?.trim() || '';

          const pctDesconto = preco_original > 0 ? Math.round((preco_original - preco) / preco_original * 100) : 0;
          const possivel_bug = pctDesconto >= 70;

          if (titulo && titulo.length > 3 && preco > 0 && link) {
            items.push({
              titulo,
              preco,
              preco_original,
              desconto,
              pct_desconto: pctDesconto,
              possivel_bug,
              imagem,
              link,
              eid,
              avaliacao,
              vendidos,
              posicao: index + 1
            });
          }
        } catch (e) {
          console.error(`Erro card ${index}:`, e.message);
        }
      });

      return items;
    });

    await browser.close();

    const bugs = produtos.filter(p => p.possivel_bug);
    console.log(`✅ Shein: ${produtos.length} produtos | ${bugs.length} possíveis bugs`);

    res.json({
      status: "ok",
      categoria,
      total: produtos.length,
      bugs_detectados: bugs.length,
      data_extracao: new Date().toISOString(),
      produtos
    });

  } catch (error) {
    console.error("❌ Erro Shein:", error.message);
    res.status(500).json({ status: "erro", mensagem: error.message });
  }
});

// ============================================
// ENDPOINT: DEBUG SCREENSHOT
// ============================================
app.get("/debug-screenshot", (req, res) => {
  const arquivo = '/tmp/shein-debug.png';
  if (fs.existsSync(arquivo)) {
    res.sendFile(arquivo);
  } else {
    res.json({ status: "erro", mensagem: "Screenshot não encontrado. Chame /shein primeiro." });
  }
});
// ============================================
// ENDPOINT: GERAR LINK AFILIADO SHEIN
// ============================================
app.post("/shein-link", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ status: "erro", mensagem: "url obrigatória" });

    const response = await fetch("https://m.shein.com/br/affiliate/api/share/link/from/url", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
"Cookie": `armorUuid=2026051605285157efa2e475111728c96c6d64d94744ee00036ba3c3ded99e00; memberId=1180825914; AT=MDEwMDE.eyJiIjo3LCJnIjoxNzc4ODgyNzY1LCJyIjoiWmZnQ2pvIiwidCI6MiwibSI6MTE4MDgyNTkxNCwibCI6MTc3ODg4Mjc2NX0.c7e8197dce8ec6cd.3345b7409e3d797c64baf023ec7356f6a80d14db69ba2638e3f090f0a6d18dc3; sessionID_shein=s%3A7S7sthaovE_Sy9eCpmLnzrOlwWc0Fwmi.37UHrLYj4Eq6Bfxhb4gOBJOuPly4kkpD32FjScputO4; cf_clearance=ODqyenaGiuFp1tJjtXQeS30XtgxA5H0s.y4BSkhO0YM-1778893186-1.2.1.1-nlI8Bq94rWC5Z4OwT45G9imAHniEK5WLVAjEeb525oqnhuFfunL4hWUfuZi.B223wdp4wU1qGU_uhSJHiyAqy7DAQWbX07ENL0Qq_R_9l1QNqwu_ie1J_lNOnT5bLLqHlEwt.aLrWHkpZ_bQ4V0pVBm5xUvESZR2shZRmDtNlrikG5Ku2mQ1BgZAa65Jc_TOEaCdmA7ue3r8LTTmts03HjG3vuBoFfc2lBKLCXAZ3XPemX352lTxwbhIXlYMsHCoUf9gJlGjfney_05tz7qnLGMewAVH1HPAjxrS0JTP1G2Wvu4TygBE_3gPfyHujMT4CJWKooE6_2OXsxMkPgBfmg; language=br`,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": "https://br.shein.com/"
      },
      body: JSON.stringify({ uid: "1180825914", url })
    });

    const data = await response.json();
    res.json({ status: "ok", data });
  } catch (error) {
    res.status(500).json({ status: "erro", mensagem: error.message });
  }
});

// ============================================================
// ENDPOINT: SEGUIR CREATOR NO TIKTOK
// Adicione esse bloco no seu server.js
// ============================================================

app.post("/tiktok/seguir", async (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ status: "erro", mensagem: "username não fornecido" });
  }

  // Limpa o username (aceita @username ou username)
  const user = username.startsWith("@") ? username.slice(1) : username;
  const url  = `https://www.tiktok.com/@${user}`;

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-blink-features=AutomationControlled"],
  });

  try {
    const context = await browser.newContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      viewport: { width: 1920, height: 1080 },
      locale: "pt-BR",
      storageState: fs.existsSync(AUTH_FILE) ? AUTH_FILE : undefined,
    });

    const page = await context.newPage();

    // Mascara automação
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => undefined });
    });

    console.log(`[TikTok] Abrindo perfil: ${url}`);
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

    // Espera humana inicial (3-6 segundos)
    await page.waitForTimeout(3000 + Math.random() * 3000);

    // Verifica se perfil existe
    const perfilExiste = await page.$('h1[data-e2e="user-title"]') !== null;
    if (!perfilExiste) {
      await browser.close();
      return res.json({ status: "ignorado", mensagem: "Perfil não encontrado ou privado", username });
    }

    // Verifica se já segue
    const botaoSeguir = await page.$('button[data-e2e="follow-button"]');
    if (!botaoSeguir) {
      await browser.close();
      return res.json({ status: "ignorado", mensagem: "Já segue ou botão não encontrado", username });
    }

    const textoBotao = await botaoSeguir.innerText();
    if (textoBotao.toLowerCase().includes("seguindo") || textoBotao.toLowerCase().includes("following")) {
      await browser.close();
      return res.json({ status: "ignorado", mensagem: "Já segue esse creator", username });
    }

    // Scroll leve para parecer humano
    await page.evaluate(() => window.scrollBy(0, 200 + Math.random() * 300));
    await page.waitForTimeout(1000 + Math.random() * 2000);

    // Clica em seguir
    await botaoSeguir.click();
    console.log(`[TikTok] ✅ Seguiu: @${user}`);

    // Espera humana pós-follow (2-4 segundos)
    await page.waitForTimeout(2000 + Math.random() * 2000);

    // Às vezes curte o primeiro vídeo (50% de chance)
    if (Math.random() > 0.5) {
      const primeiroVideo = await page.$('div[data-e2e="user-post-item"] a');
      if (primeiroVideo) {
        await primeiroVideo.click();
        await page.waitForTimeout(2000 + Math.random() * 3000);

        // Curte o vídeo
        const botaoLike = await page.$('button[data-e2e="like-icon"]');
        if (botaoLike) {
          await botaoLike.click();
          console.log(`[TikTok] ❤️ Curtiu vídeo de: @${user}`);
          await page.waitForTimeout(1500 + Math.random() * 2000);
        }
      }
    }

    await browser.close();

    return res.json({
      status: "ok",
      mensagem: `Seguiu @${user} com sucesso`,
      username: `@${user}`,
    });

  } catch (error) {
    await browser.close();
    console.error(`[TikTok] Erro ao seguir @${user}:`, error.message);
    return res.status(500).json({ status: "erro", mensagem: error.message, username });
  }
});

// ============================================================
// ENDPOINT: SEGUIR CREATOR NO TIKTOK
// Adicione esse bloco no seu server.js
// ============================================================

app.post("/tiktok/seguir", async (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ status: "erro", mensagem: "username não fornecido" });
  }

  // Limpa o username (aceita @username ou username)
  const user = username.startsWith("@") ? username.slice(1) : username;
  const url  = `https://www.tiktok.com/@${user}`;

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-blink-features=AutomationControlled"],
  });

  try {
    const context = await browser.newContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      viewport: { width: 1920, height: 1080 },
      locale: "pt-BR",
      storageState: fs.existsSync(AUTH_FILE) ? AUTH_FILE : undefined,
    });

    const page = await context.newPage();

    // Mascara automação
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => undefined });
    });

    console.log(`[TikTok] Abrindo perfil: ${url}`);
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.screenshot({ path: '/app/tiktok-debug.png' });

    // Espera humana inicial (3-6 segundos)
    await page.waitForTimeout(3000 + Math.random() * 3000);

    // Verifica se perfil existe
    const perfilExiste = await page.$('h1[data-e2e="user-title"]') !== null;
    if (!perfilExiste) {
      await browser.close();
      return res.json({ status: "ignorado", mensagem: "Perfil não encontrado ou privado", username });
    }

    // Verifica se já segue
const botaoSeguir = await page.$('button[data-e2e="follow-button"], button[data-e2e="follow-btn"]');
    if (!botaoSeguir) {
      await browser.close();
      return res.json({ status: "ignorado", mensagem: "Já segue ou botão não encontrado", username });
    }

    const textoBotao = await botaoSeguir.innerText();
    if (textoBotao.toLowerCase().includes("seguindo") || textoBotao.toLowerCase().includes("following") || textoBotao.toLowerCase().includes("amigos")) {
      return res.json({ status: "ignorado", mensagem: "Já segue esse creator", username });
    }

    // Scroll leve para parecer humano
    await page.evaluate(() => window.scrollBy(0, 200 + Math.random() * 300));
    await page.waitForTimeout(1000 + Math.random() * 2000);

    // Clica em seguir
    await botaoSeguir.click();
    console.log(`[TikTok] ✅ Seguiu: @${user}`);

    // Espera humana pós-follow (2-4 segundos)
    await page.waitForTimeout(2000 + Math.random() * 2000);

    // Às vezes curte o primeiro vídeo (50% de chance)
    if (Math.random() > 0.5) {
      const primeiroVideo = await page.$('div[data-e2e="user-post-item"] a');
      if (primeiroVideo) {
        await primeiroVideo.click();
        await page.waitForTimeout(2000 + Math.random() * 3000);

        // Curte o vídeo
        const botaoLike = await page.$('button[data-e2e="like-icon"]');
        if (botaoLike) {
          await botaoLike.click();
          console.log(`[TikTok] ❤️ Curtiu vídeo de: @${user}`);
          await page.waitForTimeout(1500 + Math.random() * 2000);
        }
      }
    }

    await browser.close();

    return res.json({
      status: "ok",
      mensagem: `Seguiu @${user} com sucesso`,
      username: `@${user}`,
    });

  } catch (error) {
    await browser.close();
    console.error(`[TikTok] Erro ao seguir @${user}:`, error.message);
    return res.status(500).json({ status: "erro", mensagem: error.message, username });
  }
});
// ============================================
// INICIAR SERVIDOR
// ============================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`http://localhost:${PORT}`);
  console.log("");
  console.log("Endpoints disponíveis:");
  console.log("  GET  /                  - Info da API");
  console.log("  GET  /ofertas           - Buscar ofertas do dia (ML)");
  console.log("  GET  /ofertas/:cat      - Buscar ofertas por categoria (ML)");
  console.log("  POST /mercado-simples   - Gerar link de afiliado (ML)");
  console.log("  POST /mercado           - Gerar link (tenta encurtar) (ML)");
  console.log("  POST /mercado-oficial   - Gerar link meli.la oficial (ML)");
  console.log("  GET  /amazon            - Buscar ofertas Amazon (nacionais + internacionais) ✨");
  console.log("  GET  /amazon?tipo=nacionais     - Só nacionais");
  console.log("  GET  /amazon?tipo=internacionais - Só internacionais");
  console.log("  POST /amazon-link       - Gerar link de afiliado Amazon");
  console.log("  POST /amazon-buscar     - Buscar produtos via Creators API ✨");
  console.log("  POST /amazon-produto    - Detalhes de produto por ASIN ✨");
  console.log("  GET  /shein?categoria=moda      - Buscar produtos Shein ✨");
  console.log("  GET  /debug-screenshot  - Ver último screenshot Playwright");
});
