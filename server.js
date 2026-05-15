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

// Carrega variáveis de ambiente do arquivo .env
require('dotenv').config();

const CREATORS_CLIENT_ID = process.env.AMAZON_CLIENT_ID;
const CREATORS_CLIENT_SECRET = process.env.AMAZON_CLIENT_SECRET;
const AMAZON_TAG = process.env.AMAZON_TAG || "giseleramosd-20";

// Validação: verifica se as credenciais foram carregadas
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

  // Reutiliza token se ainda válido (com 60s de margem)
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
  creatorsTokenExpiry = agora + (data.expires_in * 1000); // expires_in em segundos

  console.log("✅ Token Creators API obtido com sucesso");
  return creatorsToken;
}

// ============================================
// ROTA PRINCIPAL - INFO DA API
// ============================================
app.get("/", (req, res) => {
  res.json({
    status: "online",
    mensagem: "Playwright API - Sistema de Afiliados ML + Amazon",
    versao: "5.0",
    endpoints: {
      ofertas: "GET /ofertas - Busca todas as ofertas do dia (ML)",
      ofertas_categoria: "GET /ofertas/:categoria - Busca ofertas de uma categoria (ML)",
      mercado_simples: "POST /mercado-simples - Gera link de afiliado rápido (ML)",
      mercado: "POST /mercado - Gera link de afiliado (tenta encurtar) (ML)",
      mercado_oficial: "POST /mercado-oficial - Gera link meli.la oficial (ML)",
      amazon: "GET /amazon - Busca ofertas Amazon (Casa/Cozinha/Bem-estar)",
      amazon_link: "POST /amazon-link - Gera link de afiliado Amazon",
      amazon_buscar: "POST /amazon-buscar - Busca produtos via Creators API",
      amazon_produto: "POST /amazon-produto - Pega detalhes de produto por ASIN via Creators API"
    },
    exemplos: {
      ofertas_geral: "GET /ofertas",
      ofertas_eletronicos: "GET /ofertas/MLB779535-1",
      gerar_link_ml: "POST /mercado-simples com body: {\"url\":\"https://produto...\"}",
      amazon_ofertas: "GET /amazon",
      amazon_link: "POST /amazon-link com body: {\"url\":\"https://www.amazon.com.br/produto...\"}",
      amazon_buscar: "POST /amazon-buscar com body: {\"keywords\":\"air fryer\"}",
      amazon_produto: "POST /amazon-produto com body: {\"asin\":\"B08N5WRWNW\"}"
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

          let desconto = '';
          const descontoEl = card.querySelector(
            '[class*="discount"], [class*="off"], .poly-price__discount'
          );
          if (descontoEl) desconto = descontoEl.textContent.trim();

          let parcelas = '';
          const parcelasEl = card.querySelector(
            '[class*="installment"], [class*="parcela"], .poly-price__installments'
          );
          if (parcelasEl) parcelas = parcelasEl.textContent.trim();

          let avaliacao = 0;
          const avaliacaoEl = card.querySelector(
            '[class*="rating"], .poly-reviews__rating'
          );
          if (avaliacaoEl) {
            avaliacao = parseFloat(avaliacaoEl.textContent.trim()) || 0;
          }

          let numReviews = 0;
          const reviewsEl = card.querySelector(
            '[class*="reviews__total"], [class*="rating__count"]'
          );
          if (reviewsEl) {
            numReviews = parseInt(reviewsEl.textContent.replace(/[^\d]/g, '')) || 0;
          }

          let cupom = '';
          const cupomEl = card.querySelector('[class*="coupon"], [class*="cupom"]');
          if (cupomEl) cupom = cupomEl.textContent.trim();

          let freteGratis = false;
          const freteEl = card.querySelector('[class*="shipping"], [class*="frete"]');
          if (freteEl) freteGratis = freteEl.textContent.toLowerCase().includes('grátis');

          const linkElement = card.querySelector('a');
          const link = linkElement ? linkElement.href : '';

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
// ENDPOINT: BUSCAR OFERTAS AMAZON (Multi-categoria)
// ============================================
app.get("/amazon", async (req, res) => {
  try {
    console.log("🔄 Buscando melhores produtos Amazon...");

    const token = await getCreatorsToken();

    // Categorias e keywords variadas para produtos de qualidade
    const buscas = [
      { keywords: "livros mais vendidos", categoria: "Books" },
      { keywords: "air fryer", categoria: "Kitchen" },
      { keywords: "fone de ouvido bluetooth", categoria: "Electronics" },
      { keywords: "aspirador de pó", categoria: "Kitchen" },
      { keywords: "kindle", categoria: "Electronics" },
      { keywords: "proteína whey", categoria: "HealthPersonalCare" },
      { keywords: "cafeteira", categoria: "Kitchen" },
      { keywords: "smartwatch", categoria: "Electronics" }
    ];

    const todasBuscas = buscas.map(busca =>
      fetch("https://affiliate-program.amazon.com/creatorapi/paapi5/searchitems", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "x-marketplace": "www.amazon.com.br"
        },
        body: JSON.stringify({
          keywords: busca.keywords,
          partnerTag: AMAZON_TAG,
          partnerType: "Associates",
          searchIndex: busca.categoria,
          itemCount: 5,
          resources: [
            "itemInfo.title",
            "offersV2.listings.price",
            "images.primary.medium",
            "customerReviews.count",
            "customerReviews.starRating"
          ],
          marketplace: "www.amazon.com.br",
          languagesOfPreference: ["pt_BR"]
        })
      }).then(r => r.json()).catch(() => null)
    );

    const resultados = await Promise.all(todasBuscas);

    let todosProdutos = [];

    resultados.forEach((data, i) => {
      const itens = data?.SearchResult?.Items || [];
      itens.forEach((item, index) => {
        const asin = item.ASIN || '';
        const titulo = item.ItemInfo?.Title?.DisplayValue || '';
        const preco = item.OffersV2?.Listings?.[0]?.Price?.Amount || 0;
        const precoFormatado = item.OffersV2?.Listings?.[0]?.Price?.DisplayAmount || '';
        const imagem = item.Images?.Primary?.Medium?.URL || '';
        const avaliacao = item.CustomerReviews?.StarRating?.Value || 0;
        const numReviews = item.CustomerReviews?.Count || 0;
        const urlAfiliado = `https://www.amazon.com.br/dp/${asin}?tag=${AMAZON_TAG}`;

        // Filtra apenas produtos com boa avaliação e preço real
        if (titulo && preco > 0 && avaliacao >= 4) {
          todosProdutos.push({
            asin,
            titulo,
            preco,
            preco_formatado: precoFormatado,
            imagem,
            avaliacao,
            num_reviews: numReviews,
            categoria: buscas[i].keywords,
            url_afiliado: urlAfiliado,
            frete_gratis: false
          });
        }
      });
    });

    // Ordena pelos mais bem avaliados e com mais reviews
    todosProdutos.sort((a, b) => {
      const scoreA = a.avaliacao * Math.log(a.num_reviews + 1);
      const scoreB = b.avaliacao * Math.log(b.num_reviews + 1);
      return scoreB - scoreA;
    });

    console.log(`✅ Amazon: ${todosProdutos.length} produtos de qualidade encontrados`);

    res.json({
      status: "ok",
      total: todosProdutos.length,
      data_extracao: new Date().toISOString(),
      produtos: todosProdutos
    });

  } catch (error) {
    console.error("❌ Erro Amazon:", error.message);
    res.status(500).json({ status: "erro", mensagem: error.message });
  }
});

// ============================================
// ENDPOINT: GERAR LINK DE AFILIADO AMAZON
// ============================================
app.post("/amazon-link", async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        status: "erro",
        mensagem: "URL do produto não fornecida"
      });
    }

    if (!url.includes("amazon.com.br") && !url.includes("amzn.to")) {
      return res.status(400).json({
        status: "erro",
        mensagem: "URL inválida - deve ser da Amazon Brasil"
      });
    }

    const tag = AMAZON_TAG;

    let asin = '';
    const asinMatch = url.match(/\/dp\/([A-Z0-9]{10})|\/gp\/product\/([A-Z0-9]{10})/);
    if (asinMatch) {
      asin = asinMatch[1] || asinMatch[2];
    }

    let urlAfiliado = '';

    if (asin) {
      urlAfiliado = `https://www.amazon.com.br/dp/${asin}?tag=${tag}`;
    } else {
      urlAfiliado = url.includes('?')
        ? `${url}&tag=${tag}`
        : `${url}?tag=${tag}`;
    }

    console.log(`✅ Link Amazon gerado: ${urlAfiliado}`);

    res.json({
      status: "ok",
      url_original: url,
      url_afiliado: urlAfiliado,
      asin: asin || "não encontrado",
      tag: tag,
      mensagem: "Link de afiliado Amazon gerado com sucesso!"
    });

  } catch (error) {
    console.error("❌ Erro ao gerar link Amazon:", error.message);
    res.status(500).json({ status: "erro", mensagem: error.message });
  }
});

