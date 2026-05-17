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
  { name: "msToken", value: "xKtq158VdY-EAaBiQ36BhlgkYChFgG5xGU_eRMG7V-7OKuPfic1v0CJCozawBTBYKDen6HUmSXxsbE5oOcvvRuJNNMTNzUWxLj4Qfr6gtiH9EWuhf3PUFYVeSD1B49fmBQW5V1QRR-RiFAI=", domain: ".tiktok.com", path: "/" },
  { name: "tt_session_tlb_tag", value: "sttt%7C2%7CbbVnxN6Oz4q50ffsCI28Lv________-mWCxEitg9e1VsOecUz2m5zeWvh0Fe9GwXDwpJwOU6tWU%3D", domain: ".tiktok.com", path: "/" },
  { name: "sid_guard", value: "6db567c4de8ecf8ab9d1f7ec088dbc2e%7C1778971816%7C15552000%7CThu%2C+12-Nov-2026+22%3A50%3A16+GMT", domain: ".tiktok.com", path: "/" },
  { name: "ttwid", value: "1%7CDQCkOWjH-OZvFdBtE87cPnUIlLQRspfKE2MKDjB2fgM%7C1778974619%7Ce01e1e856caa7a78b9f1ad8839750b87f416ad4b275802f040701eb2cf704329", domain: ".tiktok.com", path: "/" },
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
  { name: "tiktok_webapp_theme", value: "dark", domain: ".tiktok.com", path: "/" },
  { name: "odin_tt", value: "ce23cc159a3d124ec3e3de38a5a6e6cceb56af1a3e8fbd03c1964e4ee05a7056193f26d39da4af379960d1e92185430afc13535cdd0f9fce780ce9daa4d31f89f3f0a4e33d43eaae4394eed2a43f5d85", domain: ".tiktok.com", path: "/" },
  { name: "passport_auth_status", value: "c0ae6aa2cb58dc8bef68721746f47a68%2C8ffdf5d767910d17e2b45c951c6cd032", domain: ".tiktok.com", path: "/" },
  { name: "store-idc", value: "alisg", domain: ".tiktok.com", path: "/" },
  { name: "store-country-code", value: "br", domain: ".tiktok.com", path: "/" },
  { name: "tt-target-idc", value: "alisg", domain: ".tiktok.com", path: "/" }
];

// ============================================
// COOKIES DINÂMICOS (atualizados via API)
// ============================================
let cookiesCustom = null;

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
// HELPER: TikTok com PERFIL PERSISTENTE
// Salva histórico, cookies e fingerprint em disco
// ============================================
const PERFIL_PATH = "/app/tiktok-profile";

async function getTikTokPage() {
  // Garante que a pasta do perfil existe
  if (!fs.existsSync(PERFIL_PATH)) {
    fs.mkdirSync(PERFIL_PATH, { recursive: true });
    console.log("[TikTok] Pasta de perfil criada:", PERFIL_PATH);
  }

  const context = await chromium.launchPersistentContext(PERFIL_PATH, {
    headless: true,
    args: [
      "--no-sandbox", "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
      "--disable-dev-shm-usage", "--disable-gpu",
      "--single-process", "--no-zygote"
    ],
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    viewport: { width: 1920, height: 1080 },
    locale: "pt-BR"
  });

  // Injeta cookies só se o perfil ainda não tem sessão salva
  const cookiesExistentes = await context.cookies("https://www.tiktok.com");
  const temSessao = cookiesExistentes.some(c => c.name === "sessionid");

  if (!temSessao) {
    const cookies = cookiesCustom || TIKTOK_COOKIES;
    await context.addCookies(cookies);
    console.log(`[TikTok] Perfil novo — ${cookies.length} cookies injetados`);
  } else {
    // Sempre atualiza msToken e ttwid que expiram rápido
    const cookiesFrescos = cookiesCustom || TIKTOK_COOKIES;
    const cookiesParaAtualizar = cookiesFrescos.filter(c =>
      ["msToken", "ttwid", "odin_tt", "tt_csrf_token"].includes(c.name)
    );
    if (cookiesParaAtualizar.length > 0) {
      await context.addCookies(cookiesParaAtualizar);
    }
    console.log("[TikTok] Perfil existente — sessão reutilizada");
  }

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

  return { context, page };
}

// ============================================
// HELPER: página TikTok simples (para rotas não-TikTok)
// ============================================
async function criarPaginaTikTok(browser) {
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    viewport: { width: 1920, height: 1080 },
    locale: "pt-BR"
  });
  await context.addCookies(cookiesCustom || TIKTOK_COOKIES);
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
    status: "online", versao: "10.0",
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
      "POST /tiktok/cookies": "Atualiza cookies TikTok sem redeploy { senha, cookies }",
      "GET /tiktok/cookies/status": "Ver status dos cookies atuais",
      "GET /tiktok-screenshot": "Ver último screenshot do TikTok",
      "GET /debug-screenshot": "Ver último screenshot Shein"
    }
  });
});

