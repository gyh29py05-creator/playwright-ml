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

// User-agents rotativos sem pacote externo
const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0"
];

function getRandomUA() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

// ============================================
// COOKIES DO TIKTOK
// ============================================
const TIKTOK_COOKIES = [
  { name: "tt_csrf_token", value: "fMWbLlP0-bWNFgfrqY75qGjQbytPs6rzPsDs", domain: ".tiktok.com", path: "/" },
  { name: "tt_chain_token", value: "oe5Yl/GgqqzePSSaHElF8A==", domain: ".tiktok.com", path: "/" },
  { name: "tiktok_webapp_theme", value: "light", domain: ".tiktok.com", path: "/" },
  { name: "delay_guest_mode_vid", value: "5", domain: ".tiktok.com", path: "/" },
  { name: "_ttp", value: "3DRa9EVRr1RMt7h1r6VYkwMNaWx", domain: ".tiktok.com", path: "/" },
  { name: "ttwid", value: "1%7CDQCkOWjH-OZvFdBtE87cPnUIlLQRspfKE2MKDjB2fgM%7C1779027682%7Cdddd86f6c08a1f9b723c828903d7ea59d69f7acdbca9c7de61dcdc45b5d9a687", domain: ".tiktok.com", path: "/" },
  { name: "passport_csrf_token", value: "981f81810312de1423936c841f0b4afe", domain: ".tiktok.com", path: "/" },
  { name: "passport_csrf_token_default", value: "981f81810312de1423936c841f0b4afe", domain: ".tiktok.com", path: "/" },
  { name: "uid_tt", value: "0414977c1e340a04e97450597f97e75584baaa144b59628e16459ca144eb8ff6", domain: ".tiktok.com", path: "/" },
  { name: "uid_tt_ss", value: "0414977c1e340a04e97450597f97e75584baaa144b59628e16459ca144eb8ff6", domain: ".tiktok.com", path: "/" },
  { name: "sid_tt", value: "519dd02c7106b721031c189231aee9bb", domain: ".tiktok.com", path: "/" },
  { name: "sessionid", value: "519dd02c7106b721031c189231aee9bb", domain: ".tiktok.com", path: "/" },
  { name: "sessionid_ss", value: "519dd02c7106b721031c189231aee9bb", domain: ".tiktok.com", path: "/" },
  { name: "sid_guard", value: "519dd02c7106b721031c189231aee9bb%7C1779027677%7C15552000%7CFri%2C+13-Nov-2026+14%3A21%3A17+GMT", domain: ".tiktok.com", path: "/" },
  { name: "multi_sids", value: "7634192487749354497%3A519dd02c7106b721031c189231aee9bb", domain: ".tiktok.com", path: "/" },
  { name: "odin_tt", value: "933414d585ba224a790475d9cb1269e248c03f862db14e20877cd5569c5b372ea2abe0157ae472dfb2a26406db440b5419f9444178e30e0cc98fc39b3267bcea146af0134fa97d7c043a34f75ed98841", domain: ".tiktok.com", path: "/" },
  { name: "msToken", value: "sN2KL6OlEftfMnRgWlNWOelMbjuUfYn3JZn9pvhEGDQkOlFmRr1aU0Fyf-HY9CreDhKRTqAHtCR__2UVO54e96wifJhzK81JHVqAgDi9FJkV2Og1deFOMa-XO_wK85ZWOJa9eS5NPa54UZc=", domain: ".tiktok.com", path: "/" },
  { name: "store-idc", value: "alisg", domain: ".tiktok.com", path: "/" },
  { name: "store-country-code", value: "br", domain: ".tiktok.com", path: "/" },
  { name: "tt-target-idc", value: "alisg", domain: ".tiktok.com", path: "/" },
  { name: "timezone_name", value: "America%2FSao_Paulo", domain: ".tiktok.com", path: "/" },
  { name: "csrf_session_id", value: "0d00ca977216b72d7bedd2025c68cf5d", domain: ".tiktok.com", path: "/" },
  { name: "passport_auth_status", value: "e86acee290e4ce67a49c0e5acb237e26%2C9686ef0d2dea6a15098de7d39cfcffb0", domain: ".tiktok.com", path: "/" },
  { name: "passport_auth_status_ss", value: "e86acee290e4ce67a49c0e5acb237e26%2C9686ef0d2dea6a15098de7d39cfcffb0", domain: ".tiktok.com", path: "/" }
];

