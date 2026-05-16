// ============================================
// IMPORTS E CONFIGURAÇÃO INICIAL
// ============================================
const express = require("express");
const { chromium } = require("playwright-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

chromium.use(StealthPlugin());

const app = express();
app.use(express.json());

// ============================================
// VARIÁVEIS DE AMBIENTE
// ============================================
const AMAZON_TAG = process.env.AMAZON_TAG || "giseleramosd-20";
const CREATORS_CLIENT_ID = process.env.AMAZON_CLIENT_ID;
const CREATORS_CLIENT_SECRET = process.env.AMAZON_CLIENT_SECRET;

// ============================================
// COOKIES DO TIKTOK (atualizados 16/05/2026)
// ============================================
const TIKTOK_COOKIES = [
  { name: "delay_guest_mode_vid", value: "5", domain: ".tiktok.com", path: "/" },
  { name: "csrf_session_id", value: "0d00ca977216b72d7bedd2025c68cf5d", domain: ".tiktok.com", path: "/" },
  { name: "msToken", value: "3s5xvMaAmIT__AqeREjLy6GR3Yaa9ydnLGM_txgmO_TXeZhSSItyIeQJRyO7mLKuo0E2b0s4J0Tq39sIR1i5NsAh82oTRJxKz_djMSjG1PFLCwc7B8B1qox2AILtXJ90RvWM24hpTt8eI14=", domain: ".tiktok.com", path: "/" },
  { name: "tt_session_tlb_tag", value: "sttt%7C2%7CbbVnxN6Oz4q50ffsCI28Lv________-mWCxEitg9e1VsOecUz2m5zeWvh0Fe9GwXDwpJwOU6tWU%3D", domain: ".tiktok.com", path: "/" },
  { name: "sid_guard", value: "6db567c4de8ecf8ab9d1f7ec088dbc2e%7C1778971816%7C15552000%7CThu%2C+12-Nov-2026+22%3A50%3A16+GMT", domain: ".tiktok.com", path: "/" },
  { name: "ttwid", value: "1%7CDQCkOWjH-OZvFdBtE87cPnUIlLQRspfKE2MKDjB2fgM%7C1778971821%7Cfdc5e37ce78c01c617d7e7fff90916a1e447d516f73d50863de3081c574e38f2", domain: ".tiktok.com", path: "/" },
  { name: "uid_tt", value: "c7d40b6ca685810af459bee32373205e0b033bc23f7776b5c4f5cd8acf966543", domain: ".tiktok.com", path: "/" },
  { name: "uid_tt_ss", value: "c7d40b6ca685810af459bee32373205e0b033bc23f7776b5c4f5cd8acf966543", domain: ".tiktok.com", path: "/" },
  { name: "passport_csrf_token", value: "981f81810312de1423936c841f0b4afe", domain: ".tiktok.com", path: "/" },
  { name: "passport_csrf_token_default", value: "981f81810312de1423936c841f0b4afe", domain: ".tiktok.com", path: "/" },
  { name: "s_v_web_id", value: "verify_mowwfnlp_e27BeiVT_TbmE_4BYC_9YCI_PKvKO4OeqIA8", domain: ".tiktok.com", path: "/" },
  { name: "ssid_ucp_v1", value: "1.0.1-KDY2MWVlNDExNzZjMDdmZmUzODA5OTg2ZjgzYTRlOGQwZDgyNTExYTEKIgiBiIaa67OG-WkQqOmj0AYYswsgDDCus8jPBjgHQPQHSAQQAxoDbXkyIiA2ZGI1NjdjNGRlOGVjZjhhYjlkMWY3ZWMwODhkYmMyZTJOCiAVi8I22X5aTcwAxJMpB9IC8WY7cVZAPFj5fSma7dACjxIgf_t-wFs_MgvuvF2W8XxCPAqMQUvy407X3lFn6v2r7W4YAyIGdGlrdG9r", domain: ".tiktok.com", path: "/" },
  { name: "cmpl_token", value: "AgQYAPNk_hfkTtK5zPc5O3NdOPOcQZ4s2X-T72Cn8o4", domain: ".tiktok.com", path: "/" },
  { name: "multi_sids", value: "7634192487749354497%3A6db567c4de8ecf8ab9d1f7ec088dbc2e", domain: ".tiktok.com", path: "/" },
  { name: "passport_auth_status_ss", value: "c0ae6aa2cb58dc8bef68721746f47a68%2C8ffdf5d767910d17e2b45c951c6cd032", domain: ".tiktok.com", path: "/" },
  { name: "sessionid", value: "6db567c4de8ecf8ab9d1f7ec088dbc2e", domain: ".tiktok.com", path: "/" },
  { name: "sessionid_ss", value: "6db567c4de8ecf8ab9d1f7ec088dbc2e", domain: ".tiktok.com", path: "/" },
  { name: "sid_tt", value: "6db567c4de8ecf8ab9d1f7ec088dbc2e", domain: ".tiktok.com", path: "/" },
  { name: "sid_ucp_v1", value: "1.0.1-KDY2MWVlNDExNzZjMDdmZmUzODA5OTg2ZjgzYTRlOGQwZDgyNTExYTEKIgiBiIaa67OG-WkQqOmj0AYYswsgDDCus8jPBjgHQPQHSAQQAxoDbXkyIiA2ZGI1NjdjNGRlOGVjZjhhYjlkMWY3ZWMwODhkYmMyZTJOCiAVi8I22X5aTcwAxJMpB9IC8WY7cVZAPFj5fSma7dACjxIgf_t-wFs_MgvuvF2W8XxCPAqMQUvy407X3lFn6v2r7W4YAyIGdGlrdG9r", domain: ".tiktok.com", path: "/" },
  { name: "tt_chain_token", value: "oe5Yl/GgqqzePSSaHElF8A==", domain: ".tiktok.com", path: "/" },
  { name: "tt_csrf_token", value: "fMWbLlP0-bWNFgfrqY75qGjQbytPs6rzPsDs", domain: ".tiktok.com", path: "/" },
  { name: "_ttp", value: "3DRa9EVRr1RMt7h1r6VYkwMNaWx", domain: ".tiktok.com", path: "/" },
  { name: "tiktok_webapp_theme", value: "dark", domain: ".tiktok.com", path: "/" }
];

// ============================================
// TOKEN AMAZON CREATORS API
// ============================================
let creatorsToken = null;
let creatorsTokenExpiry = null;

async function getCreatorsToken() {
  const agora = Date.now();
  if (creatorsToken && creatorsTokenExpiry && agora < creatorsTokenExpiry - 60000) return creatorsToken;
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
  if (!response.ok) throw new Error(`Erro token Amazon: ${response.status} - ${await response.text()}`);
  const data = await response.json();
  creatorsToken = data.access_token;
  creatorsTokenExpiry = agora + data.expires_in * 1000;
  return creatorsToken;
}

// ============================================
// FUNÇÃO AUXILIAR: LANÇAR BROWSER COM STEALTH
// ============================================
async function abrirBrowser() {
  return await chromium.launch({
    headless: true,
    args: [
      "--no-sandbox", "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
      "--disable-dev-shm-usage", "--disable-gpu",
      "--single-process", "--no-zygote",
      "--disable-extensions", "--disable-background-networking",
      "--disable-default-apps"
    ]
  });
}

// ============================================
// HELPER: página TikTok com cookies e stealth
// ============================================
async function criarPaginaTikTok(browser) {
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    viewport: { width: 1920, height: 1080 },
    locale: "pt-BR"
  });
  await context.addCookies(TIKTOK_COOKIES);
  const page = await context.newPage();
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });
    Object.defineProperty(navigator, "plugins", { get: () => [1, 2, 3] });
    Object.defineProperty(navigator, "languages", { get: () => ["pt-BR", "pt", "en"] });
    const orig = window.navigator.permissions.query;
    window.navigator.permissions.query = (p) =>
      p.name === "notifications" ? Promise.resolve({ state: Notification.permission }) : orig(p);
    window.chrome = { runtime: {} };
  });
  return page;
}

