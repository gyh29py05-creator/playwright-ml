// ============================================
// IMPORTS E CONFIGURAÇÃO INICIAL
// ============================================
const express = require("express");
const { chromium } = require("playwright");
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
// COOKIES DO TIKTOK (atualizados)
// ============================================
const TIKTOK_COOKIES = [
  { name: "tt_csrf_token", value: "fMWbLlP0-bWNFgfrqY75qGjQbytPs6rzPsDs", domain: ".tiktok.com", path: "/" },
  { name: "tt_chain_token", value: "oe5Yl/GgqqzePSSaHElF8A==", domain: ".tiktok.com", path: "/" },
  { name: "tiktok_webapp_theme", value: "light", domain: ".tiktok.com", path: "/" },
  { name: "delay_guest_mode_vid", value: "5", domain: ".tiktok.com", path: "/" },
  { name: "_ttp", value: "3DRa9EVRr1RMt7h1r6VYkwMNaWx", domain: ".tiktok.com", path: "/" },
  { name: "ttwid", value: "1%7CDQCkOWjH-OZvFdBtE87cPnUIlLQRspfKE2MKDjB2fgM%7C1778961523%7C8ba8836958689d7509e6e60db7aeddd87648fd8609e9ea7845c2d88c0671c89a", domain: ".tiktok.com", path: "/" },
  { name: "passport_csrf_token", value: "981f81810312de1423936c841f0b4afe", domain: ".tiktok.com", path: "/" },
  { name: "passport_csrf_token_default", value: "981f81810312de1423936c841f0b4afe", domain: ".tiktok.com", path: "/" },
  { name: "uid_tt", value: "dbb7701c10511cb9d30b51dca0b6778f8637ea3dedc7d87a31016e51634f3bbf", domain: ".tiktok.com", path: "/" },
  { name: "uid_tt_ss", value: "dbb7701c10511cb9d30b51dca0b6778f8637ea3dedc7d87a31016e51634f3bbf", domain: ".tiktok.com", path: "/" },
  { name: "sid_tt", value: "8a467d19549eb80092e8e3f593b3ddb3", domain: ".tiktok.com", path: "/" },
  { name: "sessionid", value: "8a467d19549eb80092e8e3f593b3ddb3", domain: ".tiktok.com", path: "/" },
  { name: "sessionid_ss", value: "8a467d19549eb80092e8e3f593b3ddb3", domain: ".tiktok.com", path: "/" },
  { name: "sid_guard", value: "8a467d19549eb80092e8e3f593b3ddb3%7C1778934187%7C15552000%7CThu%2C+12-Nov-2026+12%3A23%3A07+GMT", domain: ".tiktok.com", path: "/" },
  { name: "multi_sids", value: "7634192487749354497%3A8a467d19549eb80092e8e3f593b3ddb3", domain: ".tiktok.com", path: "/" },
  { name: "sid_ucp_v1", value: "1.0.1-KGMzNmVhOTBjNmVmMDQ0NTVkNjRjMDM2Y2Q0ZmU4NDc3ODUyMjdhZTIKIgiBiIaa67OG-WkQq8Oh0AYYswsgDDCus8jPBjgHQPQHSAQQAxoDbXkyIiA4YTQ2N2QxOTU0OWViODAwOTJlOGUzZjU5M2IzZGRiMzJOCiDtfpaagunVwqVoBM25A7r9pIj2v5T7RqFkrR8SjV57YRIg3yte8750JR7E8T8aa3u0THU1IkDFf7VvVChDDE4qHTMYAyIGdGlrdG9r", domain: ".tiktok.com", path: "/" },
  { name: "ssid_ucp_v1", value: "1.0.1-KGMzNmVhOTBjNmVmMDQ0NTVkNjRjMDM2Y2Q0ZmU4NDc3ODUyMjdhZTIKIgiBiIaa67OG-WkQq8Oh0AYYswsgDDCus8jPBjgHQPQHSAQQAxoDbXkyIiA4YTQ2N2QxOTU0OWViODAwOTJlOGUzZjU5M2IzZGRiMzJOCiDtfpaagunVwqVoBM25A7r9pIj2v5T7RqFkrR8SjV57YRIg3yte8750JR7E8T8aa3u0THU1IkDFf7VvVChDDE4qHTMYAyIGdGlrdG9r", domain: ".tiktok.com", path: "/" },
  { name: "tt_session_tlb_tag", value: "sttt%7C1%7CikZ9GVSeuACS6OP1k7Pds__________BewklyPf1DKtTcQlzGzrbQOorRrwF-IdqVUOPW3c3yv4%3D", domain: ".tiktok.com", path: "/" },
  { name: "odin_tt", value: "14a8adcacc53aea3c4ee7ea6cb959dc07b5ac4fc82ecc6278741effd4679d8a0e79aab001ff4ea5239f7edb7da65ce323deb715e7bc5912066eea457d882c93ee79b214542d17d497949a37edcc56d52", domain: ".tiktok.com", path: "/" },
  { name: "msToken", value: "16Ikfmb8PrnLXLeKovrLKgUSCkvaAAUSqbxCgmiIIRhLQ-DDvuXbQXLqdO8Jj3YWO5eZD_gfdn7N4DxBAu6OmGH_joNKl1DufKxRWPWASLWAlbLA3KxfEGw2D7t-b42MSmJ_2sQh4qdAW3c=", domain: ".tiktok.com", path: "/" },
  { name: "store-idc", value: "alisg", domain: ".tiktok.com", path: "/" },
  { name: "store-country-code", value: "br", domain: ".tiktok.com", path: "/" },
  { name: "tt-target-idc", value: "alisg", domain: ".tiktok.com", path: "/" },
  { name: "timezone_name", value: "America%2FSao_Paulo", domain: ".tiktok.com", path: "/" }
];