// ============================================
// COOKIES SHEIN
// ============================================
const SHEIN_COOKIES = [
  { name: "memberId", value: "1180825914", domain: ".shein.com", path: "/" },
  { name: "AT", value: "MDEwMDE.eyJiIjo3LCJnIjoxNzc4ODgyNzY1LCJyIjoiWmZnQ2pvIiwidCI6MiwibSI6MTE4MDgyNTkxNCwibCI6MTc3ODg4Mjc2NX0.c7e8197dce8ec6cd.3345b7409e3d797c64baf023ec7356f6a80d14db69ba2638e3f090f0a6d18dc3", domain: ".shein.com", path: "/" },
  { name: "sessionID_shein", value: "s%3A7S7sthaovE_Sy9eCpmLnzrOlwWc0Fwmi.37UHrLYj4Eq6Bfxhb4gOBJOuPly4kkpD32FjScputO4", domain: ".shein.com", path: "/" }
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
  if (!response.ok) throw new Error(`Erro token: ${response.status}`);
  const data = await response.json();
  creatorsToken = data.access_token;
  creatorsTokenExpiry = agora + data.expires_in * 1000;
  return creatorsToken;
}

// ============================================
// BROWSER COM ANTI-BOT PESADO
// ============================================
async function abrirBrowser(customConfig = {}) {
  const browser = await chromium.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--single-process"
    ]
  });

  const context = await browser.newContext({
    userAgent: getRandomUA(),
    viewport: { width: 1920, height: 1080 },
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
    extraHTTPHeaders: {
      "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
      "Sec-Ch-Ua": '"Chromium";v="124", "Google Chrome";v="124"',
      "Sec-Ch-Ua-Mobile": "?0",
      "Sec-Ch-Ua-Platform": '"Windows"'
    },
    ...customConfig
  });

  await context.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });
    Object.defineProperty(navigator, "plugins", { get: () => [1, 2, 3, 4, 5] });
    Object.defineProperty(navigator, "languages", { get: () => ["pt-BR", "pt", "en"] });
    window.chrome = { runtime: {} };
  });

  return { browser, context };
}

// ============================================
// DETECÇÃO DE BUGS POR PLATAFORMA
// ============================================
function detectarBugML(item) {
  const titulo = (item.titulo || "").toLowerCase();
  const desconto = parseInt((item.desconto || "").replace(/\D/g, "")) || 0;
  const preco = item.preco || 0;
  const razoes = [];
  if (desconto >= 70) razoes.push(`desconto de ${desconto}% (acima de 70%)`);
  if (titulo.includes("iphone") && preco > 0 && preco < 1800) razoes.push(`iPhone por R$${preco}`);
  if (titulo.includes("notebook") && preco > 0 && preco < 1500) razoes.push(`Notebook por R$${preco}`);
  if (titulo.includes("playstation") && preco > 0 && preco < 2500) razoes.push(`PlayStation por R$${preco}`);
  if (titulo.includes("macbook") && preco > 0 && preco < 3000) razoes.push(`MacBook por R$${preco}`);
  if (titulo.includes("tv") && titulo.includes("55") && preco > 0 && preco < 1200) razoes.push(`TV 55" por R$${preco}`);
  if (titulo.includes("air fryer") && preco > 0 && preco < 80) razoes.push(`Air Fryer por R$${preco}`);
  if (razoes.length === 0) return null;
  return { ...item, plataforma: "mercado_livre", razoes_bug: razoes };
}

function detectarBugAmazon(item) {
  const titulo = (item.titulo || "").toLowerCase();
  const preco = item.preco || 0;
  const razoes = [];
  if (preco <= 0) return null;
  if (titulo.includes("iphone") && preco < 2000) razoes.push(`iPhone por R$${preco}`);
  if (titulo.includes("kindle") && preco < 150) razoes.push(`Kindle por R$${preco}`);
  if (titulo.includes("echo") && titulo.includes("dot") && preco < 60) razoes.push(`Echo Dot por R$${preco}`);
  if ((titulo.includes("notebook") || titulo.includes("laptop")) && preco < 1800) razoes.push(`Notebook por R$${preco}`);
  if (titulo.includes("smartwatch") && preco < 80) razoes.push(`Smartwatch por R$${preco}`);
  if (razoes.length === 0) return null;
  return { ...item, plataforma: "amazon", razoes_bug: razoes };
}