// ============================================
// HELPER: fechar modais/overlays TikTok
// ============================================
async function fecharModais(page) {
  try { await page.keyboard.press("Escape"); await page.waitForTimeout(800); } catch(e) {}
  try {
    const btn = await page.$('[class*="TUXModal"] button[aria-label="Close"], [class*="TUXModal"] button[aria-label="Fechar"], button[aria-label="Close"], [class*="modal-close"]');
    if (btn) { await btn.click({ force: true }); await page.waitForTimeout(800); }
  } catch(e) {}
  try {
    await page.evaluate(() => {
      document.querySelectorAll('[class*="TUXModal-overlay"], [class*="TUXModal"], [class*="modal-overlay"], [class*="Modal-overlay"]').forEach(el => el.remove());
    });
  } catch(e) {}
}

// ============================================
// ROTA: INFO DA API
// ============================================
app.get("/", (req, res) => {
  res.json({
    status: "online", versao: "9.0",
    endpoints: {
      "GET /ofertas": "Busca ofertas do dia (Mercado Livre)",
      "GET /ofertas/:categoria": "Busca ofertas por categoria (ML)",
      "POST /mercado-simples": "Gera link de afiliado ML simples",
      "POST /mercado-oficial": "Gera link meli.la oficial (ML)",
      "GET /amazon": "Busca ofertas Amazon",
      "POST /amazon-link": "Gera link de afiliado Amazon",
      "POST /amazon-buscar": "Busca produtos via Creators API",
      "POST /amazon-produto": "Detalhes de produto por ASIN",
      "GET /shein": "Busca produtos Shein (?categoria=moda)",
      "POST /shein-link": "Gera link de afiliado Shein",
      "POST /tiktok/seguir": "Segue um creator no TikTok",
      "POST /tiktok/curtir": "Curte vídeos de um creator { username, quantidade }",
      "GET /tiktok-screenshot": "Ver último screenshot do TikTok",
      "GET /debug-screenshot": "Ver último screenshot Shein"
    }
  });
});