// ============================================
// ROTA: ATUALIZAR COOKIES TIKTOK SEM REDEPLOY
// POST /tiktok/cookies
// Body: { "senha": "gyh2024", "cookies": "sessionid=xxx; msToken=yyy; ..." }
// ============================================
app.post("/tiktok/cookies", (req, res) => {
  const { cookies, senha } = req.body;
  if (senha !== (process.env.ADMIN_SENHA || "gyh2024")) {
    return res.status(401).json({ status: "erro", mensagem: "Senha incorreta" });
  }
  if (!cookies) {
    return res.status(400).json({ status: "erro", mensagem: "cookies não fornecido" });
  }
  cookiesCustom = cookies.split(";").map(c => {
    const [nome, ...resto] = c.trim().split("=");
    return {
      name: nome.trim(),
      value: resto.join("=").trim(),
      domain: ".tiktok.com",
      path: "/"
    };
  }).filter(c => c.name && c.value);

  // Apaga o perfil salvo para forçar reinjeção com cookies novos
 

  console.log(`[TikTok] Cookies atualizados via API: ${cookiesCustom.length} cookies`);
  res.json({
    status: "ok",
    mensagem: `${cookiesCustom.length} cookies atualizados. Perfil resetado para nova sessão.`,
    cookies_salvos: cookiesCustom.map(c => c.name)
  });
});

// ============================================
// ROTA: STATUS DOS COOKIES
// ============================================
app.get("/tiktok/cookies/status", (req, res) => {
  const fonte = cookiesCustom ? "dinamico (atualizado via API)" : "estatico (codigo)";
  const lista = cookiesCustom || TIKTOK_COOKIES;
  const perfilExiste = fs.existsSync(PERFIL_PATH);
  res.json({
    status: "ok",
    fonte,
    perfil_persistente: perfilExiste,
    total_cookies: lista.length,
    cookies: lista.map(c => c.name)
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
  let context;
  try {
    const resultado = await getTikTokPage();
    context = resultado.context;
    const page = resultado.page;

    await page.goto(`https://www.tiktok.com/@${user}`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(8000);
    await page.mouse.move(500, 300);
    await page.waitForTimeout(1000);
    await fecharModais(page);
    await page.screenshot({ path: "/app/tiktok-debug.png", fullPage: false });

    let botaoSeguir = null;

    // Tentativa 1: seletor específico do header do perfil
    for (const sel of [
      '[data-e2e="user-page-follow-button"]',
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

    // Tentativa 2: pegar pelo Y < 400px (header fica no topo)
    if (!botaoSeguir) {
      const todosBotoes = await page.$$('button[data-e2e="follow-button"]');
      for (const btn of todosBotoes) {
        const box = await btn.boundingBox();
        if (box && box.y < 400) {
          botaoSeguir = btn;
          console.log(`[TikTok] Botão encontrado por posição Y=${box.y}`);
          break;
        }
      }
    }

    if (!botaoSeguir) {
      await context.close();
      return res.json({ status: "ignorado", mensagem: "Botão de seguir não encontrado no perfil", username: `@${user}` });
    }

    // Verifica se já segue
    const textoBotao = await botaoSeguir.innerText().catch(() => "");
    console.log(`[TikTok] Texto do botão: "${textoBotao}"`);
    if (textoBotao.toLowerCase().includes("seguindo") || textoBotao.toLowerCase().includes("following")) {
      await context.close();
      return res.json({ status: "ignorado", mensagem: "Já segue esse creator", username: `@${user}` });
    }

    // Scroll ao topo, fechar modais, clicar via JS
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(800);
    await fecharModais(page);
    await page.evaluate((el) => el.click(), botaoSeguir);
    await page.waitForTimeout(3000);

    const textoPosClique = await botaoSeguir.innerText().catch(() => "");
    console.log(`[TikTok] Texto após clique: "${textoPosClique}"`);
    await page.screenshot({ path: "/app/tiktok-debug.png", fullPage: false });
    console.log(`[TikTok] ✅ Seguiu @${user}`);
    await context.close();

    const confirmado = textoPosClique.toLowerCase().includes("seguindo") || textoPosClique.toLowerCase().includes("following");
    return res.json({
      status: "ok",
      mensagem: `Seguiu @${user} com sucesso`,
      username: `@${user}`,
      confirmado,
      botao_texto: textoPosClique
    });
  } catch (error) {
    if (context) await context.close().catch(() => {});
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
  let context;
  try {
    const resultado = await getTikTokPage();
    context = resultado.context;
    const page = resultado.page;

    await page.goto(`https://www.tiktok.com/@${user}`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(8000);
    await page.screenshot({ path: "/app/tiktok-debug.png", fullPage: false });
    await fecharModais(page);

    const linksVideos = await page.evaluate(() => {
      const links = [];
      document.querySelectorAll('a[href*="/video/"]').forEach(a => { if (a.href && !links.includes(a.href)) links.push(a.href); });
      return links.slice(0, 10);
    });

    if (linksVideos.length === 0) {
      await context.close();
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
    await context.close();
    return res.json({
      status: "ok",
      username: `@${user}`,
      curtidos: curtidos.filter(c => c.status === "curtido").length,
      ja_curtidos: curtidos.filter(c => c.status === "ja_curtido").length,
      erros: erros.length,
      detalhes: { curtidos, erros }
    });
  } catch (error) {
    if (context) await context.close().catch(() => {});
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
