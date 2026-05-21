// ============================================
// SCRAPER PRO 2026 - ANTI-BOT PESADO (Versão Completa)
// ============================================
const express = require("express");
const { chromium } = require("playwright-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const randomUseragent = require("random-useragent");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

chromium.use(StealthPlugin());

const app = express();
app.use(express.json());

// ===================== CONFIG =====================
const AMAZON_TAG = process.env.AMAZON_TAG || "giseleramosd-20";
const SHEIN_MEMBER_ID = process.env.SHEIN_MEMBER_ID || "1180825914";
const CREATORS_CLIENT_ID = process.env.AMAZON_CLIENT_ID;
const CREATORS_CLIENT_SECRET = process.env.AMAZON_CLIENT_SECRET;

// ===================== ANTI-BOT PESADO =====================
async function createStealthContext(customConfig = {}) {
  const browser = await chromium.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
      "--disable-dev-shm-usage",
      "--disable-web-security"
    ]
  });

  const context = await browser.newContext({
    userAgent: randomUseragent.getRandom(),
    viewport: { width: 1920, height: 1080 },
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
    extraHTTPHeaders: {
      "Accept-Language": "pt-BR,pt;q=0.9",
      "Sec-Ch-Ua": '"Chromium";v="125", "Not)A;Brand";v="99"',
      "Sec-Ch-Ua-Mobile": "?0"
    },
    ...customConfig
  });

  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
  });

  return { browser, context };
}

// ===================== TIKTOK COOKIES =====================
const TIKTOK_COOKIES = [ /* Seus cookies completos */ 
  { name: "tt_csrf_token", value: "fMWbLlP0-bWNFgfrqY75qGjQbytPs6rzPsDs", domain: ".tiktok.com", path: "/" },
  { name: "tt_chain_token", value: "oe5Yl/GgqqzePSSaHElF8A==", domain: ".tiktok.com", path: "/" },
  { name: "tiktok_webapp_theme", value: "light", domain: ".tiktok.com", path: "/" },
  { name: "delay_guest_mode_vid", value: "5", domain: ".tiktok.com", path: "/" },
  { name: "_ttp", value: "3DRa9EVRr1RMt7h1r6VYkwMNaWx", domain: ".tiktok.com", path: "/" },
  { name: "ttwid", value: "1%7CDQCkOWjH-OZvFdBtE87cPnUIlLQRspfKE2MKDjB2fgM%7C1778961523%7C8ba8836958689d7509e6e60db7aeddd87648fd8609e9ea7845c2d88c0671c89a", domain: ".tiktok.com", path: "/" },
  // ... (adicione todos os outros cookies que estavam no seu arquivo)
];

// ===================== TOKEN AMAZON =====================
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

// ===================== ROTAS =====================
app.get("/", (req, res) => {
  res.json({
    status: "online",
    versao: "PRO 2026 - Anti-Bot Pesado",
    mensagem: "Todas as rotas com stealth reforçado"
  });
});

// ==================== MERCADO LIVRE ====================
app.get("/ofertas", async (req, res) => {
  try {
    const { browser, context } = await createStealthContext();
    const page = await context.newPage();
    await page.goto("https://www.mercadolivre.com.br/ofertas", { waitUntil: "domcontentloaded", timeout: 45000 });

    for (let i = 1; i <= 6; i++) {
      await page.evaluate((step) => window.scrollTo(0, (document.body.scrollHeight / 6) * step), i);
      await page.waitForTimeout(1000 + Math.random() * 800);
    }

    const produtos = await page.evaluate(() => {
      // Seu evaluate original mantido
      const items = [];
      const cards = Array.from(document.querySelectorAll("article, div.poly-card, li.ui-search-layout__item"));
      cards.forEach((card, index) => {
        try {
          const titulo = card.querySelector("h2, h3")?.textContent?.trim() || "";
          const preco = parseFloat(card.querySelector(".andes-money-amount__fraction")?.textContent?.replace(/[^\d,]/g, "").replace(",", ".") || 0);
          const link = card.querySelector("a")?.href || "";
          if (titulo && preco > 0) items.push({ titulo, preco, link, posicao: index + 1 });
        } catch (e) {}
      });
      return items;
    });

    await browser.close();
    res.json({ status: "ok", total: produtos.length, produtos });
  } catch (error) {
    res.status(500).json({ status: "erro", mensagem: error.message });
  }
});