// ============================================
// ROTA: OFERTAS DO DIA - MERCADO LIVRE
// ============================================
app.get("/ofertas", async (req, res) => {
  try {
    const browser = await abrirBrowser();
    const context = await browser.newContext({ userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36", viewport: { width: 1920, height: 1080 }, locale: "pt-BR" });
    const page = await context.newPage();
    await page.goto("https://www.mercadolivre.com.br/ofertas", { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(3000);
    for (let i = 1; i <= 5; i++) { await page.evaluate((s) => window.scrollTo(0, (document.body.scrollHeight / 5) * s), i); await page.waitForTimeout(2000); }
    const produtos = await page.evaluate(() => {
      const items = [];
      const seletores = ["article", "div[class*='ui-search-result']", "li[class*='ui-search-layout__item']", "div.poly-card"];
      let cards = [];
      for (const sel of seletores) { cards = Array.from(document.querySelectorAll(sel)); if (cards.length > 0) break; }
      cards.forEach((card, index) => {
        try {
          let titulo = "";
          for (const sel of ["h2", "h3", "a[class*='title']", ".poly-component__title"]) { const el = card.querySelector(sel); if (el && el.textContent.trim()) { titulo = el.textContent.trim(); break; } }
          const precoEl = card.querySelector(".andes-money-amount__fraction, [class*='price-tag-fraction']");
          const preco = precoEl ? parseFloat(precoEl.textContent.trim().replace(/[^\d,]/g, "").replace(",", ".")) : 0;
          const link = card.querySelector("a")?.href || "";
          const imagem = card.querySelector("img")?.src || card.querySelector("img")?.getAttribute("data-src") || "";
          const desconto = card.querySelector("[class*='discount'], [class*='off']")?.textContent?.trim() || "";
          if (titulo && titulo.length > 3) items.push({ titulo, preco, desconto, link, imagem, posicao: index + 1 });
        } catch (e) {}
      });
      return items;
    });
    await browser.close();
    res.json({ status: "ok", total: produtos.length, data_extracao: new Date().toISOString(), produtos });
  } catch (error) { res.status(500).json({ status: "erro", mensagem: error.message }); }
});

// ============================================
// ROTA: OFERTAS POR CATEGORIA - MERCADO LIVRE
// ============================================
app.get("/ofertas/:categoria", async (req, res) => {
  try {
    const { categoria } = req.params;
    const browser = await abrirBrowser();
    const page = await (await browser.newContext()).newPage();
    await page.goto(`https://www.mercadolivre.com.br/ofertas?container_id=${categoria}`, { waitUntil: "networkidle", timeout: 30000 });
    const produtos = await page.evaluate(() => {
      const items = [];
      document.querySelectorAll("div.poly-card, li.poly-component__item, div[class*='promotion-item']").forEach((card, index) => {
        try {
          const titulo = card.querySelector("h2, h3, [class*='title']")?.textContent?.trim();
          const precoTexto = card.querySelector("[class*='price'], .andes-money-amount__fraction")?.textContent?.trim();
          const preco = precoTexto ? parseFloat(precoTexto.replace(/[^\d,]/g, "").replace(",", ".")) : 0;
          const link = card.querySelector("a")?.href || "";
          const imagem = card.querySelector("img")?.src || "";
          if (titulo && link) items.push({ titulo, preco, link, imagem, posicao: index + 1 });
        } catch (e) {}
      });
      return items;
    });
    await browser.close();
    res.json({ status: "ok", categoria, total: produtos.length, produtos });
  } catch (error) { res.status(500).json({ status: "erro", mensagem: error.message }); }
});

// ============================================
// ROTA: LINK DE AFILIADO SIMPLES - ML
// ============================================
app.post("/mercado-simples", (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ status: "erro", mensagem: "URL não fornecida" });
  const urlAfiliado = url.includes("?") ? `${url}&tracking_id=ragi6098412` : `${url}?tracking_id=ragi6098412`;
  res.json({ status: "ok", url_original: url, url_afiliado: urlAfiliado });
});

// ============================================
// ROTA: LINK MELI.LA OFICIAL - ML
// ============================================
app.post("/mercado-oficial", async (req, res) => {
  try {
    const { url } = req.body;
    const response = await fetch("https://www.mercadolivre.com.br/affiliate-program/api/v2/affiliates/createLink", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Cookie": process.env.ML_COOKIE || "", "User-Agent": "Mozilla/5.0" },
      body: JSON.stringify({ urls: [url], tag: "ragi6098412" })
    });
    const data = await response.json();
    res.json({ status: "ok", url_original: url, url_afiliado: data.urls?.[0]?.short_url || url });
  } catch (error) { res.status(500).json({ status: "erro", mensagem: error.message }); }
});

// ============================================
// ROTA: BUSCAR OFERTAS AMAZON
// ============================================
app.get("/amazon", async (req, res) => {
  try {
    const { tipo = "todos" } = req.query;
    const browser = await abrirBrowser();
    const context = await browser.newContext({ userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36", viewport: { width: 1920, height: 1080 }, locale: "pt-BR" });
    const page = await context.newPage();
    async function extrairAmazon(url, origem) {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForTimeout(4000);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(2000);
      return await page.evaluate((origem) => Array.from(document.querySelectorAll('div[data-component-type="s-search-result"]')).map((card, index) => {
        const titulo = card.querySelector("h2 a span, h2 span")?.textContent?.trim() || "";
        const precoInteiro = card.querySelector(".a-price-whole")?.textContent?.replace(/[^\d]/g, "") || "0";
        const precoFracao = card.querySelector(".a-price-fraction")?.textContent?.replace(/[^\d]/g, "") || "00";
        const preco = parseFloat(`${precoInteiro}.${precoFracao}`) || 0;
        const asin = card.getAttribute("data-asin") || "";
        const link = asin ? `https://www.amazon.com.br/dp/${asin}` : "";
        const imagem = card.querySelector("img.s-image")?.src || "";
        if (titulo && preco > 0) return { titulo, preco, asin, link, imagem, origem, posicao: index + 1 };
        return null;
      }).filter(Boolean), origem);
    }
    let produtos = [];
    if (tipo === "nacionais" || tipo === "todos") produtos = [...produtos, ...await extrairAmazon("https://www.amazon.com.br/s?k=casa+cozinha&i=home&rh=p_76%3A11", "nacional")];
    if (tipo === "internacionais" || tipo === "todos") produtos = [...produtos, ...await extrairAmazon("https://www.amazon.com.br/s?k=casa+e+decoracao&i=home", "internacional")];
    await browser.close();
    const unicos = produtos.filter((p, i, arr) => arr.findIndex(x => x.asin === p.asin) === i);
    res.json({ status: "ok", total: unicos.length, data_extracao: new Date().toISOString(), produtos: unicos });
  } catch (error) { res.status(500).json({ status: "erro", mensagem: error.message }); }
});

// ============================================
// ROTA: LINK DE AFILIADO AMAZON
// ============================================
app.post("/amazon-link", (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ status: "erro", mensagem: "URL não fornecida" });
  const asinMatch = url.match(/\/dp\/([A-Z0-9]{10})|\/gp\/product\/([A-Z0-9]{10})/);
  const asin = asinMatch ? asinMatch[1] || asinMatch[2] : null;
  const urlAfiliado = asin ? `https://www.amazon.com.br/dp/${asin}?tag=${AMAZON_TAG}` : `${url}${url.includes("?") ? "&" : "?"}tag=${AMAZON_TAG}`;
  res.json({ status: "ok", url_original: url, url_afiliado: urlAfiliado, asin: asin || "não encontrado" });
});

// ============================================
// ROTA: BUSCAR PRODUTOS - CREATORS API AMAZON
// ============================================
app.post("/amazon-buscar", async (req, res) => {
  try {
    const { keywords, categoria = "All", pagina = 1 } = req.body;
    if (!keywords) return res.status(400).json({ status: "erro", mensagem: "'keywords' obrigatório" });
    const token = await getCreatorsToken();
    const response = await fetch("https://affiliate-program.amazon.com/creatorapi/paapi5/searchitems", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}`, "x-marketplace": "www.amazon.com.br" },
      body: JSON.stringify({ keywords, partnerTag: AMAZON_TAG, partnerType: "Associates", searchIndex: categoria, itemPage: pagina, itemCount: 10, resources: ["itemInfo.title", "offersV2.listings.price", "images.primary.medium", "customerReviews.count", "customerReviews.starRating"], marketplace: "www.amazon.com.br", languagesOfPreference: ["pt_BR"] })
    });
    const data = await response.json();
    const produtos = (data.SearchResult?.Items || []).map((item, i) => ({ asin: item.ASIN || "", titulo: item.ItemInfo?.Title?.DisplayValue || "", preco: item.OffersV2?.Listings?.[0]?.Price?.Amount || 0, preco_formatado: item.OffersV2?.Listings?.[0]?.Price?.DisplayAmount || "", imagem: item.Images?.Primary?.Medium?.URL || "", url_afiliado: `https://www.amazon.com.br/dp/${item.ASIN}?tag=${AMAZON_TAG}`, posicao: i + 1 }));
    res.json({ status: "ok", keywords, total: produtos.length, produtos });
  } catch (error) { res.status(500).json({ status: "erro", mensagem: error.message }); }
});

// ============================================
// ROTA: DETALHES DE PRODUTO POR ASIN - AMAZON
// ============================================
app.post("/amazon-produto", async (req, res) => {
  try {
    const { asin } = req.body;
    if (!asin) return res.status(400).json({ status: "erro", mensagem: "'asin' obrigatório" });
    const token = await getCreatorsToken();
    const response = await fetch("https://affiliate-program.amazon.com/creatorapi/paapi5/getitems", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}`, "x-marketplace": "www.amazon.com.br" },
      body: JSON.stringify({ itemIds: [asin], partnerTag: AMAZON_TAG, partnerType: "Associates", resources: ["itemInfo.title", "offersV2.listings.price", "images.primary.large", "customerReviews.count", "customerReviews.starRating"], marketplace: "www.amazon.com.br", languagesOfPreference: ["pt_BR"] })
    });
    const data = await response.json();
    const item = data.ItemsResult?.Items?.[0];
    if (!item) return res.json({ status: "aviso", mensagem: "Produto não encontrado", asin });
    res.json({ status: "ok", asin, titulo: item.ItemInfo?.Title?.DisplayValue || "", preco: item.OffersV2?.Listings?.[0]?.Price?.Amount || 0, preco_formatado: item.OffersV2?.Listings?.[0]?.Price?.DisplayAmount || "", imagem: item.Images?.Primary?.Large?.URL || "", url_afiliado: `https://www.amazon.com.br/dp/${asin}?tag=${AMAZON_TAG}` });
  } catch (error) { res.status(500).json({ status: "erro", mensagem: error.message }); }
});

// ============================================
// ROTA: BUSCAR PRODUTOS SHEIN
// ============================================
app.get("/shein", async (req, res) => {
  try {
    const { categoria = "moda" } = req.query;
    const urls = { "moda": "https://br.shein.com/Women-Clothing-sc-017172961.html", "moda-feminina": "https://br.shein.com/Women-Clothing-sc-017172961.html", "moda-masculina": "https://br.shein.com/Men-Clothing-sc-00864889.html", "maquiagem": "https://br.shein.com/Beauty-cat-1954.html?sort=7", "aesthetics": "https://br.shein.com/Women-Y2K-cat-2467.html?sort=7", "camisetas": "https://br.shein.com/Women-Tops-cat-1738.html?sort=7", "linho": "https://br.shein.com/Women-Linen-cat-3007.html?sort=7", "casa": "https://br.shein.com/Home-cat-1766.html?sort=7", "promocao": "https://br.shein.com/promotion/flash-sale" };
    const url = urls[categoria] || urls["moda"];
    const browser = await abrirBrowser();
    const context = await browser.newContext({ userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36", viewport: { width: 1920, height: 1080 }, locale: "pt-BR" });
    await context.addCookies([{ name: "memberId", value: "1180825914", domain: ".shein.com", path: "/" }, { name: "AT", value: "MDEwMDE.eyJiIjo3LCJnIjoxNzc4ODgyNzY1LCJyIjoiWmZnQ2pvIiwidCI6MiwibSI6MTE4MDgyNTkxNCwibCI6MTc3ODg4Mjc2NX0.c7e8197dce8ec6cd.3345b7409e3d797c64baf023ec7356f6a80d14db69ba2638e3f090f0a6d18dc3", domain: ".shein.com", path: "/" }, { name: "sessionID_shein", value: "s%3A7S7sthaovE_Sy9eCpmLnzrOlwWc0Fwmi.37UHrLYj4Eq6Bfxhb4gOBJOuPly4kkpD32FjScputO4", domain: ".shein.com", path: "/" }]);
    const page = await context.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(8000);
    try { await page.click('[class*="close"], .sui-popup-close', { timeout: 3000 }); } catch (e) {}
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2)); await page.waitForTimeout(2000);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await page.waitForTimeout(2000);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: "/tmp/shein-debug.png" });
    const produtos = await page.evaluate(() => {
      const items = [];
      const seletores = ["[da-eid]", ".product-item-v3", ".S-product-item", "div[class*='product-item']"];
      let cards = [];
      for (const sel of seletores) { cards = Array.from(document.querySelectorAll(sel)); if (cards.length > 0) break; }
      cards.forEach((card, index) => {
        try {
          const eid = card.getAttribute("da-eid") || "";
          const link = eid ? `https://br.shein.com/p-p-${eid}.html` : "";
          const titulo = card.querySelector('[class*="title"], [class*="name"]')?.textContent?.trim() || "";
          const precoTexto = card.querySelector('[class*="price-new"], [class*="sale-price"]')?.textContent?.trim() || "";
          const preco = parseFloat(precoTexto.replace("R$", "").replace(/\./g, "").replace(",", ".")) || 0;
          const imagem = card.querySelector("img")?.src || card.querySelector("img")?.getAttribute("data-src") || "";
          if (titulo && preco > 0 && link) items.push({ titulo, preco, imagem, link, posicao: index + 1 });
        } catch (e) {}
      });
      return items;
    });
    await browser.close();
    res.json({ status: "ok", categoria, total: produtos.length, data_extracao: new Date().toISOString(), produtos });
  } catch (error) { res.status(500).json({ status: "erro", mensagem: error.message }); }
});