function detectarBugShein(item) {
  const titulo = (item.titulo || "").toLowerCase();
  const preco = item.preco || 0;
  const razoes = [];
  if (preco <= 0) return null;
  if (preco < 5) razoes.push(`Produto por R$${preco}`);
  if ((titulo.includes("vestido") || titulo.includes("dress")) && preco < 15) razoes.push(`Vestido por R$${preco}`);
  if ((titulo.includes("casaco") || titulo.includes("jaqueta")) && preco < 20) razoes.push(`Casaco por R$${preco}`);
  if ((titulo.includes("conjunto") || titulo.includes("set")) && preco < 20) razoes.push(`Conjunto por R$${preco}`);
  if (razoes.length === 0) return null;
  return { ...item, plataforma: "shein", razoes_bug: razoes };
}

// ============================================
// HELPER: EXTRAIR PRODUTOS SHEIN DO DOM
// ============================================
function extrairProdutosSheinDOM(categoriaNome) {
  const items = [];
  const cards = Array.from(document.querySelectorAll("[da-eid]"));
  cards.forEach((card) => {
    try {
      const wrap = card.closest(".bsc-cart-item-mini__wrap") || card;
      const titulo = wrap.querySelector('[class*="name"], [class*="title"]')?.textContent?.trim() || "";
      const precoTexto = wrap.querySelector('[class*="price"]')?.textContent?.trim() || "";
      const preco = parseFloat(precoTexto.replace("R$", "").replace(/\./g, "").replace(",", ".")) || 0;
      const precoOrigTexto = wrap.querySelector('[class*="price-del"], [class*="original-price"]')?.textContent?.trim() || "";
      const preco_original = parseFloat(precoOrigTexto.replace("R$", "").replace(/\./g, "").replace(",", ".")) || 0;
      const desconto = wrap.querySelector('[class*="discount"], [class*="off-percent"]')?.textContent?.trim() || "";
      const vendidos = wrap.querySelector('[class*="sold"], [class*="vendido"]')?.textContent?.trim() || "";
      const avaliacao = wrap.querySelector('[class*="star"], [class*="rate"], [class*="review"]')?.textContent?.trim() || "";
      const badge = wrap.querySelector('[class*="label"], [class*="badge"], [class*="tag"]')?.textContent?.trim() || "";
      const imgEl = wrap.querySelector("img");
      const imgSrc = imgEl?.src || "";
      const idMatch = imgSrc.match(/\/(\d{6,10})_/);
      const goodsId = idMatch ? idMatch[1] : "";
      const link = goodsId ? `https://br.shein.com/p-p-${goodsId}.html` : "";
      if (titulo && preco > 0) {
        items.push({ titulo, preco, preco_original, desconto, vendidos, avaliacao, badge, imagem: imgSrc, link, categoria: categoriaNome || "" });
      }
    } catch (e) {}
  });
  return items;
}

// ============================================
// ROTA: INFO DA API
// ============================================
app.get("/", (req, res) => {
  res.json({
    status: "online",
    versao: "9.0 - Anti-Bot Pesado",
    endpoints: {
      "GET /ofertas": "Busca ofertas do dia (Mercado Livre)",
      "GET /ofertas/:categoria": "Busca ofertas por categoria (ML)",
      "GET /bugs": "Bugs de preço no Mercado Livre",
      "GET /bugs/amazon": "Bugs de preço na Amazon",
      "GET /bugs/shein": "Bugs de preço na Shein",
      "POST /mercado-simples": "Link afiliado ML simples",
      "POST /mercado-oficial": "Link meli.la oficial (ML)",
      "GET /amazon": "Busca ofertas Amazon",
      "POST /amazon-link": "Link afiliado Amazon",
      "POST /amazon-buscar": "Busca via Creators API",
      "POST /amazon-produto": "Detalhes por ASIN",
      "GET /shein": "Busca produtos Shein (categorias curadas)",
      "GET /shein-loja": "Busca produtos de loja Shein (?store_code=XXXX)",
      "POST /shein-link": "Link afiliado Shein",
      "POST /tiktok/seguir": "Segue creator no TikTok",
      "GET /tiktok-screenshot": "Screenshot TikTok",
      "GET /debug-screenshot": "Screenshot Shein"
    }
  });
});

