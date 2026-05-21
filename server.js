// ============================================
// SCRAPER PRO - TODAS AS PLATAFORMAS (2026)
// ============================================
require("dotenv").config();
const express = require("express");
const { chromium } = require("playwright-extra");
const stealth = require("puppeteer-extra-plugin-stealth")();
const randomUseragent = require("random-useragent");

chromium.use(stealth);

const app = express();
app.use(express.json());

// ===================== CONFIG =====================
const AMAZON_TAG = process.env.AMAZON_TAG || "giseleramosd-20";
const SHEIN_MEMBER_ID = process.env.SHEIN_MEMBER_ID || "1180825914";
const SHOPEE_AFFILIATE = process.env.SHOPEE_AFFILIATE || "";
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || "";

// ===================== STEALTH CONTEXT =====================
async function createStealthBrowser() {
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
      "Sec-Ch-Ua-Mobile": "?0",
      "Sec-Ch-Ua-Platform": '"Windows"'
    }
  });

  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
  });

  return { browser, context };
}

// ===================== FUNÇÕES AUXILIARES (mantidas e melhoradas) =====================
function calcularPontuacaoProduto(item) { /* sua função original */ 
  // ... (copie sua função original aqui)
  let pontuacao = 0;
  // (implementação completa da sua versão anterior)
  return Math.min(pontuacao, 150);
}

function classificarProduto(pontuacao) { /* sua função original */ }

// ===================== AMAZON =====================
app.get("/amazon", async (req, res) => {
  try {
    const limite = parseInt(req.query.limite) || 30;
    const minAvaliacao = parseFloat(req.query.min_avaliacao) || 4.3;

    const { browser, context } = await createStealthBrowser();
    const page = await context.newPage();
    
    await page.goto("https://www.amazon.com.br/gp/bestsellers", { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(3000);

    // Scroll humano
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => window.scrollBy(0, window.innerHeight * 0.8));
      await page.waitForTimeout(800 + Math.random() * 700);
    }

    const produtos = await page.evaluate((tag) => {
      const items = [];
      const cards = document.querySelectorAll("div.zg-grid-general, div[data-component-type='s-search-result']");

      cards.forEach(card => {
        const titulo = card.querySelector("h2 a span, .p13n-sc-truncated")?.textContent?.trim();
        if (!titulo) return;

        const precoEl = card.querySelector(".a-price:not(.a-text-price)");
        const preco = parseFloat(
          (precoEl?.querySelector(".a-price-whole")?.textContent || "0").replace(/\D/g,'') + "." +
          (precoEl?.querySelector(".a-price-fraction")?.textContent || "00")
        );

        const preco_original = parseFloat(card.querySelector(".a-text-price .a-offscreen")?.textContent?.replace(/[^\d,]/g,'').replace(',','.') || 0);

        if (preco > 0) {
          items.push({
            titulo,
            preco,
            preco_original: preco_original > preco ? preco_original : 0,
            desconto: preco_original > preco ? `-${Math.round(((preco_original - preco)/preco_original)*100)}%` : "",
            avaliacao: parseFloat(card.querySelector(".a-icon-alt")?.textContent?.split(" ")[0]?.replace(',','.') || 0),
            num_reviews: parseInt(card.querySelector("span.a-size-base")?.textContent?.replace(/\D/g,'') || 0),
            link: card.querySelector("a")?.href || "",
            asin: card.getAttribute("data-asin"),
            url_afiliado: `https://www.amazon.com.br/dp/${card.getAttribute("data-asin")}?tag=${tag}`
          });
        }
      });
      return items;
    }, AMAZON_TAG);

    await browser.close();

    const filtrados = produtos.filter(p => p.avaliacao >= minAvaliacao);
    filtrados.sort((a,b) => b.avaliacao * (b.num_reviews || 1) - a.avaliacao * (a.num_reviews || 1));

    res.json({ status: "ok", plataforma: "amazon", total: filtrados.length, produtos: filtrados.slice(0, limite) });
  } catch (e) {
    res.status(500).json({ status: "erro", mensagem: e.message });
  }
});

// ===================== MERCADO LIVRE =====================
app.get("/mercadolivre", async (req, res) => {
  try {
    const limite = parseInt(req.query.limite) || 30;
    const { browser, context } = await createStealthBrowser();
    const page = await context.newPage();

    await page.goto("https://lista.mercadolivre.com.br/_OrderId_BESTSELLER_DESC_NoIndex_True", {
      waitUntil: "domcontentloaded"
    });

    await page.waitForTimeout(4000);

    const produtos = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("li.ui-search-layout__item")).map((item, i) => {
        const titulo = item.querySelector("h2")?.textContent?.trim();
        const preco = parseFloat(item.querySelector(".andes-money-amount__fraction")?.textContent?.replace(/\./g,'').replace(',','.') || 0);
        const link = item.querySelector("a")?.href;
        const avaliacao = parseFloat(item.querySelector(".andes-rating__average")?.textContent || 0);

        return { titulo, preco, link, avaliacao, posicao: i+1 };
      }).filter(p => p.titulo && p.preco > 0);
    });

    await browser.close();

    res.json({ status: "ok", plataforma: "mercadolivre", total: produtos.length, produtos: produtos.slice(0, limite) });
  } catch (e) {
    res.status(500).json({ status: "erro", mensagem: e.message });
  }
});

// ===================== SHOPEE, SHEIN, BUGS, LINKS, IA (manter sua lógica original) =====================
app.get("/shopee", /* sua função original melhorada */ async (req, res) => { /* ... */ });
app.get("/shein", /* sua função original */ async (req, res) => { /* ... */ });
app.get("/shein/lojas-exclusivas", /* ... */ );

// Bugs
app.get("/bugs/amazon", /* ... */);
app.get("/bugs/shopee", /* ... */);
app.get("/bugs/shein", /* ... */);

// Links de afiliado
app.post("/amazon-link", /* sua função original */);
app.post("/shopee-link", /* ... */);
app.post("/shein-link", /* ... */);

// IA
app.post("/gerar-mensagem", /* sua função com Claude */);
app.post("/analisar-produtos", /* ... */);

// TikTok
app.post("/tiktok/seguir", /* ... */);

// Root
app.get("/", (req, res) => {
  res.json({
    status: "online",
    versao: "PRO 2026 - Anti-Bot",
    endpoints: {
      "/amazon": "Melhores da Amazon",
      "/mercadolivre": "Best Sellers ML",
      "/shopee": "Flash Sale Shopee",
      "/shein": "Shein Trending",
      "/bugs/*": "Detecção de bugs de preço",
      // ... outros
    }
  });
});

// ===================== INICIAR =====================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor PRO rodando na porta ${PORT}`);
  console.log(`✅ Amazon | Mercado Livre | Shopee | Shein`);
});