// ============================================
// ENDPOINT: BUSCAR PRODUTOS VIA CREATORS API
// Body: { keywords: "air fryer", categoria: "All" (opcional) }
// ============================================
app.post("/amazon-buscar", async (req, res) => {
  try {
    const { keywords, categoria = "All", pagina = 1 } = req.body;

    if (!keywords) {
      return res.status(400).json({
        status: "erro",
        mensagem: "Campo 'keywords' obrigatório"
      });
    }

    console.log(`🔍 Buscando na Creators API: "${keywords}"`);

    const token = await getCreatorsToken();

    const payload = {
      keywords: keywords,
      partnerTag: AMAZON_TAG,
      partnerType: "Associates",
      searchIndex: categoria,
      itemPage: pagina,
      itemCount: 10,
      resources: [
        "itemInfo.title",
        "itemInfo.byLineInfo",
        "offersV2.listings.price",
        "offersV2.listings.condition",
        "images.primary.medium",
        "customerReviews.count",
        "customerReviews.starRating",
        "itemInfo.features"
      ],
      marketplace: "www.amazon.com.br",
      languagesOfPreference: ["pt_BR"]
    };

    const response = await fetch("https://affiliate-program.amazon.com/creatorapi/paapi5/searchitems", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "x-marketplace": "www.amazon.com.br"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const erro = await response.text();
      console.error("❌ Erro Creators API:", erro);
      return res.status(response.status).json({
        status: "erro",
        mensagem: `Erro na Creators API: ${response.status}`,
        detalhe: erro
      });
    }

    const data = await response.json();
    const itens = data.SearchResult?.Items || [];

    const produtos = itens.map((item, index) => {
      const asin = item.ASIN || '';
      const titulo = item.ItemInfo?.Title?.DisplayValue || '';
      const preco = item.OffersV2?.Listings?.[0]?.Price?.Amount || 0;
      const moeda = item.OffersV2?.Listings?.[0]?.Price?.Currency || 'BRL';
      const precoFormatado = item.OffersV2?.Listings?.[0]?.Price?.DisplayAmount || '';
      const imagem = item.Images?.Primary?.Medium?.URL || '';
      const avaliacao = item.CustomerReviews?.StarRating?.Value || 0;
      const numReviews = item.CustomerReviews?.Count || 0;
      const urlAfiliado = `https://www.amazon.com.br/dp/${asin}?tag=${AMAZON_TAG}`;

      return {
        asin,
        titulo,
        preco,
        moeda,
        preco_formatado: precoFormatado,
        imagem,
        avaliacao,
        num_reviews: numReviews,
        url_afiliado: urlAfiliado,
        posicao: index + 1
      };
    });

    console.log(`✅ Creators API: ${produtos.length} produtos encontrados`);

    res.json({
      status: "ok",
      keywords,
      total: produtos.length,
      pagina,
      data_extracao: new Date().toISOString(),
      produtos
    });

  } catch (error) {
    console.error("❌ Erro /amazon-buscar:", error.message);
    res.status(500).json({ status: "erro", mensagem: error.message });
  }
});