// ============================================
// TOKEN AMAZON CREATORS API
// ============================================
let creatorsToken = null;
let creatorsTokenExpiry = null;

async function getCreatorsToken() {
  const agora = Date.now();
  if (creatorsToken && creatorsTokenExpiry && agora < creatorsTokenExpiry - 60000) {
    return creatorsToken;
  }
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
    throw new Error(`Erro ao obter token Amazon: ${response.status} - ${erro}`);
  }
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
    executablePath: require("playwright").chromium.executablePath(),
    args: [
     "--no-sandbox",
  "--disable-setuid-sandbox",
  "--disable-blink-features=AutomationControlled",
  "--disable-dev-shm-usage",
  "--disable-gpu",
  "--single-process",
  "--disable-dbus",
  "--no-zygote"
    ]
  });
}

// ============================================
// ROTA: INFO DA API
// ============================================
app.get("/", (req, res) => {
  res.json({
    status: "online",
    versao: "7.0",
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
    console.log("🔄 Buscando ofertas ML...");
    const browser = await abrirBrowser();
    const context = await browser.newContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      viewport: { width: 1920, height: 1080 },
      locale: "pt-BR"
    });
    const page = await context.newPage();
    await page.goto("https://www.mercadolivre.com.br/ofertas", { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(3000);

    for (let i = 1; i <= 5; i++) {
      await page.evaluate((step) => window.scrollTo(0, (document.body.scrollHeight / 5) * step), i);
      await page.waitForTimeout(2000);
    }

    const produtos = await page.evaluate(() => {
      const items = [];
      const seletores = ["article", "div[class*='ui-search-result']", "li[class*='ui-search-layout__item']", "div.poly-card"];
      let cards = [];
      for (const sel of seletores) {
        cards = Array.from(document.querySelectorAll(sel));
        if (cards.length > 0) break;
      }
      cards.forEach((card, index) => {
        try {
          let titulo = "";
          for (const sel of ["h2", "h3", "a[class*='title']", ".poly-component__title"]) {
            const el = card.querySelector(sel);
            if (el && el.textContent.trim()) { titulo = el.textContent.trim(); break; }
          }
          const precoEl = card.querySelector(".andes-money-amount__fraction, [class*='price-tag-fraction']");
          const preco = precoEl ? parseFloat(precoEl.textContent.trim().replace(/[^\d,]/g, "").replace(",", ".")) : 0;
          const linkEl = card.querySelector("a");
          const link = linkEl ? linkEl.href : "";
          const imgEl = card.querySelector("img");
          const imagem = imgEl ? (imgEl.src || imgEl.getAttribute("data-src") || "") : "";
          const descontoEl = card.querySelector("[class*='discount'], [class*='off']");
          const desconto = descontoEl ? descontoEl.textContent.trim() : "";
          if (titulo && titulo.length > 3) {
            items.push({ titulo, preco, desconto, link, imagem, posicao: index + 1 });
          }
        } catch (e) {}
      });
      return items;
    });

    await browser.close();
    res.json({ status: "ok", total: produtos.length, data_extracao: new Date().toISOString(), produtos });
  } catch (error) {
    res.status(500).json({ status: "erro", mensagem: error.message });
  }
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
      const cards = document.querySelectorAll("div.poly-card, li.poly-component__item, div[class*='promotion-item']");
      cards.forEach((card, index) => {
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
  } catch (error) {
    res.status(500).json({ status: "erro", mensagem: error.message });
  }
});

// ============================================
// ROTA: LINK DE AFILIADO SIMPLES - ML
// ============================================
app.post("/mercado-simples", (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ status: "erro", mensagem: "URL não fornecida" });
  const trackingId = "ragi6098412";
  const urlAfiliado = url.includes("?") ? `${url}&tracking_id=${trackingId}` : `${url}?tracking_id=${trackingId}`;
  res.json({ status: "ok", url_original: url, url_afiliado: urlAfiliado });
});