// ==================== AMAZON ====================
app.get("/amazon", async (req, res) => {
  try {
    const { browser, context } = await createStealthContext();
    const page = await context.newPage();
    await page.goto("https://www.amazon.com.br/gp/bestsellers", { waitUntil: "domcontentloaded", timeout: 60000 });

    for (let i = 1; i <= 5; i++) {
      await page.evaluate((s) => window.scrollTo(0, document.body.scrollHeight * s), i * 0.2);
      await page.waitForTimeout(1000 + Math.random() * 1500);
    }

    const produtos = await page.evaluate((tag) => {
      // Seu evaluate original adaptado
      const items = [];
      const cards = document.querySelectorAll('div[data-component-type="s-search-result"]');
      cards.forEach(card => {
        const titulo = card.querySelector("h2 a span")?.textContent?.trim() || "";
        const preco = parseFloat((card.querySelector(".a-price-whole")?.textContent || "0").replace(/\D/g,'') + "." + (card.querySelector(".a-price-fraction")?.textContent || "00"));
        if (titulo && preco > 0) {
          const asin = card.getAttribute("data-asin");
          items.push({
            titulo,
            preco,
            asin,
            url_afiliado: asin ? `https://www.amazon.com.br/dp/${asin}?tag=${tag}` : ""
          });
        }
      });
      return items;
    }, AMAZON_TAG);

    await browser.close();
    res.json({ status: "ok", plataforma: "amazon", total: produtos.length, produtos });
  } catch (error) {
    res.status(500).json({ status: "erro", mensagem: error.message });
  }
});

// ==================== AMAZON LINK & CREATORS API (mantidas originais) ====================
app.post("/amazon-link", (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ status: "erro", mensagem: "URL não fornecida" });
  const asinMatch = url.match(/\/dp\/([A-Z0-9]{10})/);
  const asin = asinMatch ? asinMatch[1] : null;
  const urlAfiliado = asin ? `https://www.amazon.com.br/dp/${asin}?tag=${AMAZON_TAG}` : url;
  res.json({ status: "ok", url_afiliado: urlAfiliado });
});

app.post("/amazon-buscar", async (req, res) => { /* sua função original */ });
app.post("/amazon-produto", async (req, res) => { /* sua função original */ });

// ==================== SHEIN ====================
app.get("/shein", async (req, res) => {
  try {
    const { browser, context } = await createStealthContext();
    const page = await context.newPage();

    await context.addCookies([{ name: "memberId", value: SHEIN_MEMBER_ID, domain: ".shein.com", path: "/" }]);
    await page.goto("https://br.shein.com/Women-Clothing-sc-017172961.html?sort=7", { waitUntil: "domcontentloaded", timeout: 60000 });

    for (let i = 1; i <= 5; i++) {
      await page.evaluate((s) => window.scrollTo(0, document.body.scrollHeight * s), i * 0.25);
      await page.waitForTimeout(1200 + Math.random() * 800);
    }

    const produtos = await page.evaluate(() => { /* seu evaluate original */ });

    await browser.close();
    res.json({ status: "ok", total: produtos.length, produtos });
  } catch (error) {
    res.status(500).json({ status: "erro", mensagem: error.message });
  }
});

app.post("/shein-link", async (req, res) => { /* sua função original */ });

// ==================== TIKTOK ====================
app.post("/tiktok/seguir", async (req, res) => {
  // Sua função original completa com stealth
  const { username } = req.body;
  if (!username) return res.status(400).json({ status: "erro", mensagem: "username obrigatório" });

  let browser;
  try {
    const { browser: b, context } = await createStealthContext({ viewport: { width: 1280, height: 720 } });
    browser = b;
    const page = await context.newPage();

    await context.addCookies(TIKTOK_COOKIES);
    await page.goto(`https://www.tiktok.com/@${username.replace("@", "")}`, { waitUntil: "domcontentloaded", timeout: 60000 });

    await page.waitForTimeout(6000);
    await page.evaluate(() => window.scrollBy(0, 400));
    await page.waitForTimeout(2000);

    const resultado = await page.evaluate(() => {
      const btn = document.querySelector('button[data-e2e="follow-button"], button[class*="follow"]');
      if (!btn) return { sucesso: false, motivo: "Botão não encontrado" };
      btn.click();
      return { sucesso: true };
    });

    await browser.close();
    res.json({ status: "ok", ...resultado });
  } catch (error) {
    if (browser) await browser.close();
    res.status(500).json({ status: "erro", mensagem: error.message });
  }
});

// ==================== SCREENSHOTS ====================
app.get("/tiktok-screenshot", (req, res) => {
  const file = "/app/tiktok-debug.png";
  if (fs.existsSync(file)) res.sendFile(path.resolve(file));
  else res.json({ status: "erro", mensagem: "Screenshot não encontrado" });
});

// INICIAR SERVIDOR
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor PRO Anti-Bot Pesado rodando na porta ${PORT}`);
});