// ============================================
// ENDPOINT: PEGAR DETALHES DE PRODUTO POR ASIN
// Body: { asin: "B08N5WRWNW" }
// ============================================
app.post("/amazon-produto", async (req, res) => {
  try {
    const { asin } = req.body;

    if (!asin) {
      return res.status(400).json({
        status: "erro",
        mensagem: "Campo 'asin' obrigatório"
      });
    }

    console.log(`🔍 Buscando produto ASIN: ${asin}`);

    const token = await getCreatorsToken();

    const payload = {
      itemIds: [asin],
      partnerTag: AMAZON_TAG,
      partnerType: "Associates",
      resources: [
        "itemInfo.title",
        "itemInfo.byLineInfo",
        "itemInfo.features",
        "offersV2.listings.price",
        "offersV2.listings.condition",
        "offersV2.listings.deliveryInfo.isPrimeEligible",
        "images.primary.large",
        "customerReviews.count",
        "customerReviews.starRating"
      ],
      marketplace: "www.amazon.com.br",
      languagesOfPreference: ["pt_BR"]
    };

    const response = await fetch("https://affiliate-program.amazon.com/creatorapi/paapi5/getitems", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "x-marketplace": "www.amazon.com.br"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const erro = await response.text();
      return res.status(response.status).json({
        status: "erro",
        mensagem: `Erro na Creators API: ${response.status}`,
        detalhe: erro
      });
    }

    const data = await response.json();
    const item = data.ItemsResult?.Items?.[0];

    if (!item) {
      return res.json({ status: "aviso", mensagem: "Produto não encontrado", asin });
    }

    const titulo = item.ItemInfo?.Title?.DisplayValue || '';
    const preco = item.OffersV2?.Listings?.[0]?.Price?.Amount || 0;
    const precoFormatado = item.OffersV2?.Listings?.[0]?.Price?.DisplayAmount || '';
    const prime = item.OffersV2?.Listings?.[0]?.DeliveryInfo?.IsPrimeEligible || false;
    const imagem = item.Images?.Primary?.Large?.URL || '';
    const avaliacao = item.CustomerReviews?.StarRating?.Value || 0;
    const numReviews = item.CustomerReviews?.Count || 0;
    const features = item.ItemInfo?.Features?.DisplayValues || [];
    const urlAfiliado = `https://www.amazon.com.br/dp/${asin}?tag=${AMAZON_TAG}`;

    res.json({
      status: "ok",
      asin,
      titulo,
      preco,
      preco_formatado: precoFormatado,
      prime,
      imagem,
      avaliacao,
      num_reviews: numReviews,
      features,
      url_afiliado: urlAfiliado,
      tag: AMAZON_TAG
    });

  } catch (error) {
    console.error("❌ Erro /amazon-produto:", error.message);
    res.status(500).json({ status: "erro", mensagem: error.message });
  }
});