// ============================================
// ROTA: LINK MELI.LA OFICIAL - ML
// ============================================
app.post("/mercado-oficial", async (req, res) => {
  try {
    const { url } = req.body;
    const cookie = process.env.ML_COOKIE || "";
    const response = await fetch("https://www.mercadolivre.com.br/affiliate-program/api/v2/affiliates/createLink", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie": cookie,
        "User-Agent": "Mozilla/5.0"
      },
      body: JSON.stringify({ urls: [url], tag: "ragi6098412" })
    });
    const data = await response.json();
    const shortUrl = data.urls?.[0]?.short_url;
    res.json({ status: "ok", url_original: url, url_afiliado: shortUrl || url });
  } catch (error) {
    res.status(500).json({ status: "erro", mensagem: error.message });
  }
});

// ============================================
// ROTA: BUSCAR OFERTAS AMAZON
// ============================================
app.get("/amazon", async (req, res) => {
  try {
    const { tipo = "todos" } = req.query;
    const browser = await abrirBrowser();
    const context = await browser.newContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      viewport: { width: 1920, height: 1080 },
      locale: "pt-BR"
    });
    const page = await context.newPage();

    async function extrairAmazon(url, origem) {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForTimeout(4000);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(2000);
      return await page.evaluate((origem) => {
        return Array.from(document.querySelectorAll('div[data-component-type="s-search-result"]')).map((card, index) => {
          const titulo = card.querySelector("h2 a span, h2 span")?.textContent?.trim() || "";
          const precoInteiro = card.querySelector(".a-price-whole")?.textContent?.replace(/[^\d]/g, "") || "0";
          const precoFracao = card.querySelector(".a-price-fraction")?.textContent?.replace(/[^\d]/g, "") || "00";
          const preco = parseFloat(`${precoInteiro}.${precoFracao}`) || 0;
          const asin = card.getAttribute("data-asin") || "";
          const link = asin ? `https://www.amazon.com.br/dp/${asin}` : "";
          const imagem = card.querySelector("img.s-image")?.src || "";
          if (titulo && preco > 0) return { titulo, preco, asin, link, imagem, origem, posicao: index + 1 };
          return null;
        }).filter(Boolean);
      }, origem);
    }

    let produtos = [];
    if (tipo === "nacionais" || tipo === "todos") {
      const nacionais = await extrairAmazon("https://www.amazon.com.br/s?k=casa+cozinha&i=home&rh=p_76%3A11", "nacional");
      produtos = [...produtos, ...nacionais];
    }
    if (tipo === "internacionais" || tipo === "todos") {
      const internacionais = await extrairAmazon("https://www.amazon.com.br/s?k=casa+e+decoracao&i=home", "internacional");
      produtos = [...produtos, ...internacionais];
    }

    await browser.close();
    const unicos = produtos.filter((p, i, arr) => arr.findIndex(x => x.asin === p.asin) === i);
    res.json({ status: "ok", total: unicos.length, data_extracao: new Date().toISOString(), produtos: unicos });
  } catch (error) {
    res.status(500).json({ status: "erro", mensagem: error.message });
  }
});

