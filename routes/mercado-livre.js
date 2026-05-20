const express = require("express");
const router = express.Router();

// ====================== FUNÇÕES COMPARTILHADAS (temporário) ======================
// Vamos definir aqui para evitar import circular
function calcularPontuacaoProduto(item) {
  let pontuacao = 0;
  const rating = parseFloat(item.avaliacao) || 0;
  if (rating >= 4.8) pontuacao += 50;
  else if (rating >= 4.5) pontuacao += 35;
  else if (rating >= 4.0) pontuacao += 20;

  const desconto = parseFloat((item.desconto || "").toString().replace(/[^\d.,]/g, "").replace(",", ".")) || 0;
  if (desconto >= 60) pontuacao += 40;
  else if (desconto >= 40) pontuacao += 30;

  const vendidos = parseInt((item.qtd_vendidos || item.vendidos || "").toString().replace(/[^\d]/g, "")) || 0;
  if (vendidos >= 1000) pontuacao += 25;
  else if (vendidos >= 500) pontuacao += 15;

  return Math.min(pontuacao, 150);
}

function classificarProduto(pontuacao) {
  if (pontuacao >= 100) return { nivel: "PREMIUM", emoji: "💎" };
  if (pontuacao >= 70)  return { nivel: "EXCELENTE", emoji: "🌟" };
  if (pontuacao >= 50)  return { nivel: "BOM", emoji: "✅" };
  if (pontuacao >= 30)  return { nivel: "REGULAR", emoji: "⚠️" };
  return { nivel: "BAIXO", emoji: "❌" };
}

// ====================== FUNÇÃO DO BROWSER ======================
async function abrirBrowser() {
  const { chromium } = require("playwright");
  return await chromium.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
      "--disable-dev-shm-usage"
    ]
  });
}

// ====================== ROTAS DO MERCADO LIVRE ======================

router.get("/ofertas/:categoria", async (req, res) => {
  try {
    const { categoria } = req.params;
    const { limite = 25, min_preco = 40 } = req.query;

    const urlsPorCategoria = {
      casa: "https://lista.mercadolivre.com.br/casa-moveis-e-decoracao_OrderId_BESTSELLER_DESC",
      decoracao: "https://lista.mercadolivre.com.br/decoracao_OrderId_BESTSELLER_DESC",
      cozinha: "https://lista.mercadolivre.com.br/cozinha_OrderId_BESTSELLER_DESC",
      organizadores: "https://lista.mercadolivre.com.br/organizadores_OrderId_BESTSELLER_DESC",
      default: `https://lista.mercadolivre.com.br/${categoria}_OrderId_BESTSELLER_DESC`
    };

    const url = urlsPorCategoria[categoria] || urlsPorCategoria.default;
    console.log(`🔄 Buscando ML: ${categoria} → ${url}`);

    const browser = await abrirBrowser();
    const context = await browser.newContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
      viewport: { width: 1366, height: 768 },
      locale: "pt-BR"
    });

    const page = await context.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 120000 });
    await page.waitForTimeout(7000);

    for (let i = 0; i < 12; i++) {
      await page.evaluate(() => window.scrollBy(0, 1600));
      await page.waitForTimeout(1300);
    }

    const produtos = await page.evaluate((minPreco) => {
      const items = [];
      const cards = document.querySelectorAll('li.ui-search-layout__item, article, .andes-card');

      cards.forEach((card) => {
        try {
          const tituloEl = card.querySelector('h2, .poly-component__title, .ui-search-item__title');
          const titulo = tituloEl ? tituloEl.textContent.trim() : "";

          let preco = 0;
          const priceEls = card.querySelectorAll('.andes-money-amount__fraction, .price-tag-fraction, .poly-price__current');
          for (const el of priceEls) {
            const texto = el.textContent.replace(/[^\d,]/g, '').replace(',', '.');
            const valor = parseFloat(texto);
            if (valor > minPreco) {
              preco = valor;
              break;
            }
          }

          const linkEl = card.querySelector('a');
          let link = linkEl ? linkEl.href : "";
          if (link && !link.startsWith("http")) link = "https://www.mercadolivre.com.br" + link;

          if (titulo.length > 20 && preco > minPreco && link.includes("mercadolivre")) {
            items.push({
              titulo: titulo.substring(0, 140),
              preco,
              link: link.split('?')[0],
              imagem: card.querySelector('img')?.src || ""
            });
          }
        } catch (e) {}
      });
      return items;
    }, parseInt(min_preco));

    await browser.close();

    const comPontuacao = produtos.map(p => {
      const pontuacao = calcularPontuacaoProduto(p);
      const classif = classificarProduto(pontuacao);
      return { ...p, pontuacao, nivel: classif.nivel, emoji: classif.emoji };
    }).sort((a, b) => b.pontuacao - a.pontuacao);

    res.json({
      status: "ok",
      categoria,
      total: comPontuacao.length,
      produtos: comPontuacao.slice(0, parseInt(limite))
    });

  } catch (error) {
    console.error("❌ Erro ML:", error.message);
    res.status(500).json({ status: "erro", mensagem: error.message });
  }
});

// Rota de afiliado simples
router.post("/mercado-simples", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ status: "erro", mensagem: "URL não fornecida" });
    
    const trackingId = process.env.ML_TRACKING_ID || "ragi6098412";
    const affiliateUrl = url.includes("?") 
      ? `${url}&tracking_id=${trackingId}` 
      : `${url}?tracking_id=${trackingId}`;
    
    res.json({ status: "ok", url_original: url, url_afiliado: affiliateUrl });
  } catch (error) {
    res.status(500).json({ status: "erro", mensagem: error.message });
  }
});

module.exports = router;