// ============================================
// ENDPOINT LEGADO: ENCURTAR LINK (cookie Amazon)
// ============================================
app.post('/encurtar-link', async (req, res) => {
  const { asin } = req.body;
  
  if (!asin) {
    return res.status(400).json({ status: 'erro', mensagem: 'ASIN obrigatório' });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    extraHTTPHeaders: {
      'Accept-Language': 'pt-BR,pt;q=0.9'
    }
  });

  await context.addCookies([
    { name: 'session-id', value: '132-2538792-9842543', domain: '.amazon.com.br', path: '/' },
    { name: 'ubid-acbbr', value: '134-1696896-9118130', domain: '.amazon.com.br', path: '/' },
    { name: 'lc-acbbr', value: 'pt_BR', domain: '.amazon.com.br', path: '/' },
    { name: 'i18n-prefs', value: 'BRL', domain: '.amazon.com.br', path: '/' },
    { name: 'session-token', value: '4sy3nP2oJNSyZJbNBvnYr94M4GPMyBF5jx2dqdA02Ti1VA/FLkEZcHKOAl2CAV3Lz7oefK5xKK/lJC4XrI4+c7MJyXl5CwMUaT/nhWALbrgj4eWWMu1YNOE/9FdrMCA8KP4Jz0S/2W/aVSzK/GngxZFjY1zYhARWyNz+/c60AckcFV3PcgCMsMEOHFwpl+o4zlPhW4r2WCKYD8FxLWFK109XLhOEwvRUQWE+53cS/kf/Y1l5YErk5S1F9faJv0sMOKu0kRMcX7w=', domain: '.amazon.com.br', path: '/' },
    { name: 'at-acbbr', value: 'Atza|gQDRqJ09AwEBAI0fCdeYX-4BoDqOpiHuoziSiAkjSiOKevELvOtbHisW2fRdOkw-w3eMopxltOyBSbaKTHDuKgOM4j1lhcupGAzSUHmMYNnZzHAMb3eyVHT-dkmCHQ5uoS8-agQUhIexpYS6SRngrSZn2aYRCfg2s0COlLoPqoESpv0qUg8gUJ_GFuecRXjaLQe6OiyCHparl6MXMmnTIsXLxITiEn0BC6dVGrzz9-dgqPrgzwoZIVQ0xGGEz-AJAGR1bqEmHK0MQWSgP7fbl7t9r5UP_27C8qB0XYCfGqxknEZH3nYL0Ktpg85u9vSJvSHP1DpSJbcO8bQUqYOQn24AzEAUi8MgdD_EDqES_1wJofXHmqKHwRIvaf4s0A4FzX7bran91XABOTYQmbIaz-UXTO4iciD93C6ts8qFTpu3O52Z', domain: '.amazon.com.br', path: '/' }
  ]);

  const page = await context.newPage();

  try {
    const url = `https://www.amazon.com.br/associates/sitestripe/getShortUrl?asin=${asin}&tag=${AMAZON_TAG}&linkType=text`;
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const body = await page.textContent('body');
    const json = JSON.parse(body);
    await browser.close();
    
    if (json && json.shortUrl) {
      return res.json({ status: 'ok', url_curta: json.shortUrl, asin });
    } else {
      return res.json({ status: 'erro', mensagem: 'Link não gerado', resposta: json });
    }
  } catch (err) {
    await browser.close();
    return res.status(500).json({ status: 'erro', mensagem: err.message });
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
  console.log("  GET  /               - Info da API");
  console.log("  GET  /ofertas        - Buscar ofertas do dia (ML)");
  console.log("  GET  /ofertas/:cat   - Buscar ofertas por categoria (ML)");
  console.log("  POST /mercado-simples - Gerar link de afiliado (ML)");
  console.log("  POST /mercado        - Gerar link (tenta encurtar) (ML)");
  console.log("  POST /mercado-oficial - Gerar link meli.la oficial (ML)");
  console.log("  GET  /amazon         - Buscar ofertas Amazon (Playwright)");
  console.log("  POST /amazon-link    - Gerar link de afiliado Amazon");
  console.log("  POST /amazon-buscar  - Buscar produtos via Creators API ✨");
  console.log("  POST /amazon-produto - Detalhes de produto por ASIN ✨");
});
