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
    versao: "3.0",
    endpoints: {
      ofertas: "GET /ofertas - Busca todas as ofertas do dia",
      ofertas_categoria: "GET /ofertas/:categoria - Busca ofertas de uma categoria",
      mercado_simples: "POST /mercado-simples - Gera link de afiliado rápido",
      mercado: "POST /mercado - Gera link de afiliado (tenta encurtar)",
      mercado_oficial: "POST /mercado-oficial - Gera link meli.la oficial"
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
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled'
      ]
    });
    
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      locale: 'pt-BR'
    });
    
    const page = await context.newPage();
    
    console.log("📄 Acessando página de ofertas...");
    await page.goto("https://www.mercadolivre.com.br/ofertas", {
      waitUntil: "domcontentloaded",
      timeout: 30000
    });
    
    await page.waitForTimeout(3000);
    
    console.log("📜 Fazendo scroll na página...");
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight / 2);
    });
    await page.waitForTimeout(2000);
    
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await page.waitForTimeout(2000);
    
    console.log("🔍 Extraindo produtos...");
    
    const produtos = await page.evaluate(() => {
      const items = [];
      
      const possiveisSeletores = [
        'article',
        'div[class*="ui-search-result"]',
        'li[class*="ui-search-layout__item"]',
        'div.poly-card',
        'div[class*="poly-component"]',
        'li.poly-component__item',
        'div[class*="promotion-item"]'
      ];
      
      let todosCards = [];
      
      for (const seletor of possiveisSeletores) {
        const cards = Array.from(document.querySelectorAll(seletor));
        if (cards.length > 0) {
          todosCards = cards;
          break;
        }
      }
      
      todosCards.forEach((card, index) => {
        try {
          // Título
          const possiveisTitulos = [
            'h2', 'h3', 'a[class*="title"]',
            '.poly-component__title',
            '[class*="ui-search-item__title"]',
            'p[class*="promotion-item__title"]'
          ];
          let titulo = '';
          for (const sel of possiveisTitulos) {
            const el = card.querySelector(sel);
            if (el && el.textContent.trim()) {
              titulo = el.textContent.trim();
              break;
            }
          }

          // Preço atual
          const possiveisPrecos = [
            '.andes-money-amount__fraction',
            '[class*="price-tag-fraction"]',
            'span[class*="price"]',
            '.price-tag-amount'
          ];
          let precoTexto = '';
          for (const sel of possiveisPrecos) {
            const els = card.querySelectorAll(sel);
            if (els.length > 0) {
              precoTexto = els[0].textContent.trim();
              break;
            }
          }
          const preco = precoTexto ?
            parseFloat(precoTexto.replace(/[^\d,]/g, '').replace(',', '.')) : 0;

          // Preço original (riscado)
          let precoOriginal = 0;
          const precoOriginalEl = card.querySelector(
            's .andes-money-amount__fraction, ' +
            '.andes-money-amount--previous .andes-money-amount__fraction'
          );
          if (precoOriginalEl) {
            precoOriginal = parseFloat(
              precoOriginalEl.textContent.trim().replace(/[^\d,]/g, '').replace(',', '.')
            );
          }

          // Desconto
          let desconto = '';
          const descontoEl = card.querySelector(
            '[class*="discount"], [class*="off"], .poly-price__discount'
          );
          if (descontoEl) desconto = descontoEl.textContent.trim();

          // Parcelas
          let parcelas = '';
          const parcelasEl = card.querySelector(
            '[class*="installment"], [class*="parcela"], .poly-price__installments'
          );
          if (parcelasEl) parcelas = parcelasEl.textContent.trim();

          // Avaliação
          let avaliacao = 0;
          const avaliacaoEl = card.querySelector(
            '[class*="rating"], .poly-reviews__rating'
          );
          if (avaliacaoEl) {
            avaliacao = parseFloat(avaliacaoEl.textContent.trim()) || 0;
          }

          // Número de reviews
          let numReviews = 0;
          const reviewsEl = card.querySelector(
            '[class*="reviews__total"], [class*="rating__count"]'
          );
          if (reviewsEl) {
            numReviews = parseInt(reviewsEl.textContent.replace(/[^\d]/g, '')) || 0;
          }

          // Cupom
          let cupom = '';
          const cupomEl = card.querySelector('[class*="coupon"], [class*="cupom"]');
          if (cupomEl) cupom = cupomEl.textContent.trim();

          // Frete grátis
          let freteGratis = false;
          const freteEl = card.querySelector('[class*="shipping"], [class*="frete"]');
          if (freteEl) freteGratis = freteEl.textContent.toLowerCase().includes('grátis');

          // Link
          const linkElement = card.querySelector('a');
          const link = linkElement ? linkElement.href : '';

          // Imagem
          const imgElement = card.querySelector('img');
          const imagem = imgElement ?
            (imgElement.src || imgElement.getAttribute('data-src') || '') : '';

          if ((titulo && titulo.length > 3) || (link && link.includes('MLB'))) {
            items.push({
              titulo: titulo || 'Sem título',
              preco: preco,
              preco_original: precoOriginal,
              desconto: desconto,
              parcelas: parcelas,
              avaliacao: avaliacao,
              num_reviews: numReviews,
              cupom: cupom,
              frete_gratis: freteGratis,
              link: link,
              imagem: imagem,
              posicao: index + 1
            });
          }

        } catch (error) {
          console.error(`Erro no card ${index}:`, error.message);
        }
      });
      
      return items;
    });
    
    await browser.close();
    
    console.log(`✅ Extraídos ${produtos.length} produtos`);
    
    if (produtos.length === 0) {
      return res.json({
        status: "aviso",
        total: 0,
        mensagem: "Nenhum produto encontrado.",
        data_extracao: new Date().toISOString(),
        produtos: []
      });
    }
    
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
    const url = `https://www.mercadolivre.com.br/ofertas?container_id=${categoria}`;
    
    await page.goto(url, {
      waitUntil: "networkidle",
      timeout: 30000
    });
    
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

          const parcelasEl = card.querySelector('[class*="installment"], [class*="parcela"]');
          const parcelas = parcelasEl?.textContent?.trim() || '';

          const avaliacaoEl = card.querySelector('[class*="rating"]');
          const avaliacao = avaliacaoEl ? parseFloat(avaliacaoEl.textContent.trim()) || 0 : 0;

          const freteEl = card.querySelector('[class*="shipping"], [class*="frete"]');
          const freteGratis = freteEl ? freteEl.textContent.toLowerCase().includes('grátis') : false;
          
          if (titulo && link && link.includes('mercadolivre.com')) {
            items.push({
              titulo,
              preco,
              desconto: desconto || '',
              parcelas,
              avaliacao,
              frete_gratis: freteGratis,
              link,
              imagem: imagem || '',
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
    
    res.json({
      status: "ok",
      categoria,
      total: produtos.length,
      data_extracao: new Date().toISOString(),
      produtos
    });
    
  } catch (error) {
    res.status(500).json({ status: "erro", mensagem: error.message });
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
        mensagem: "URL do produto não fornecida"
      });
    }
    
    if (!url.includes("mercadolivre.com") && !url.includes("mercadolibre.com")) {
      return res.status(400).json({
        status: "erro",
        mensagem: "URL inválida - deve ser do Mercado Livre"
      });
    }
    
    const trackingId = "ragi6098412";
    const affiliateUrl = url.includes('?') 
      ? `${url}&tracking_id=${trackingId}`
      : `${url}?tracking_id=${trackingId}`;
    
    res.json({
      status: "ok",
      url_original: url,
      url_afiliado: affiliateUrl,
      tracking_id: trackingId,
      mensagem: "Link de afiliado gerado com sucesso!"
    });
    
  } catch (error) {
    res.status(500).json({ status: "erro", mensagem: error.message });
  }
});