// ============================================
// ROTA: LINK DE AFILIADO AMAZON
// ============================================
app.post("/amazon-link", (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ status: "erro", mensagem: "URL não fornecida" });
  const asinMatch = url.match(/\/dp\/([A-Z0-9]{10})|\/gp\/product\/([A-Z0-9]{10})/);
  const asin = asinMatch ? asinMatch[1] || asinMatch[2] : null;
  const urlAfiliado = asin
    ? `https://www.amazon.com.br/dp/${asin}?tag=${AMAZON_TAG}`
    : `${url}${url.includes("?") ? "&" : "?"}tag=${AMAZON_TAG}`;
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
      body: JSON.stringify({
        keywords, partnerTag: AMAZON_TAG, partnerType: "Associates", searchIndex: categoria,
        itemPage: pagina, itemCount: 10,
        resources: ["itemInfo.title", "offersV2.listings.price", "images.primary.medium", "customerReviews.count", "customerReviews.starRating"],
        marketplace: "www.amazon.com.br", languagesOfPreference: ["pt_BR"]
      })
    });
    const data = await response.json();
    const produtos = (data.SearchResult?.Items || []).map((item, i) => ({
      asin: item.ASIN || "",
      titulo: item.ItemInfo?.Title?.DisplayValue || "",
      preco: item.OffersV2?.Listings?.[0]?.Price?.Amount || 0,
      preco_formatado: item.OffersV2?.Listings?.[0]?.Price?.DisplayAmount || "",
      imagem: item.Images?.Primary?.Medium?.URL || "",
      url_afiliado: `https://www.amazon.com.br/dp/${item.ASIN}?tag=${AMAZON_TAG}`,
      posicao: i + 1
    }));
    res.json({ status: "ok", keywords, total: produtos.length, produtos });
  } catch (error) {
    res.status(500).json({ status: "erro", mensagem: error.message });
  }
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
      body: JSON.stringify({
        itemIds: [asin], partnerTag: AMAZON_TAG, partnerType: "Associates",
        resources: ["itemInfo.title", "offersV2.listings.price", "images.primary.large", "customerReviews.count", "customerReviews.starRating"],
        marketplace: "www.amazon.com.br", languagesOfPreference: ["pt_BR"]
      })
    });
    const data = await response.json();
    const item = data.ItemsResult?.Items?.[0];
    if (!item) return res.json({ status: "aviso", mensagem: "Produto não encontrado", asin });
    res.json({
      status: "ok", asin,
      titulo: item.ItemInfo?.Title?.DisplayValue || "",
      preco: item.OffersV2?.Listings?.[0]?.Price?.Amount || 0,
      preco_formatado: item.OffersV2?.Listings?.[0]?.Price?.DisplayAmount || "",
      imagem: item.Images?.Primary?.Large?.URL || "",
      url_afiliado: `https://www.amazon.com.br/dp/${asin}?tag=${AMAZON_TAG}`
    });
  } catch (error) {
    res.status(500).json({ status: "erro", mensagem: error.message });
  }
});