// ============================================
// ROTA: OFERTAS DO DIA - MERCADO LIVRE
// ============================================
app.get("/ofertas", async (req, res) => {
  try {
    console.log("Buscando ofertas ML...");
    const { browser, context } = await abrirBrowser();
    const page = await context.newPage();
    await page.goto("https://www.mercadolivre.com.br/ofertas?category=MLB1574#filter_applied=category&filter_position=4&origin=qcat", { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(3000);
    for (let i = 1; i <= 5; i++) {
      await page.evaluate((s) => window.scrollTo(0, (document.body.scrollHeight / 5) * s), i);
      await page.waitForTimeout(2000);
    }
    const produtos = await page.evaluate(() => {
      const items = [];
      const seletores = ["article", "div[class*='ui-search-result']", "li[class*='ui-search-layout__item']", "div.poly-card"];
      let cards = [];
      for (const sel of seletores) { cards = Array.from(document.querySelectorAll(sel)); if (cards.length > 0) break; }
      cards.forEach((card, index) => {
        try {
          let titulo = "";
          for (const sel of ["h2", "h3", "a[class*='title']", ".poly-component__title"]) {
            const el = card.querySelector(sel);
            if (el && el.textContent.trim()) { titulo = el.textContent.trim(); break; }
          }
          const preco = parseFloat(card.querySelector(".andes-money-amount__fraction, [class*='price-tag-fraction']")?.textContent?.trim().replace(/[^\d,]/g, "").replace(",", ".") || 0);
          const link = card.querySelector("a")?.href || "";
          const imgEl = card.querySelector("img");
          const imagem = imgEl ? (imgEl.src || imgEl.getAttribute("data-src") || "") : "";
          const desconto = card.querySelector("[class*='discount'], [class*='off']")?.textContent?.trim() || "";
          const avaliacao = card.querySelector(".poly-reviews__rating, [class*='reviews__rating']")?.textContent?.trim() || "";
          const qtd_avaliacoes = card.querySelector(".poly-reviews__total, [class*='reviews__total']")?.textContent?.replace(/[()]/g, "").trim() || "";
          const qtd_vendidos = card.querySelector("[class*='sold-quantity'], .poly-component__sold-quantity")?.textContent?.trim() || "";
          const mais_vendido = card.querySelector("[class*='highlight'], .poly-component__highlight, [class*='best-seller']")?.textContent?.trim() || "";
          if (titulo && titulo.length > 3) items.push({ titulo, preco, desconto, avaliacao, qtd_avaliacoes, qtd_vendidos, mais_vendido, link, imagem, posicao: index + 1 });
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
    const { browser, context } = await abrirBrowser();
    const page = await context.newPage();
    await page.goto(`https://www.mercadolivre.com.br/ofertas?container_id=${categoria}`, { waitUntil: "networkidle", timeout: 30000 });
    const produtos = await page.evaluate(() => {
      const items = [];
      const cards = document.querySelectorAll("div.poly-card, li.poly-component__item, div[class*='promotion-item']");
      cards.forEach((card, index) => {
        try {
          const titulo = card.querySelector("h2, h3, [class*='title']")?.textContent?.trim() || "";
          const preco = parseFloat(card.querySelector("[class*='price'], .andes-money-amount__fraction")?.textContent?.trim().replace(/[^\d,]/g, "").replace(",", ".") || 0);
          const avaliacao = card.querySelector(".poly-reviews__rating")?.textContent?.trim() || "";
          const qtd_avaliacoes = card.querySelector(".poly-reviews__total")?.textContent?.replace(/[()]/g, "").trim() || "";
          const qtd_vendidos = card.querySelector("[class*='sold-quantity'], .poly-component__sold-quantity")?.textContent?.trim() || "";
          const mais_vendido = card.querySelector("[class*='highlight'], .poly-component__highlight")?.textContent?.trim() || "";
          const cupom = card.querySelector("[class*='coupon'], [class*='coupon-tag']")?.textContent?.trim() || "";
          const link = card.querySelector("a")?.href || "";
          const imagem = card.querySelector("img")?.src || "";
          if (titulo && link) items.push({ titulo, preco, avaliacao, qtd_avaliacoes, qtd_vendidos, mais_vendido, cupom, link, imagem, posicao: index + 1 });
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
// ROTA: BUGS - MERCADO LIVRE
// ============================================
app.get("/bugs", async (req, res) => {
  try {
    const { browser, context } = await abrirBrowser();
    const page = await context.newPage();
    await page.goto("https://www.mercadolivre.com.br/ofertas?category=MLB1574&filter_applied=category&filter_position=4&origin=qcat", { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(5000);
    const items = await page.$$eval(".promotion-item, .poly-card", (cards) => {
      return cards.map((card, index) => {
        let titulo = "";
        for (const sel of ["h2", "h3", "a[class*='title']", ".poly-component__title"]) {
          const el = card.querySelector(sel);
          if (el && el.textContent.trim()) { titulo = el.textContent.trim(); break; }
        }
        const preco = parseFloat(card.querySelector(".andes-money-amount__fraction, [class*='price-tag-fraction']")?.textContent?.trim().replace(/[^\d]/g, "") || 0);
        const desconto = card.querySelector("[class*='discount'], [class*='off']")?.textContent?.trim() || "";
        const cupom = card.querySelector("[class*='coupon'], [class*='promotion']")?.textContent?.trim() || "";
        const avaliacao = card.querySelector(".poly-reviews__rating")?.textContent?.trim() || "";
        const qtd_avaliacoes = card.querySelector(".poly-reviews__total")?.textContent?.replace(/[()]/g, "").trim() || "";
        const qtd_vendidos = card.querySelector("[class*='sold-quantity'], .poly-component__sold-quantity")?.textContent?.trim() || "";
        const mais_vendido = card.querySelector("[class*='highlight'], .poly-component__highlight")?.textContent?.trim() || "";
        const link = card.querySelector("a")?.href || "";
        const imgEl = card.querySelector("img");
        const imagem = imgEl ? (imgEl.src || imgEl.getAttribute("data-src") || "") : "";
        return { titulo, preco, desconto, cupom, avaliacao, qtd_avaliacoes, qtd_vendidos, mais_vendido, link, imagem, posicao: index + 1 };
      });
    });
    await browser.close();
    const bugs = items.map(detectarBugML).filter(Boolean);
    res.json({ status: "ok", plataforma: "mercado_livre", total_bugs: bugs.length, data_extracao: new Date().toISOString(), bugs });
  } catch (error) {
    res.status(500).json({ status: "erro", mensagem: error.message });
  }
});

// ============================================
// ROTA: BUGS - AMAZON
// ============================================
app.get("/bugs/amazon", async (req, res) => {
  try {
    const { browser, context } = await abrirBrowser();
    const page = await context.newPage();
    const todosItens = [];
    for (const url of ["https://www.amazon.com.br/s?k=eletronicos", "https://www.amazon.com.br/gp/goldbox"]) {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForTimeout(4000);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(2000);
      const itens = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('div[data-component-type="s-search-result"], div[data-asin]')).map((card, index) => {
          const titulo = card.querySelector("h2 a span, h2 span")?.textContent?.trim() || "";
          const preco = parseFloat((card.querySelector(".a-price-whole")?.textContent?.replace(/[^\d]/g, "") || "0") + "." + (card.querySelector(".a-price-fraction")?.textContent?.replace(/[^\d]/g, "") || "00")) || 0;
          const asin = card.getAttribute("data-asin") || "";
          const link = asin ? `https://www.amazon.com.br/dp/${asin}` : "";
          const imagem = card.querySelector("img.s-image")?.src || "";
          const desconto = card.querySelector(".a-badge-text, [class*='savingsPercentage']")?.textContent?.trim() || "";
          if (titulo && asin) return { titulo, preco, desconto, asin, link, imagem, posicao: index + 1 };
          return null;
        }).filter(Boolean);
      });
      todosItens.push(...itens);
    }
    await browser.close();
    const unicos = todosItens.filter((p, i, arr) => arr.findIndex(x => x.asin === p.asin) === i);
    const bugs = unicos.map(detectarBugAmazon).filter(Boolean);
    res.json({ status: "ok", plataforma: "amazon", total_analisados: unicos.length, total_bugs: bugs.length, data_extracao: new Date().toISOString(), bugs });
  } catch (error) {
    res.status(500).json({ status: "erro", mensagem: error.message });
  }
});

// ============================================
// ROTA: BUGS - SHEIN
// ============================================
app.get("/bugs/shein", async (req, res) => {
  try {
    const { categoria = "promocao" } = req.query;
    const urls = { "moda": "https://br.shein.com/Women-Clothing-sc-017172961.html", "promocao": "https://br.shein.com/promotion/flash-sale" };
    const { browser, context } = await abrirBrowser();
    await context.addCookies(SHEIN_COOKIES);
    const page = await context.newPage();
    await page.goto(urls[categoria] || urls["promocao"], { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(8000);
    try { await page.click('[class*="close"], .sui-popup-close', { timeout: 3000 }); } catch (e) {}
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(3000);
    const itens = await page.evaluate(extrairProdutosSheinDOM, "");
    await browser.close();
    const bugs = itens.map(detectarBugShein).filter(Boolean);
    res.json({ status: "ok", plataforma: "shein", categoria, total_analisados: itens.length, total_bugs: bugs.length, data_extracao: new Date().toISOString(), bugs });
  } catch (error) {
    res.status(500).json({ status: "erro", mensagem: error.message });
  }
});

// ============================================
// ROTA: LINK SIMPLES - ML
// ============================================
app.post("/mercado-simples", (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ status: "erro", mensagem: "URL não fornecida" });
  const urlAfiliado = url.includes("?") ? `${url}&tracking_id=ragi6098412` : `${url}?tracking_id=ragi6098412`;
  res.json({ status: "ok", url_original: url, url_afiliado: urlAfiliado });
});

// ============================================
// ROTA: LINK MELI.LA - ML
// ============================================
app.post("/mercado-oficial", async (req, res) => {
  try {
    const { url } = req.body;
    const cookie = process.env.ML_COOKIE || "";
    const response = await fetch("https://www.mercadolivre.com.br/affiliate-program/api/v2/affiliates/createLink", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Cookie": cookie, "User-Agent": "Mozilla/5.0" },
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
// ROTA: OFERTAS AMAZON
// ============================================
app.get("/amazon", async (req, res) => {
  try {
    const { tipo = "todos" } = req.query;
    const { browser, context } = await abrirBrowser();
    const page = await context.newPage();
    async function extrairAmazon(url, origem) {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForTimeout(4000);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(2000);
      return await page.evaluate((origem) => {
        return Array.from(document.querySelectorAll('div[data-component-type="s-search-result"]')).map((card, index) => {
          const titulo = card.querySelector("h2 a span, h2 span")?.textContent?.trim() || "";
          const preco = parseFloat((card.querySelector(".a-price-whole")?.textContent?.replace(/[^\d]/g, "") || "0") + "." + (card.querySelector(".a-price-fraction")?.textContent?.replace(/[^\d]/g, "") || "00")) || 0;
          const asin = card.getAttribute("data-asin") || "";
          const link = asin ? `https://www.amazon.com.br/dp/${asin}` : "";
          const imagem = card.querySelector("img.s-image")?.src || "";
          if (titulo && preco > 0) return { titulo, preco, asin, link, imagem, origem, posicao: index + 1 };
          return null;
        }).filter(Boolean);
      }, origem);
    }
    let produtos = [];
    if (tipo === "nacionais" || tipo === "todos") produtos = [...produtos, ...await extrairAmazon("https://www.amazon.com.br/s?k=casa+cozinha&i=home&rh=p_76%3A11", "nacional")];
    if (tipo === "internacionais" || tipo === "todos") produtos = [...produtos, ...await extrairAmazon("https://www.amazon.com.br/s?k=casa+e+decoracao&i=home", "internacional")];
    await browser.close();
    const unicos = produtos.filter((p, i, arr) => arr.findIndex(x => x.asin === p.asin) === i);
    res.json({ status: "ok", total: unicos.length, data_extracao: new Date().toISOString(), produtos: unicos });
  } catch (error) {
    res.status(500).json({ status: "erro", mensagem: error.message });
  }
});

// ============================================
// ROTA: LINK AFILIADO AMAZON
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
// ROTA: BUSCA - CREATORS API AMAZON
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
    const produtos = (data.SearchResult?.Items || []).map((item, i) => ({
      asin: item.ASIN || "", titulo: item.ItemInfo?.Title?.DisplayValue || "",
      preco: item.OffersV2?.Listings?.[0]?.Price?.Amount || 0,
      preco_formatado: item.OffersV2?.Listings?.[0]?.Price?.DisplayAmount || "",
      imagem: item.Images?.Primary?.Medium?.URL || "",
      url_afiliado: `https://www.amazon.com.br/dp/${item.ASIN}?tag=${AMAZON_TAG}`, posicao: i + 1
    }));
    res.json({ status: "ok", keywords, total: produtos.length, produtos });
  } catch (error) {
    res.status(500).json({ status: "erro", mensagem: error.message });
  }
});

// ============================================
// ROTA: PRODUTO POR ASIN - AMAZON
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
  } catch (error) {
    res.status(500).json({ status: "erro", mensagem: error.message });
  }
});

// ============================================
// ROTA: BUSCAR PRODUTOS SHEIN (categorias curadas)
// ============================================
app.get("/shein", async (req, res) => {
  try {
    const categoriasCuradas = [
      { nome: "exclusive", url: "https://br.shein.com/exclusive/Women-Exclusive-sc-00400092.html" },
      { nome: "linho",     url: "https://br.shein.com/Women-Linen-cat-3007.html?sort=7" },
      { nome: "conjuntos", url: "https://br.shein.com/Women-Two-piece-Outfits-cat-1885.html?sort=7" }
    ];
    const palavrasRuins = ["sutiã", "sutia", "cueca", "lingerie", "calcinha", "push up", "sexy", "capa de celular", "capinha", "triturador", "utensílio", "cozinha"];
    const { browser, context } = await abrirBrowser();
    await context.addCookies(SHEIN_COOKIES);
    const page = await context.newPage();
    const todosProdutos = [];
    for (const cat of categoriasCuradas) {
      await page.goto(cat.url, { waitUntil: "domcontentloaded", timeout: 60000 });
      await page.waitForTimeout(6000);
      try { await page.click('[class*="close"], .sui-popup-close', { timeout: 3000 }); } catch (e) {}
      for (let i = 1; i <= 10; i++) {
        await page.evaluate((s) => window.scrollTo(0, (document.body.scrollHeight / 10) * s), i);
        await page.waitForTimeout(1200);
      }
      await page.waitForTimeout(2000);
      const itens = await page.evaluate(extrairProdutosSheinDOM, cat.nome);
      todosProdutos.push(...itens);
      console.log(`[Shein] ${cat.nome}: ${itens.length} produtos`);
    }
    await page.screenshot({ path: "/tmp/shein-debug.png" });
    await browser.close();
    const linksSeen = new Set();
    const produtos = todosProdutos
      .map((p, i) => ({ ...p, titulo: p.titulo.replace(/\\"/g, '"').replace(/\\/g, "").replace(/\s+/g, " ").trim().substring(0, 80), posicao: i + 1 }))
      .filter(p => !palavrasRuins.some(r => p.titulo.toLowerCase().includes(r)))
      .filter(p => { if (!p.link || linksSeen.has(p.link)) return false; linksSeen.add(p.link); return true; });
    res.json({ status: "ok", categorias_buscadas: categoriasCuradas.map(c => c.nome), total: produtos.length, data_extracao: new Date().toISOString(), produtos });
  } catch (error) {
    res.status(500).json({ status: "erro", mensagem: error.message });
  }
});

// ============================================
// ROTA: BUSCAR PRODUTOS DE UMA LOJA SHEIN
// Uso: GET /shein-loja?store_code=4979185095
// ============================================
app.get("/shein-loja", async (req, res) => {
  try {
    const { store_code } = req.query;
    if (!store_code) return res.status(400).json({ status: "erro", mensagem: "'store_code' obrigatório. Exemplo: /shein-loja?store_code=4979185095" });
    console.log(`[Shein Loja] Buscando store_code: ${store_code}`);
    const { browser, context } = await abrirBrowser();
    await context.addCookies(SHEIN_COOKIES);
    const page = await context.newPage();
    await page.goto(`https://br.shein.com/store/home?store_code=${store_code}&tab=items`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(6000);
    try { await page.click('[class*="close"], .sui-popup-close', { timeout: 3000 }); } catch (e) {}
    for (let i = 1; i <= 12; i++) {
      await page.evaluate((s) => window.scrollTo(0, (document.body.scrollHeight / 12) * s), i);
      await page.waitForTimeout(1000);
    }
    await page.waitForTimeout(3000);
    const itens = await page.evaluate(extrairProdutosSheinDOM, "loja");
    await page.screenshot({ path: "/tmp/shein-debug.png" });
    await browser.close();
    const linksSeen = new Set();
    const produtos = itens
      .map((p, i) => ({ ...p, titulo: p.titulo.replace(/\\"/g, '"').replace(/\\/g, "").replace(/\s+/g, " ").trim().substring(0, 80), posicao: i + 1 }))
      .filter(p => { if (!p.link || linksSeen.has(p.link)) return false; linksSeen.add(p.link); return true; });
    res.json({ status: "ok", store_code, total: produtos.length, data_extracao: new Date().toISOString(), produtos });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "erro", mensagem: error.message });
  }
});

// ============================================
// ROTA: LINK AFILIADO SHEIN
// ============================================
app.post("/shein-link", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ status: "erro", mensagem: "url obrigatória" });
    const response = await fetch("https://m.shein.com/br/affiliate/api/share/link/from/url", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Cookie": "memberId=1180825914; AT=MDEwMDE.eyJiIjo3LCJnIjoxNzc4ODgyNzY1LCJyIjoiWmZnQ2pvIiwidCI6MiwibSI6MTE4MDgyNTkxNCwibCI6MTc3ODg4Mjc2NX0.c7e8197dce8ec6cd.3345b7409e3d797c64baf023ec7356f6a80d14db69ba2638e3f090f0a6d18dc3", "User-Agent": "Mozilla/5.0" },
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
  let browser;
  try {
    const result = await abrirBrowser({ viewport: { width: 1366, height: 768 }, timezoneId: "America/Sao_Paulo" });
    browser = result.browser;
    const page = await result.context.newPage();
    await result.context.addCookies(TIKTOK_COOKIES);
    await page.goto(`https://www.tiktok.com/@${user}`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(8000);
    await page.mouse.move(500, 300);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: "/app/tiktok-debug.png", fullPage: false });
    const titulo = await page.title();
    const urlFinal = page.url();
    const seletores = ['button[data-e2e="follow-button"]', 'button[data-e2e="follow-btn"]', 'button[data-e2e="followBtn"]'];
    let botaoSeguir = null;
    for (const sel of seletores) { botaoSeguir = await page.$(sel); if (botaoSeguir) break; }
    if (!botaoSeguir) {
      const botoes = await page.$$("button");
      for (const btn of botoes) {
        const texto = await btn.innerText().catch(() => "");
        if (texto.toLowerCase() === "seguir" || texto.toLowerCase() === "follow") { botaoSeguir = btn; break; }
      }
    }
    if (!botaoSeguir) { await browser.close(); return res.json({ status: "ignorado", mensagem: "Botão não encontrado", debug: { titulo, urlFinal }, username: `@${user}` }); }
    const textoBotao = await botaoSeguir.innerText();
    if (textoBotao.toLowerCase().includes("seguindo") || textoBotao.toLowerCase().includes("following")) { await browser.close(); return res.json({ status: "ignorado", mensagem: "Já segue", username: `@${user}` }); }
    try { const cc = await page.$('button[aria-label="Close"], [class*="captcha-close"]'); if (cc) { await cc.click(); await page.waitForTimeout(2000); } } catch (e) {}
    await page.evaluate(() => window.scrollBy(0, 200));
    await page.waitForTimeout(1500 + Math.random() * 1500);
    await botaoSeguir.hover();
    await page.waitForTimeout(2000 + Math.random() * 2000);
    await botaoSeguir.click({ delay: 150 });
    await page.waitForTimeout(5000);
    await page.screenshot({ path: "/app/tiktok-debug.png", fullPage: false });
    await browser.close();
    return res.json({ status: "ok", mensagem: `Seguiu @${user} com sucesso`, username: `@${user}` });
  } catch (error) {
    if (browser) await browser.close();
    return res.status(500).json({ status: "erro", mensagem: error.message, username: `@${user}` });
  }
});

// ============================================
// SCREENSHOTS
// ============================================
app.get("/tiktok-screenshot", (req, res) => {
  const f = "/app/tiktok-debug.png";
  if (fs.existsSync(f)) res.sendFile(path.resolve(f));
  else res.json({ status: "erro", mensagem: "Screenshot não encontrado" });
});

app.get("/debug-screenshot", (req, res) => {
  const f = "/tmp/shein-debug.png";
  if (fs.existsSync(f)) res.sendFile(path.resolve(f));
  else res.json({ status: "erro", mensagem: "Screenshot não encontrado" });
});

// ============================================
// INICIAR SERVIDOR
// ============================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor v9.0 Anti-Bot rodando na porta ${PORT}`);
});