// ============================================
// ENDPOINT: GERAR LINK DE AFILIADO (PLAYWRIGHT)
// ============================================
app.post("/mercado", async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ status: "erro", mensagem: "URL não fornecida" });
    }
    
    const trackingId = "ragi6098412";
    const affiliateUrl = url.includes('?') 
      ? `${url}&tracking_id=${trackingId}`
      : `${url}?tracking_id=${trackingId}`;
    
    try {
      const browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const context = await browser.newContext();
      const page = await context.newPage();
      
      await page.goto("https://www.mercadolivre.com.br/afiliados/linkbuilder#hub", {
        timeout: 15000
      });
      
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
      
      if (shortened && shortened.urls && shortened.urls[0]) {
        return res.json({
          status: "ok",
          url_original: url,
          url_afiliado: shortened.urls[0].short_url || affiliateUrl,
          url_encurtada: shortened.urls[0].short_url,
          tracking_id: trackingId
        });
      }
    } catch (e) {
      console.log("⚠️ Não conseguiu encurtar");
    }
    
    res.json({
      status: "ok",
      url_original: url,
      url_afiliado: affiliateUrl,
      tracking_id: trackingId,
      mensagem: "Link gerado (não encurtado)"
    });
    
  } catch (error) {
    res.status(500).json({ status: "erro", mensagem: error.message });
  }
});