// ============================================
// ROTA: LINK DE AFILIADO SHEIN
// ============================================
app.post("/shein-link", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ status: "erro", mensagem: "url obrigatória" });
    const response = await fetch("https://m.shein.com/br/affiliate/api/share/link/from/url", { method: "POST", headers: { "Content-Type": "application/json", "Cookie": "memberId=1180825914; AT=MDEwMDE.eyJiIjo3LCJnIjoxNzc4ODgyNzY1LCJyIjoiWmZnQ2pvIiwidCI6MiwibSI6MTE4MDgyNTkxNCwibCI6MTc3ODg4Mjc2NX0.c7e8197dce8ec6cd.3345b7409e3d797c64baf023ec7356f6a80d14db69ba2638e3f090f0a6d18dc3", "User-Agent": "Mozilla/5.0" }, body: JSON.stringify({ uid: "1180825914", url }) });
    res.json({ status: "ok", data: await response.json() });
  } catch (error) { res.status(500).json({ status: "erro", mensagem: error.message }); }
});

// ============================================
// ROTA: SEGUIR CREATOR NO TIKTOK
// ============================================
app.post("/tiktok/seguir", async (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ status: "erro", mensagem: "username não fornecido" });
  const user = username.startsWith("@") ? username.slice(1) : username;
  console.log(`[TikTok] Seguindo: @${user}`);
  let browser;
  try {
    browser = await abrirBrowser();
    const page = await criarPaginaTikTok(browser);
    await page.goto(`https://www.tiktok.com/@${user}`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(8000);
    await page.mouse.move(500, 300);
    await page.waitForTimeout(1000);
    await fecharModais(page);
    await page.screenshot({ path: "/app/tiktok-debug.png", fullPage: false });

    // ✅ SELETOR CORRETO: botão Follow do HEADER do perfil, não dos suggested accounts
    // O header do perfil fica dentro de [data-e2e="user-page-follow-button"]
    // ou dentro do container [data-e2e="user-info-container"]
    let botaoSeguir = null;

    // Tentativa 1: seletor específico do header do perfil
    for (const sel of [
      '[data-e2e="user-page-follow-button"]',
      '[data-e2e="follow-button"][aria-label*="${user}"]',
      'div[data-e2e="user-info-container"] button[data-e2e="follow-button"]',
      'div[class*="ShareLayoutHeader"] button[data-e2e="follow-button"]',
      'div[class*="user-page"] button[data-e2e="follow-button"]',
    ]) {
      botaoSeguir = await page.$(sel);
      if (botaoSeguir) {
        console.log(`[TikTok] Botão encontrado com seletor: ${sel}`);
        break;
      }
    }

    // Tentativa 2: pegar TODOS os botões Follow e pegar o PRIMEIRO que está no topo da página
    // (acima de y=400px para evitar os suggested accounts que ficam abaixo)
    if (!botaoSeguir) {
      const todosBotoes = await page.$$('button[data-e2e="follow-button"]');
      for (const btn of todosBotoes) {
        const box = await btn.boundingBox();
        if (box && box.y < 400) { // header do perfil fica no topo
          botaoSeguir = btn;
          console.log(`[TikTok] Botão encontrado por posição Y=${box.y}`);
          break;
        }
      }
    }

    // Tentativa 3: buscar por texto dentro do header (container específico)
    if (!botaoSeguir) {
      const resultado = await page.evaluate(() => {
        // Pega o header do perfil — fica antes da seção de sugestões
        const headerSelectors = [
          'div[class*="DivShareLayoutHeaderAction"]',
          'div[class*="user-page-header"]',
          'div[class*="UserPage"] > div:first-child',
        ];
        for (const sel of headerSelectors) {
          const container = document.querySelector(sel);
          if (container) {
            const btns = container.querySelectorAll('button');
            for (const btn of btns) {
              const texto = btn.innerText.toLowerCase();
              if (texto === 'seguir' || texto === 'follow') return true;
            }
          }
        }
        return false;
      });
      if (resultado) {
        botaoSeguir = await page.$('div[class*="DivShareLayoutHeaderAction"] button, div[class*="user-page-header"] button');
      }
    }

    if (!botaoSeguir) {
      await browser.close();
      return res.json({ status: "ignorado", mensagem: "Botão de seguir não encontrado no perfil", username: `@${user}` });
    }

    // Verifica se já segue
    const textoBotao = await botaoSeguir.innerText().catch(() => "");
    console.log(`[TikTok] Texto do botão: "${textoBotao}"`);
    if (textoBotao.toLowerCase().includes("seguindo") || textoBotao.toLowerCase().includes("following")) {
      await browser.close();
      return res.json({ status: "ignorado", mensagem: "Já segue esse creator", username: `@${user}` });
    }

    // Scroll suave e clique via JS (contorna pointer-events do overlay)
    await page.evaluate(() => window.scrollTo(0, 0)); // volta ao topo para ter certeza
    await page.waitForTimeout(800);
    await fecharModais(page); // tenta fechar modal de novo antes do clique
    await page.evaluate((el) => el.click(), botaoSeguir);
    await page.waitForTimeout(3000);

    // Verifica se realmente seguiu
    const textoPosClique = await botaoSeguir.innerText().catch(() => "");
    console.log(`[TikTok] Texto após clique: "${textoPosClique}"`);

    await page.screenshot({ path: "/app/tiktok-debug.png", fullPage: false });
    console.log(`[TikTok] ✅ Seguiu @${user}`);
    await browser.close();

    const confirmado = textoPosClique.toLowerCase().includes("seguindo") || textoPosClique.toLowerCase().includes("following");
    return res.json({
      status: "ok",
      mensagem: `Seguiu @${user} com sucesso`,
      username: `@${user}`,
      confirmado,
      botao_texto: textoPosClique
    });
  } catch (error) {
    if (browser) await browser.close();
    console.error(`[TikTok] ERRO: ${error.message}`);
    return res.status(500).json({ status: "erro", mensagem: error.message, username: `@${user}` });
  }
});
// ============================================
// ROTA: CURTIR VÍDEOS DE UM CREATOR NO TIKTOK
// Body: { "username": "@usuario", "quantidade": 3 }
// Máximo: 10 curtidas por chamada
// ============================================
app.post("/tiktok/curtir", async (req, res) => {
  const { username, quantidade = 3 } = req.body;
  if (!username) return res.status(400).json({ status: "erro", mensagem: "username não fornecido" });
  const user = username.startsWith("@") ? username.slice(1) : username;
  const qtd = Math.min(parseInt(quantidade) || 3, 10);
  console.log(`[TikTok] Curtindo ${qtd} vídeo(s) de @${user}`);
  let browser;
  try {
    browser = await abrirBrowser();
    const page = await criarPaginaTikTok(browser);

    await page.goto(`https://www.tiktok.com/@${user}`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(8000);
    await page.screenshot({ path: "/app/tiktok-debug.png", fullPage: false });
    await fecharModais(page);

    // Coleta links dos vídeos do perfil
    const linksVideos = await page.evaluate(() => {
      const links = [];
      document.querySelectorAll('a[href*="/video/"]').forEach(a => { if (a.href && !links.includes(a.href)) links.push(a.href); });
      return links.slice(0, 10);
    });

    if (linksVideos.length === 0) {
      await browser.close();
      return res.json({ status: "ignorado", mensagem: "Nenhum vídeo encontrado no perfil", username: `@${user}` });
    }

    const curtidos = [];
    const erros = [];

    for (let i = 0; i < Math.min(qtd, linksVideos.length); i++) {
      const videoUrl = linksVideos[i];
      try {
        await page.goto(videoUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
        await page.waitForTimeout(4000 + Math.random() * 2000);
        await fecharModais(page);

        let botaoCurtir = null;
        for (const sel of ['button[data-e2e="like-button"]', 'button[data-e2e="browse-like-button"]', '[data-e2e="like-icon"]']) {
          botaoCurtir = await page.$(sel);
          if (botaoCurtir) break;
        }

        if (botaoCurtir) {
          const jaCurtiu = await page.evaluate(el => {
            const btn = el.tagName === "BUTTON" ? el : el.closest("button");
            return btn?.getAttribute("aria-pressed") === "true";
          }, botaoCurtir);

          if (jaCurtiu) {
            curtidos.push({ url: videoUrl, status: "ja_curtido" });
          } else {
            await page.evaluate((el) => el.click(), botaoCurtir);
            await page.waitForTimeout(1500);
            curtidos.push({ url: videoUrl, status: "curtido" });
            console.log(`[TikTok] ❤️ Curtiu: ${videoUrl}`);
          }
        } else {
          erros.push({ url: videoUrl, motivo: "botão curtir não encontrado" });
        }

        await page.waitForTimeout(2000 + Math.random() * 2000);
      } catch (e) {
        erros.push({ url: videoUrl, motivo: e.message });
      }
    }

    await page.screenshot({ path: "/app/tiktok-debug.png", fullPage: false });
    await browser.close();
    return res.json({
      status: "ok",
      username: `@${user}`,
      curtidos: curtidos.filter(c => c.status === "curtido").length,
      ja_curtidos: curtidos.filter(c => c.status === "ja_curtido").length,
      erros: erros.length,
      detalhes: { curtidos, erros }
    });
  } catch (error) {
    if (browser) await browser.close();
    console.error(`[TikTok] ERRO curtir: ${error.message}`);
    return res.status(500).json({ status: "erro", mensagem: error.message, username: `@${user}` });
  }
});

// ============================================
// ROTA: VER SCREENSHOT DO TIKTOK
// ============================================
app.get("/tiktok-screenshot", (req, res) => {
  const arquivo = "/app/tiktok-debug.png";
  if (fs.existsSync(arquivo)) res.sendFile(path.resolve(arquivo));
  else res.json({ status: "erro", mensagem: "Screenshot não encontrado." });
});

// ============================================
// ROTA: VER SCREENSHOT DO SHEIN
// ============================================
app.get("/debug-screenshot", (req, res) => {
  const arquivo = "/tmp/shein-debug.png";
  if (fs.existsSync(arquivo)) res.sendFile(path.resolve(arquivo));
  else res.json({ status: "erro", mensagem: "Screenshot não encontrado." });
});

// ============================================
// INICIAR SERVIDOR
// ============================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