// ============================================
// ROTA: BUSCAR PRODUTOS SHEIN
// ============================================
app.get("/shein", async (req, res) => {
  try {
    const { categoria = "moda" } = req.query;
    const urls = {
      "moda":           "https://br.shein.com/Women-Clothing-sc-017172961.html",
      "moda-feminina":  "https://br.shein.com/Women-Clothing-sc-017172961.html",
      "moda-masculina": "https://br.shein.com/Men-Clothing-sc-00864889.html",
      "maquiagem":      "https://br.shein.com/Beauty-cat-1954.html?sort=7",
      "aesthetics":     "https://br.shein.com/Women-Y2K-cat-2467.html?sort=7",
      "camisetas":      "https://br.shein.com/Women-Tops-cat-1738.html?sort=7",
      "linho":          "https://br.shein.com/Women-Linen-cat-3007.html?sort=7",
      "casa":           "https://br.shein.com/Home-cat-1766.html?sort=7",
      "promocao":       "https://br.shein.com/promotion/flash-sale"
    };
    const url = urls[categoria] || urls["moda"];

    const browser = await abrirBrowser();
    const context = await browser.newContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      viewport: { width: 1920, height: 1080 },
      locale: "pt-BR"
    });

    await context.addCookies([
      { name: "memberId", value: "1180825914", domain: ".shein.com", path: "/" },
      { name: "AT", value: "MDEwMDE.eyJiIjo3LCJnIjoxNzc4ODgyNzY1LCJyIjoiWmZnQ2pvIiwidCI6MiwibSI6MTE4MDgyNTkxNCwibCI6MTc3ODg4Mjc2NX0.c7e8197dce8ec6cd.3345b7409e3d797c64baf023ec7356f6a80d14db69ba2638e3f090f0a6d18dc3", domain: ".shein.com", path: "/" },
      { name: "sessionID_shein", value: "s%3A7S7sthaovE_Sy9eCpmLnzrOlwWc0Fwmi.37UHrLYj4Eq6Bfxhb4gOBJOuPly4kkpD32FjScputO4", domain: ".shein.com", path: "/" }
    ]);

    const page = await context.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(8000);

    try {
      await page.click('[class*="close"], .sui-popup-close', { timeout: 3000 });
    } catch (e) {}

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await page.waitForTimeout(2000);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: "/tmp/shein-debug.png" });

    const produtos = await page.evaluate(() => {
      const items = [];
      const seletores = ["[da-eid]", ".product-item-v3", ".S-product-item", "div[class*='product-item']"];
      let cards = [];
      for (const sel of seletores) {
        cards = Array.from(document.querySelectorAll(sel));
        if (cards.length > 0) break;
      }
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
  } catch (error) {
    res.status(500).json({ status: "erro", mensagem: error.message });
  }
});

// ============================================
// ROTA: LINK DE AFILIADO SHEIN
// ============================================
app.post("/shein-link", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ status: "erro", mensagem: "url obrigatória" });
    const response = await fetch("https://m.shein.com/br/affiliate/api/share/link/from/url", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie": "memberId=1180825914; AT=MDEwMDE.eyJiIjo3LCJnIjoxNzc4ODgyNzY1LCJyIjoiWmZnQ2pvIiwidCI6MiwibSI6MTE4MDgyNTkxNCwibCI6MTc3ODg4Mjc2NX0.c7e8197dce8ec6cd.3345b7409e3d797c64baf023ec7356f6a80d14db69ba2638e3f090f0a6d18dc3",
        "User-Agent": "Mozilla/5.0"
      },
      body: JSON.stringify({ uid: "1180825914", url })
    });
    const data = await response.json();
    res.json({ status: "ok", data });
  } catch (error) {
    res.status(500).json({ status: "erro", mensagem: error.message });
  }
});