// ============================================
// ENDPOINT: GERAR LINK MELI.LA OFICIAL
// ============================================
app.post('/mercado-oficial', async (req, res) => {
  try {
    const { url } = req.body;
    const cookie = process.env.ML_COOKIE || 'csrf=yHldMI9A8raqm9WK2o_myOL6; c_ZxMWlg=1; _gcl_au=1.1.2007922877.1778589211; _fbp=fb.2.1778589211799.39438627338921838; _d2id=34dc6885-4bb8-4149-bb1e-576c0a36e2b7; ssid=ghy-051208-k6Le3ZB9MT5mznUsFBMrMnfgQX9iAO-__-233446147-__-1873283683471--RRR_0-RRR_0; orguseridp=233446147; orgnickp=RAGI6098412; ftid=Hzlq3Cx3hajDZwktIqq9W3B6IS03FUlV-1778589214099; orguserid=0ZHZH7TTt0Th; cookiesPreferencesLoggedFallback=%7B%22userId%22%3A233446147%2C%22categories%22%3A%7B%22advertising%22%3Atrue%2C%22functionality%22%3Anull%2C%22performance%22%3Anull%2C%22traceability%22%3Anull%7D%7D; cookiesPreferencesNotLogged=%7B%22categories%22%3A%7B%22advertising%22%3Atrue%2C%22functionality%22%3Anull%2C%22performance%22%3Anull%2C%22traceability%22%3Anull%7D%7D; cp=14403500; ml_cart-quantity=1; ml_selected_locale=pt-BR; orgnickp=RAGI6098412; nsa_rotok=eyJhbGciOiJSUzI1NiIsImtpZCI6IjMiLCJ0eXAiOiJKV1QifQ.eyJpZGVudGlmaWVyIjoiODg0MWEwMWItMDQ4ZS00ODk1LWIyYWItMzBmY2JjYjIxMjk1Iiwicm90YXRpb25faWQiOiJlM2Q4MWM0OC03NWE2LTQwOGEtODdkYy0xMDQ5NmU3MDQ3MjciLCJwbGF0Zm9ybSI6Ik1MIiwicm90YXRpb25fZGF0ZSI6MTc3ODYyOTg3MywiZXhwIjoxNzgxMjIxMjczLCJqdGkiOiIwOTU5MDA4OS00NjVhLTRkMDYtODA2Mi05ZWZjNWVjODNiZDUiLCJpYXQiOjE3Nzg2MjkyNzMsInN1YiI6Ijg4NDFhMDFiLTA0OGUtNDg5NS1iMmFiLTMwZmNiY2IyMTI5NSJ9.fuuH_XSiAzNy88UplU1wa1abhNMDPhoBi6xsLDLQ_vJx9Vj9Z-N3JSOAlCzAYtuWl_wafdbCVe3u3lv_sPwzLKuuzd_1HZiW3IHC5QwIDF5Lffkr_zNpUHxMN1BawveV4siohsYOsC5mPYOI10TolY07DFnNopzDMTSYtkFQGoK0dl-0sbBRyYbG19UOQo8TMT0qZNh0bAEAYEy3N1Vu4AXnF9pwLXiha5s6y2rJP3ipKgtppIaKjTDPz_znqSvFTzohz256IEVdtRKlg7l1wKxqHXAmztdWLPhyrI70UVixyJL2vqrY9Kb7ChiQIMbG1fO2aq62Lsqs22uSvRK-3Q; tooltip=true; hide-cookie-banner=233446147-COOKIE_PREFERENCES_ALREADY_SET';
    
    const response = await fetch('https://www.mercadolivre.com.br/affiliate-program/api/v2/affiliates/createLink', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookie,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      body: JSON.stringify({
        urls: [url],
        tag: 'ragi6098412'
      })
    });
    
    const data = await response.json();
    const shortUrl = data.urls?.[0]?.short_url;
    
    res.json({
      status: 'ok',
      url_original: url,
      url_afiliado: shortUrl || url,
      meli_la: shortUrl
    });
    
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

// ============================================
// INICIAR SERVIDOR
// ============================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);
  console.log(`\n📋 Endpoints disponíveis:`);
  console.log(`   GET  /                - Info da API`);
  console.log(`   GET  /ofertas         - Buscar ofertas do dia`);
  console.log(`   GET  /ofertas/:cat    - Buscar ofertas por categoria`);
  console.log(`   POST /mercado-simples - Gerar link de afiliado`);
  console.log(`   POST /mercado         - Gerar link (tenta encurtar)`);
  console.log(`   POST /mercado-oficial - Gerar link meli.la oficial`);
});