// ============================================
// ROTA: SEGUIR CREATOR NO TIKTOK
// ============================================
app.post("/tiktok/seguir", async (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ status: "erro", mensagem: "username não fornecido" });

  const user = username.startsWith("@") ? username.slice(1) : username;
  const url = `https://www.tiktok.com/@${user}`;

  console.log(`[TikTok] Iniciando: @${user}`);
  let browser;
  try {
    browser = await abrirBrowser();
    const context = await browser.newContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      viewport: { width: 1920, height: 1080 },
      locale: "pt-BR"
    });

    await context.addCookies(TIKTOK_COOKIES);
    const page = await context.newPage();

    await page.addInitScript(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => undefined });
    });

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(4000);
    await page.screenshot({ path: "/app/tiktok-debug.png", fullPage: false });

    const titulo = await page.title();
    const urlFinal = page.url();
    console.log(`[TikTok] Página: ${titulo} | ${urlFinal}`);

    // Tenta encontrar o botão de seguir
    const seletores = [
      'button[data-e2e="follow-button"]',
      'button[data-e2e="follow-btn"]',
      'button[data-e2e="followBtn"]'
    ];

    let botaoSeguir = null;
    for (const sel of seletores) {
      botaoSeguir = await page.$(sel);
      if (botaoSeguir) break;
    }

    // Fallback: busca pelo texto do botão
    if (!botaoSeguir) {
      const botoes = await page.$$("button");
      for (const btn of botoes) {
        const texto = await btn.innerText().catch(() => "");
        if (texto.toLowerCase() === "seguir" || texto.toLowerCase() === "follow") {
          botaoSeguir = btn;
          break;
        }
      }
    }

    if (!botaoSeguir) {
      await browser.close();
      return res.json({
        status: "ignorado",
        mensagem: "Botão de seguir não encontrado — veja o screenshot em /tiktok-screenshot",
        debug: { titulo, urlFinal },
        username: `@${user}`
      });
    }

    const textoBotao = await botaoSeguir.innerText();
    if (textoBotao.toLowerCase().includes("seguindo") || textoBotao.toLowerCase().includes("following")) {
      await browser.close();
      return res.json({ status: "ignorado", mensagem: "Já segue esse creator", username: `@${user}` });
    }

    // Simula comportamento humano antes de clicar
    await page.evaluate(() => window.scrollBy(0, 200 + Math.random() * 200));
    await page.waitForTimeout(1000 + Math.random() * 1500);
    await botaoSeguir.click();
    await page.waitForTimeout(2000);

    console.log(`[TikTok] ✅ Seguiu @${user}`);
    await browser.close();

    return res.json({ status: "ok", mensagem: `Seguiu @${user} com sucesso`, username: `@${user}` });

  } catch (error) {
    if (browser) await browser.close();
    console.error(`[TikTok] ERRO: ${error.message}`);
    return res.status(500).json({ status: "erro", mensagem: error.message, username: `@${user}` });
  }
});

// ============================================
// ROTA: VER SCREENSHOT DO TIKTOK
// ============================================
app.get("/tiktok-screenshot", (req, res) => {
  const arquivo = "/app/tiktok-debug.png";
  if (fs.existsSync(arquivo)) {
    res.sendFile(path.resolve(arquivo));
  } else {
    res.json({ status: "erro", mensagem: "Screenshot não encontrado. Chame /tiktok/seguir primeiro." });
  }
});

// ============================================
// ROTA: VER SCREENSHOT DO SHEIN
// ============================================
app.get("/debug-screenshot", (req, res) => {
  const arquivo = "/tmp/shein-debug.png";
  if (fs.existsSync(arquivo)) {
    res.sendFile(path.resolve(arquivo));
  } else {
    res.json({ status: "erro", mensagem: "Screenshot não encontrado. Chame /shein primeiro." });
  }
});

// ============================================
// INICIAR SERVIDOR
// ============================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
