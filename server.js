// ============================================
// IMPORTS E CONFIGURAÇÃO INICIAL
// ============================================
const express = require("express");
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const app = express();
app.use(express.json());

// ============================================
// VARIÁVEIS DE AMBIENTE
// ============================================
const AMAZON_TAG        = process.env.AMAZON_TAG        || "giseleramosd-20";
const SHOPEE_AFFILIATE  = process.env.SHOPEE_AFFILIATE  || "";
const SHEIN_MEMBER_ID   = process.env.SHEIN_MEMBER_ID   || "1180825914";
const CREATORS_CLIENT_ID     = process.env.AMAZON_CLIENT_ID;
const CREATORS_CLIENT_SECRET = process.env.AMAZON_CLIENT_SECRET;
const CLAUDE_API_KEY    = process.env.CLAUDE_API_KEY    || ""; // Para gerar mensagens com IA

// ============================================
// 🎨 NOVA PALETA DE CORES E EMOJIS
// ============================================
const PLATFORM_STYLES = {
  amazon: {
    emoji: "🔵",           // Azul marinho
    cor: "#0F1111",        // Azul escuro Amazon
    nome: "AMAZON",
    tag: "#Amazon"
  },
  mercado_livre: {
    emoji: "💛",           // Amarelo
    cor: "#FFE600",        // Amarelo oficial ML
    nome: "MERCADO LIVRE",
    tag: "#MercadoLivre"
  },
  shopee: {
    emoji: "🧡",           // Laranja (mantém)
    cor: "#EE4D2D",        // Laranja Shopee
    nome: "SHOPEE",
    tag: "#Shopee"
  },
  shein: {
    emoji: "⚫",           // Preto
    cor: "#000000",        // Preto
    nome: "SHEIN",
    tag: "#Shein"
  }
};

// ============================================
// 🏪 LOJAS EXCLUSIVAS SHEIN (suas favoritas)
// ============================================
const SHEIN_LOJAS_EXCLUSIVAS = {
  "linho-collection": {
    nome: "Coleção Linho Premium",
    url: "https://br.shein.com/Women-Linen-cat-3007.html?sort=7",
    palavras_chave: ["linho", "algodão", "natural", "premium"]
  },
  "exclusive": {
    nome: "Linha Exclusiva",
    url: "https://br.shein.com/exclusive/Women-Exclusive-sc-00400092.html",
    palavras_chave: ["exclusive", "exclusivo", "limited"]
  },
  "conjuntos": {
    nome: "Conjuntos Femininos",
    url: "https://br.shein.com/Women-Two-piece-Outfits-cat-1885.html?sort=7",
    palavras_chave: ["conjunto", "set", "two piece"]
  },
  "casual-dress": {
    nome: "Vestidos Casuais",
    url: "https://br.shein.com/Women-Casual-Dresses-cat-1727.html?sort=7",
    palavras_chave: ["vestido", "dress", "casual"]
  },
  "tops": {
    nome: "Blusas e Tops",
    url: "https://br.shein.com/Women-Tops-cat-1738.html?sort=7",
    palavras_chave: ["blusa", "top", "camiseta", "tshirt"]
  }
};

// ============================================
// COOKIES DO TIKTOK (mantidos)
// ============================================
const TIKTOK_COOKIES = [
  { name: "tt_csrf_token",              value: "fMWbLlP0-bWNFgfrqY75qGjQbytPs6rzPsDs",             domain: ".tiktok.com", path: "/" },
  { name: "tt_chain_token",             value: "oe5Yl/GgqqzePSSaHElF8A==",                          domain: ".tiktok.com", path: "/" },
  { name: "tiktok_webapp_theme",        value: "light",                                              domain: ".tiktok.com", path: "/" },
  { name: "delay_guest_mode_vid",       value: "5",                                                  domain: ".tiktok.com", path: "/" },
  { name: "_ttp",                       value: "3DRa9EVRr1RMt7h1r6VYkwMNaWx",                       domain: ".tiktok.com", path: "/" },
  { name: "ttwid",                      value: "1%7CDQCkOWjH-OZvFdBtE87cPnUIlLQRspfKE2MKDjB2fgM%7C1779027682%7Cdddd86f6c08a1f9b723c828903d7ea59d69f7acdbca9c7de61dcdc45b5d9a687", domain: ".tiktok.com", path: "/" },
  { name: "passport_csrf_token",        value: "981f81810312de1423936c841f0b4afe",                  domain: ".tiktok.com", path: "/" },
  { name: "passport_csrf_token_default",value: "981f81810312de1423936c841f0b4afe",                  domain: ".tiktok.com", path: "/" },
  { name: "uid_tt",                     value: "0414977c1e340a04e97450597f97e75584baaa144b59628e16459ca144eb8ff6", domain: ".tiktok.com", path: "/" },
  { name: "uid_tt_ss",                  value: "0414977c1e340a04e97450597f97e75584baaa144b59628e16459ca144eb8ff6", domain: ".tiktok.com", path: "/" },
  { name: "sid_tt",                     value: "519dd02c7106b721031c189231aee9bb",                  domain: ".tiktok.com", path: "/" },
  { name: "sessionid",                  value: "519dd02c7106b721031c189231aee9bb",                  domain: ".tiktok.com", path: "/" },
  { name: "sessionid_ss",               value: "519dd02c7106b721031c189231aee9bb",                  domain: ".tiktok.com", path: "/" },
  { name: "sid_guard",                  value: "519dd02c7106b721031c189231aee9bb%7C1779027677%7C15552000%7CFri%2C+13-Nov-2026+14%3A21%3A17+GMT", domain: ".tiktok.com", path: "/" },
  { name: "multi_sids",                 value: "7634192487749354497%3A519dd02c7106b721031c189231aee9bb", domain: ".tiktok.com", path: "/" },
  { name: "sid_ucp_v1",                 value: "1.0.1-KDc0ZWM4ZjIzZmU1MDgwM2Q1OGM5Mzg1ZDYzNDBlYjA1MGVlZWNmMjAKIQiBiIaa67OG-WkQ3Z2n0AYYswsgDDCus8jPBjgIQBJIBBADGgNteTIiIDUxOWRkMDJjNzEwNmI3MjEwMzFjMTg5MjMxYWVlOWJiMk4KIDLBxxYn_ftxjq4AH5Saduh4i7qju79TALUbmGHm3shvEiBua9s07PILPf65fNisDWvj9AVjo5SgaazfXAucexTOcBgEIgZ0aWt0b2s", domain: ".tiktok.com", path: "/" },
  { name: "ssid_ucp_v1",               value: "1.0.1-KDc0ZWM4ZjIzZmU1MDgwM2Q1OGM5Mzg1ZDYzNDBlYjA1MGVlZWNmMjAKIQiBiIaa67OG-WkQ3Z2n0AYYswsgDDCus8jPBjgIQBJIBBADGgNteTIiIDUxOWRkMDJjNzEwNmI3MjEwMzFjMTg5MjMxYWVlOWJiMk4KIDLBxxYn_ftxjq4AH5Saduh4i7qju79TALUbmGHm3shvEiBua9s07PILPf65fNisDWvj9AVjo5SgaazfXAucexTOcBgEIgZ0aWt0b2s", domain: ".tiktok.com", path: "/" },
  { name: "tt_session_tlb_tag",         value: "sttt%7C4%7CUZ3QLHEGtyEDHBiSMa7pu_________-gEQi92r4-E0mtQI36tM55dHdvRNs9RC2N2Si5iSlOpY8%3D", domain: ".tiktok.com", path: "/" },
  { name: "odin_tt",                    value: "933414d585ba224a790475d9cb1269e248c03f862db14e20877cd5569c5b372ea2abe0157ae472dfb2a26406db440b5419f9444178e30e0cc98fc39b3267bcea146af0134fa97d7c043a34f75ed98841", domain: ".tiktok.com", path: "/" },
  { name: "msToken",                    value: "sN2KL6OlEftfMnRgWlNWOelMbjuUfYn3JZn9pvhEGDQkOlFmRr1aU0Fyf-HY9CreDhKRTqAHtCR__2UVO54e96wifJhzK81JHVqAgDi9FJkV2Og1deFOMa-XO_wK85ZWOJa9eS5NPa54UZc=", domain: ".tiktok.com", path: "/" },
  { name: "store-idc",                  value: "alisg",              domain: ".tiktok.com", path: "/" },
  { name: "store-country-code",         value: "br",                 domain: ".tiktok.com", path: "/" },
  { name: "tt-target-idc",             value: "alisg",               domain: ".tiktok.com", path: "/" },
  { name: "timezone_name",             value: "America%2FSao_Paulo", domain: ".tiktok.com", path: "/" },
  { name: "csrf_session_id",           value: "0d00ca977216b72d7bedd2025c68cf5d", domain: ".tiktok.com", path: "/" },
  { name: "passport_auth_status",      value: "e86acee290e4ce67a49c0e5acb237e26%2C9686ef0d2dea6a15098de7d39cfcffb0", domain: ".tiktok.com", path: "/" },
  { name: "passport_auth_status_ss",   value: "e86acee290e4ce67a49c0e5acb237e26%2C9686ef0d2dea6a15098de7d39cfcffb0", domain: ".tiktok.com", path: "/" }
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
    grant_type:    "client_credentials",
    client_id:     CREATORS_CLIENT_ID,
    client_secret: CREATORS_CLIENT_SECRET,
    scope:         "creatorsapi::default"
  });
  const response = await fetch("https://api.amazon.com/auth/o2/token", {
    method:  "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body:    body.toString()
  });
  if (!response.ok) {
    const erro = await response.text();
    throw new Error(`Erro ao obter token Amazon: ${response.status} - ${erro}`);
  }
  const data = await response.json();
  creatorsToken       = data.access_token;
  creatorsTokenExpiry = agora + data.expires_in * 1000;
  return creatorsToken;
}

// ============================================
// FUNÇÃO AUXILIAR: LANÇAR BROWSER COM STEALTH
// ============================================
async function abrirBrowser() {
  return await chromium.launch({
    headless:       true,
    executablePath: require("playwright").chromium.executablePath(),
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--single-process"
    ]
  });
}

// ============================================
// 🧠 SISTEMA INTELIGENTE DE PONTUAÇÃO
// Avalia qualidade do produto para priorização
// ============================================
function calcularPontuacaoProduto(item) {
  let pontuacao = 0;
  
  // Rating (peso alto)
  const rating = parseFloat(item.avaliacao) || 0;
  if (rating >= 4.8) pontuacao += 50;
  else if (rating >= 4.5) pontuacao += 35;
  else if (rating >= 4.0) pontuacao += 20;
  else if (rating >= 3.5) pontuacao += 10;
  
  // Desconto (peso médio)
  const desconto = parseFloat((item.desconto || "").replace(/[^\d.,]/g, "").replace(",", ".")) || 0;
  if (desconto >= 60) pontuacao += 40;
  else if (desconto >= 40) pontuacao += 30;
  else if (desconto >= 20) pontuacao += 15;
  
  // Quantidade de avaliações (peso médio)
  const avaliacoes = parseInt((item.qtd_avaliacoes || "").replace(/[^\d]/g, "")) || 0;
  if (avaliacoes >= 1000) pontuacao += 30;
  else if (avaliacoes >= 500) pontuacao += 20;
  else if (avaliacoes >= 100) pontuacao += 10;
  
  // Mais vendido (peso baixo)
  if (item.mais_vendido) pontuacao += 15;
  
  // Frete grátis (peso baixo)
  if (item.frete_gratis || (item.titulo && item.titulo.toLowerCase().includes("frete"))) {
    pontuacao += 10;
  }
  
  // Vendas (Shopee/Shein)
  const vendidos = parseInt((item.qtd_vendidos || item.vendidos || "").replace(/[^\d]/g, "")) || 0;
  if (vendidos >= 1000) pontuacao += 25;
  else if (vendidos >= 500) pontuacao += 15;
  else if (vendidos >= 100) pontuacao += 5;
  
  return Math.min(pontuacao, 150); // Máximo 150 pontos
}

// ============================================
// 🎯 CLASSIFICAR QUALIDADE DO PRODUTO
// ============================================
function classificarProduto(pontuacao) {
  if (pontuacao >= 100) return { nivel: "PREMIUM", emoji: "💎", prioridade: 1 };
  if (pontuacao >= 70) return { nivel: "EXCELENTE", emoji: "🌟", prioridade: 2 };
  if (pontuacao >= 50) return { nivel: "BOM", emoji: "✅", prioridade: 3 };
  if (pontuacao >= 30) return { nivel: "REGULAR", emoji: "⚠️", prioridade: 4 };
  return { nivel: "BAIXO", emoji: "❌", prioridade: 5 };
}

// ============================================
// 🤖 GERAR MENSAGEM COM CLAUDE AI
// ============================================
async function gerarMensagemComIA(produto, plataforma) {
  if (!CLAUDE_API_KEY) {
    console.log("[IA] Claude API Key não configurada, gerando mensagem padrão");
    return gerarMensagemPadrao(produto, plataforma);
  }
  
  try {
    const style = PLATFORM_STYLES[plataforma] || PLATFORM_STYLES.amazon;
    
    const prompt = `Você é um especialista em marketing de afiliados no Brasil.

Crie uma mensagem ATRATIVA e PERSUASIVA para WhatsApp/Telegram com este produto:

PRODUTO: ${produto.titulo}
PLATAFORMA: ${style.nome}
PREÇO: R$ ${produto.preco}
${produto.preco_original ? `PREÇO ORIGINAL: R$ ${produto.preco_original}` : ''}
${produto.desconto ? `DESCONTO: ${produto.desconto}%` : ''}
${produto.avaliacao ? `AVALIAÇÃO: ${produto.avaliacao}/5` : ''}
${produto.qtd_avaliacoes ? `AVALIAÇÕES: ${produto.qtd_avaliacoes}` : ''}

REGRAS:
- Use o emoji ${style.emoji} no início
- Destaque o preço e desconto com *negrito*
- Use emojis relevantes (máximo 5)
- Crie senso de urgência
- Inclua call-to-action forte
- Máximo 15 linhas
- Tom persuasivo mas natural
- Não invente características que não foram fornecidas
- Formato para WhatsApp (use * para negrito, ~ para riscado)

RESPONDA APENAS COM A MENSAGEM FORMATADA, SEM EXPLICAÇÕES.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1024,
        messages: [{
          role: "user",
          content: prompt
        }]
      })
    });
    
    if (!response.ok) {
      throw new Error(`Claude API erro: ${response.status}`);
    }
    
    const data = await response.json();
    const mensagemIA = data.content[0].text;
    
    console.log("[IA] Mensagem gerada com sucesso");
    return mensagemIA;
    
  } catch (error) {
    console.error("[IA] Erro ao gerar mensagem:", error.message);
    return gerarMensagemPadrao(produto, plataforma);
  }
}

// ============================================
// 📝 GERAR MENSAGEM PADRÃO (fallback)
// ============================================
function gerarMensagemPadrao(produto, plataforma) {
  const style = PLATFORM_STYLES[plataforma] || PLATFORM_STYLES.amazon;
  const pontuacao = calcularPontuacaoProduto(produto);
  const classificacao = classificarProduto(pontuacao);
  
  let mensagem = `${style.emoji} *${style.nome}* ${style.emoji}\n\n`;
  
  // Badge de qualidade
  mensagem += `${classificacao.emoji} *${classificacao.nivel}*\n\n`;
  
  // Título
  mensagem += `*${produto.titulo}*\n\n`;
  
  // Preço
  mensagem += `💰 *PREÇO:*\n`;
  if (produto.preco_original && produto.desconto) {
    mensagem += `De: ~R$ ${produto.preco_original}~\n`;
    mensagem += `*Por: R$ ${produto.preco}* (${produto.desconto}% OFF)\n\n`;
  } else {
    mensagem += `*R$ ${produto.preco}*\n\n`;
  }
  
  // Avaliação
  if (produto.avaliacao) {
    const estrelas = "⭐".repeat(Math.floor(produto.avaliacao));
    mensagem += `${estrelas} ${produto.avaliacao}/5`;
    if (produto.qtd_avaliacoes) {
      mensagem += ` (${produto.qtd_avaliacoes} avaliações)`;
    }
    mensagem += `\n\n`;
  }
  
  // Destaque de vendas
  if (produto.qtd_vendidos || produto.vendidos) {
    mensagem += `🔥 *${produto.qtd_vendidos || produto.vendidos}* vendidos!\n\n`;
  }
  
  // Link
  mensagem += `🛒 *COMPRAR AGORA:*\n`;
  mensagem += `👉 ${produto.link}\n\n`;
  
  // Urgência
  mensagem += `⏰ *Oferta por tempo limitado!*\n\n`;
  
  // Hashtags
  mensagem += `${style.tag} #Ofertas #Desconto\n`;
  mensagem += `━━━━━━━━━━━━━━━━━━`;
  
  return mensagem;
}

// ============================================
// DETECÇÃO DE BUGS (mantidas funções originais)
// ============================================
function detectarBugML(item) {
  const titulo  = (item.titulo || "").toLowerCase();
  const desconto = parseFloat((item.desconto || "").replace(/[^\d.,]/g, "").replace(",", ".")) || 0;
  const preco   = item.preco || 0;
  const razoes  = [];

  if (desconto >= 70) razoes.push(`desconto de ${desconto}% (acima de 70%)`);
  if (titulo.includes("iphone")     && preco > 0 && preco < 1800) razoes.push(`iPhone por R$${preco} (suspeito abaixo de R$1.800)`);
  if (titulo.includes("notebook")   && preco > 0 && preco < 1500) razoes.push(`Notebook por R$${preco} (suspeito abaixo de R$1.500)`);
  if (titulo.includes("playstation")&& preco > 0 && preco < 2500) razoes.push(`PlayStation por R$${preco} (suspeito abaixo de R$2.500)`);
  if (titulo.includes("macbook")    && preco > 0 && preco < 3000) razoes.push(`MacBook por R$${preco} (suspeito abaixo de R$3.000)`);
  if (titulo.includes("tv") && titulo.includes("55") && preco > 0 && preco < 1200) razoes.push(`TV 55" por R$${preco} (suspeito abaixo de R$1.200)`);
  if (titulo.includes("air fryer")  && preco > 0 && preco < 80)   razoes.push(`Air Fryer por R$${preco} (suspeito abaixo de R$80)`);
  if (titulo.includes("robô") && titulo.includes("aspirador") && preco > 0 && preco < 300) razoes.push(`Robô aspirador por R$${preco} (suspeito abaixo de R$300)`);

  if (razoes.length === 0) return null;
  
  const pontuacao = calcularPontuacaoProduto(item);
  const classificacao = classificarProduto(pontuacao);
  
  return { ...item, plataforma: "mercado_livre", razoes_bug: razoes, pontuacao, classificacao: classificacao.nivel };
}

function detectarBugAmazon(item) {
  const titulo = (item.titulo || "").toLowerCase();
  const preco  = item.preco || 0;
  const razoes = [];

  if (preco <= 0) return null;

  if (titulo.includes("iphone")  && preco < 2000)  razoes.push(`iPhone por R$${preco} (suspeito abaixo de R$2.000)`);
  if (titulo.includes("kindle")  && preco < 150)   razoes.push(`Kindle por R$${preco} (suspeito abaixo de R$150)`);
  if (titulo.includes("echo") && titulo.includes("dot") && preco < 60) razoes.push(`Echo Dot por R$${preco} (suspeito abaixo de R$60)`);
  if ((titulo.includes("notebook") || titulo.includes("laptop")) && preco < 1800) razoes.push(`Notebook por R$${preco} (suspeito abaixo de R$1.800)`);
  if (titulo.includes("fone") && titulo.includes("bluetooth") && preco < 30) razoes.push(`Fone Bluetooth por R$${preco} (suspeito abaixo de R$30)`);
  if (titulo.includes("câmera")   && preco < 500)  razoes.push(`Câmera por R$${preco} (suspeito abaixo de R$500)`);
  if (titulo.includes("monitor")  && preco < 400)  razoes.push(`Monitor por R$${preco} (suspeito abaixo de R$400)`);
  if (titulo.includes("smartwatch") && preco < 80) razoes.push(`Smartwatch por R$${preco} (suspeito abaixo de R$80)`);
  if (titulo.includes("galaxy") && titulo.includes("s") && preco < 1500) razoes.push(`Galaxy S por R$${preco} (suspeito abaixo de R$1.500)`);

  if (razoes.length === 0) return null;
  
  const pontuacao = calcularPontuacaoProduto(item);
  const classificacao = classificarProduto(pontuacao);
  
  return { ...item, plataforma: "amazon", razoes_bug: razoes, pontuacao, classificacao: classificacao.nivel };
}

function detectarBugShein(item) {
  const titulo = (item.titulo || "").toLowerCase();
  const preco  = item.preco || 0;
  const razoes = [];

  if (preco <= 0) return null;

  if (preco < 5) razoes.push(`Produto por R$${preco} (abaixo de R$5 — possível erro de cadastro)`);
  if ((titulo.includes("vestido") || titulo.includes("dress")) && preco < 15)               razoes.push(`Vestido por R$${preco} (suspeito abaixo de R$15)`);
  if ((titulo.includes("casaco") || titulo.includes("jaqueta") || titulo.includes("coat")) && preco < 20) razoes.push(`Casaco/Jaqueta por R$${preco} (suspeito abaixo de R$20)`);
  if ((titulo.includes("biquíni") || titulo.includes("swimsuit")) && preco < 10)            razoes.push(`Biquíni por R$${preco} (suspeito abaixo de R$10)`);
  if ((titulo.includes("maquiagem") || titulo.includes("makeup") || titulo.includes("foundation")) && preco < 8) razoes.push(`Maquiagem por R$${preco} (suspeito abaixo de R$8)`);
  if ((titulo.includes("conjunto") || titulo.includes("set")) && preco < 20)               razoes.push(`Conjunto por R$${preco} (suspeito abaixo de R$20)`);
  if ((titulo.includes("calça") || titulo.includes("pants")) && preco < 15)                razoes.push(`Calça por R$${preco} (suspeito abaixo de R$15)`);

  if (razoes.length === 0) return null;
  
  const pontuacao = calcularPontuacaoProduto(item);
  const classificacao = classificarProduto(pontuacao);
  
  return { ...item, plataforma: "shein", razoes_bug: razoes, pontuacao, classificacao: classificacao.nivel };
}

function detectarBugShopee(item) {
  const titulo = (item.titulo || "").toLowerCase();
  const preco  = item.preco || 0;
  const razoes = [];

  if (preco <= 0) return null;

  if (preco < 1)                                                      razoes.push(`Produto por R$${preco} (abaixo de R$1 — possível bug de cadastro)`);
  if (titulo.includes("iphone")                 && preco < 1500)      razoes.push(`iPhone por R$${preco} (suspeito abaixo de R$1.500)`);
  if ((titulo.includes("notebook") || titulo.includes("laptop")) && preco < 1200) razoes.push(`Notebook por R$${preco} (suspeito abaixo de R$1.200)`);
  if (titulo.includes("smartwatch")             && preco < 50)        razoes.push(`Smartwatch por R$${preco} (suspeito abaixo de R$50)`);
  if (titulo.includes("fone") && titulo.includes("bluetooth") && preco < 15) razoes.push(`Fone Bluetooth por R$${preco} (suspeito abaixo de R$15)`);
  if ((titulo.includes("air fryer") || titulo.includes("airfryer")) && preco < 60) razoes.push(`Air Fryer por R$${preco} (suspeito abaixo de R$60)`);
  if (titulo.includes("robô") && titulo.includes("aspirador") && preco < 200) razoes.push(`Robô aspirador por R$${preco} (suspeito abaixo de R$200)`);
  if ((titulo.includes("tênis") || titulo.includes("tenis")) && preco < 20) razoes.push(`Tênis por R$${preco} (suspeito abaixo de R$20)`);
  if (titulo.includes("perfume")                && preco < 30)        razoes.push(`Perfume por R$${preco} (suspeito abaixo de R$30)`);
  if (titulo.includes("tablet")                 && preco < 300)       razoes.push(`Tablet por R$${preco} (suspeito abaixo de R$300)`);
  if ((titulo.includes("câmera") || titulo.includes("camera")) && preco < 100) razoes.push(`Câmera por R$${preco} (suspeito abaixo de R$100)`);
  if (titulo.includes("monitor")                && preco < 200)       razoes.push(`Monitor por R$${preco} (suspeito abaixo de R$200)`);

  if (razoes.length === 0) return null;
  
  const pontuacao = calcularPontuacaoProduto(item);
  const classificacao = classificarProduto(pontuacao);
  
  return { ...item, plataforma: "shopee", razoes_bug: razoes, pontuacao, classificacao: classificacao.nivel };
}
// ============================================
// ROTA: OFERTAS DO DIA - MERCADO LIVRE
// ============================================
app.get("/ofertas", async (req, res) => {
  try {
    console.log("🔄 Buscando ofertas ML...");
    const browser = await abrirBrowser();
    const context = await browser.newContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      viewport:  { width: 1920, height: 1080 },
      locale:    "pt-BR"
    });
    const page = await context.newPage();
    await page.goto("https://www.mercadolivre.com.br/ofertas?category=MLB1574#filter_applied=category&filter_position=4&origin=qcat", {
      waitUntil: "domcontentloaded",
      timeout: 30000
    });
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
          const precoEl    = card.querySelector(".andes-money-amount__fraction, [class*='price-tag-fraction']");
          const preco      = precoEl ? parseFloat(precoEl.textContent.trim().replace(/[^\d,]/g, "").replace(",", ".")) : 0;
          const linkEl     = card.querySelector("a");
          const link       = linkEl ? linkEl.href : "";
          const imgEl      = card.querySelector("img");
          const imagem     = imgEl ? (imgEl.src || imgEl.getAttribute("data-src") || "") : "";
          const descontoEl = card.querySelector("[class*='discount'], [class*='off']");
          const desconto   = descontoEl ? descontoEl.textContent.trim() : "";
          const avaliacao  = card.querySelector(".poly-reviews__rating, [class*='reviews__rating']")?.textContent?.trim() || "";
          const qtdAvaliacoesEl = card.querySelector(".poly-reviews__total, [class*='reviews__total']");
          const qtd_avaliacoes  = qtdAvaliacoesEl ? qtdAvaliacoesEl.textContent.replace(/[()]/g, "").trim() : "";
          const vendidosEl      = card.querySelector("[class*='sold-quantity'], .poly-component__sold-quantity, [class*='sales']");
          const qtd_vendidos    = vendidosEl ? vendidosEl.textContent.trim() : "";
          const maisVendidoEl   = card.querySelector("[class*='highlight'], .poly-component__highlight, [class*='best-seller'], [class*='tag']");
          const mais_vendido    = maisVendidoEl ? maisVendidoEl.textContent.trim() : "";
          if (titulo && titulo.length > 3) {
            items.push({ titulo, preco, desconto, avaliacao, qtd_avaliacoes, qtd_vendidos, mais_vendido, link, imagem, posicao: index + 1 });
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
    const page    = await (await browser.newContext()).newPage();
    await page.goto(`https://www.mercadolivre.com.br/ofertas?container_id=${categoria}`, { waitUntil: "networkidle", timeout: 30000 });

    const produtos = await page.evaluate(() => {
      const items = [];
      const cards = document.querySelectorAll("div.poly-card, li.poly-component__item, div[class*='promotion-item']");
      cards.forEach((card, index) => {
        try {
          const titulo     = card.querySelector("h2, h3, [class*='title']")?.textContent?.trim() || "";
          const precoTexto = card.querySelector("[class*='price'], .andes-money-amount__fraction")?.textContent?.trim() || "";
          const preco      = precoTexto ? parseFloat(precoTexto.replace(/[^\d,]/g, "").replace(",", ".")) : 0;
          const avaliacao  = card.querySelector(".poly-reviews__rating, [class*='reviews__rating']")?.textContent?.trim() || "";
          const qtdAvaliacoesEl = card.querySelector(".poly-reviews__total, [class*='reviews__total']");
          const qtd_avaliacoes  = qtdAvaliacoesEl ? qtdAvaliacoesEl.textContent.replace(/[()]/g, "").trim() : "";
          const vendidosEl      = card.querySelector("[class*='sold-quantity'], .poly-component__sold-quantity, [class*='sales']");
          const qtd_vendidos    = vendidosEl ? vendidosEl.textContent.trim() : "";
          const maisVendidoEl   = card.querySelector("[class*='highlight'], .poly-component__highlight, [class*='best-seller'], [class*='tag']");
          const mais_vendido    = maisVendidoEl ? maisVendidoEl.textContent.trim() : "";
          const cupom  = card.querySelector("[class*='coupon'], [class*='coupon-tag'], [class*='promotion']")?.textContent?.trim() || "";
          const link   = card.querySelector("a")?.href || "";
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
// ROTA: BUGS DE PREÇO - MERCADO LIVRE
// BUG CORRIGIDO: parseInt → parseFloat no preço; seletores mais robustos
// ============================================
app.get("/bugs", async (req, res) => {
  try {
    console.log("🔥 Buscando bugs ML...");
    const browser = await abrirBrowser();
    const context = await browser.newContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      viewport:  { width: 1920, height: 1080 },
      locale:    "pt-BR"
    });
    const page = await context.newPage();

    await page.goto("https://www.mercadolivre.com.br/ofertas?category=MLB1574&filter_applied=category&filter_position=4&origin=qcat", {
      waitUntil: "domcontentloaded",
      timeout: 30000
    });
    await page.waitForTimeout(5000);

    // BUG CORRIGIDO: seletor ampliado para pegar mais cards (igual à rota /ofertas)
    const items = await page.evaluate(() => {
      const seletores = [".promotion-item", ".poly-card", "article", "div[class*='ui-search-result']", "li[class*='ui-search-layout__item']"];
      let cards = [];
      for (const sel of seletores) {
        cards = Array.from(document.querySelectorAll(sel));
        if (cards.length > 0) break;
      }
      return cards.map((card, index) => {
        let titulo = "";
        for (const sel of ["h2", "h3", "a[class*='title']", ".poly-component__title"]) {
          const el = card.querySelector(sel);
          if (el && el.textContent.trim()) { titulo = el.textContent.trim(); break; }
        }
        const precoEl  = card.querySelector(".andes-money-amount__fraction, [class*='price-tag-fraction']");
        // BUG CORRIGIDO: era parseInt (perdia centavos), agora parseFloat
        const preco    = precoEl ? parseFloat(precoEl.textContent.trim().replace(/[^\d,]/g, "").replace(",", ".")) : 0;
        const descontoEl = card.querySelector("[class*='discount'], [class*='off']");
        const desconto   = descontoEl ? descontoEl.textContent.trim() : "";
        const cupomEl    = card.querySelector("[class*='coupon'], [class*='promotion']");
        const cupom      = cupomEl ? cupomEl.textContent.trim() : "";
        const avaliacao  = card.querySelector(".poly-reviews__rating, [class*='reviews__rating']")?.textContent?.trim() || "";
        const qtdAvaliacoesEl = card.querySelector(".poly-reviews__total, [class*='reviews__total']");
        const qtd_avaliacoes  = qtdAvaliacoesEl ? qtdAvaliacoesEl.textContent.replace(/[()]/g, "").trim() : "";
        const vendidosEl = card.querySelector("[class*='sold-quantity'], .poly-component__sold-quantity, [class*='sales']");
        const qtd_vendidos    = vendidosEl ? vendidosEl.textContent.trim() : "";
        const maisVendidoEl   = card.querySelector("[class*='highlight'], .poly-component__highlight, [class*='best-seller'], [class*='tag']");
        const mais_vendido    = maisVendidoEl ? maisVendidoEl.textContent.trim() : "";
        const link   = card.querySelector("a")?.href || "";
        const imgEl  = card.querySelector("img");
        const imagem = imgEl ? (imgEl.src || imgEl.getAttribute("data-src") || "") : "";
        return { titulo, preco, desconto, cupom, avaliacao, qtd_avaliacoes, qtd_vendidos, mais_vendido, link, imagem, posicao: index + 1 };
      });
    });

    await browser.close();

    const bugs = items.map(detectarBugML).filter(Boolean);

    res.json({
      status: "ok",
      plataforma: "mercado_livre",
      total_bugs: bugs.length,
      data_extracao: new Date().toISOString(),
      bugs
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "erro", mensagem: error.message });
  }
});

// ============================================
// ============================================
// 🆕 ROTA: BUSCAR LOJAS ESPECÍFICAS SHEIN
// ============================================
app.get("/shein/lojas-exclusivas", async (req, res) => {
  try {
    const { loja = "todas", limite = 10 } = req.query;
    
    console.log(`[Shein] Buscando lojas exclusivas: ${loja}`);
    
    const browser = await abrirBrowser();
    const context = await browser.newContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      viewport:  { width: 1920, height: 1080 },
      locale:    "pt-BR"
    });

    await context.addCookies([
      { name: "memberId",        value: SHEIN_MEMBER_ID, domain: ".shein.com", path: "/" },
      { name: "AT",              value: "MDEwMDE.eyJiIjo3LCJnIjoxNzc4ODgyNzY1LCJyIjoiWmZnQ2pvIiwidCI6MiwibSI6MTE4MDgyNTkxNCwibCI6MTc3ODg4Mjc2NX0.c7e8197dce8ec6cd.3345b7409e3d797c64baf023ec7356f6a80d14db69ba2638e3f090f0a6d18dc3", domain: ".shein.com", path: "/" },
      { name: "sessionID_shein", value: "s%3A7S7sthaovE_Sy9eCpmLnzrOlwWc0Fwmi.37UHrLYj4Eq6Bfxhb4gOBJOuPly4kkpD32FjScputO4", domain: ".shein.com", path: "/" }
    ]);

    const page = await context.newPage();
    const todosProtudos = [];
    
    // Determinar quais lojas buscar
    const lojasParaBuscar = loja === "todas" 
      ? Object.entries(SHEIN_LOJAS_EXCLUSIVAS)
      : [[loja, SHEIN_LOJAS_EXCLUSIVAS[loja]]];
    
    for (const [lojaId, lojaInfo] of lojasParaBuscar) {
      if (!lojaInfo) continue;
      
      console.log(`[Shein] Buscando: ${lojaInfo.nome}`);
      
      await page.goto(lojaInfo.url, { waitUntil: "domcontentloaded", timeout: 60000 });
      await page.waitForTimeout(6000);
      
      try { await page.click('[class*="close"], .sui-popup-close', { timeout: 3000 }); } catch (e) {}
      
      // Scroll para carregar produtos
      for (let i = 1; i <= 8; i++) {
        await page.evaluate((step) => window.scrollTo(0, (document.body.scrollHeight / 8) * step), i);
        await page.waitForTimeout(1200);
      }
      await page.waitForTimeout(2000);
      
      const produtos = await page.evaluate((lojaNome, palavrasChave) => {
        const items = [];
        const seletores = ["[da-eid]", ".product-item-v3", ".S-product-item", "div[class*='product-item']"];
        let cards = [];
        for (const sel of seletores) {
          cards = Array.from(document.querySelectorAll(sel));
          if (cards.length > 0) break;
        }
        
        cards.forEach((card, index) => {
          try {
            const linkEl  = card.closest("a[href*='shein.com']")
              || card.parentElement?.closest("a[href*='shein.com']")
              || card.querySelector("a[href*='shein.com']");
            const linkRaw = linkEl ? linkEl.href : "";
            const idMatch = linkRaw.match(/-p-(\d+)\.html/);
            const link    = idMatch ? `https://br.shein.com/p-p-${idMatch[1]}.html` : linkRaw.split("?")[0];

            const titulo         = card.querySelector('[class*="name"], [class*="title"]')?.textContent?.trim() || "";
            const precoTexto     = card.querySelector('[class*="price-new"], [class*="sale-price"]')?.textContent?.trim() || "";
            const preco          = parseFloat(precoTexto.replace("R$", "").replace(/\./g, "").replace(",", ".")) || 0;
            const precoOrigTexto = card.querySelector('[class*="price-del"], [class*="original-price"]')?.textContent?.trim() || "";
            const preco_original = parseFloat(precoOrigTexto.replace("R$", "").replace(/\./g, "").replace(",", ".")) || 0;
            const descontoEl     = card.querySelector('[class*="discount"], [class*="off-percent"]');
            const desconto       = descontoEl ? descontoEl.textContent.trim() : "";
            const avaliacaoEl    = card.querySelector('[class*="star-num"], [class*="review-num"]');
            const avaliacao      = avaliacaoEl ? avaliacaoEl.textContent.trim().replace(/[()]/g, "") : "";
            const vendidosEl     = card.querySelector('[class*="sold"], [class*="vendido"]');
            const vendidos       = vendidosEl ? vendidosEl.textContent.trim() : "";
            const imagem         = card.querySelector("img")?.src || card.querySelector("img")?.getAttribute("data-src") || "";

            // Verificar se contém palavras-chave da loja
            const tituloLower = titulo.toLowerCase();
            const contemPalavraChave = palavrasChave.some(palavra => tituloLower.includes(palavra.toLowerCase()));
            
            if (titulo && preco > 0 && link && contemPalavraChave) {
              items.push({ 
                titulo, preco, preco_original, desconto, avaliacao, vendidos, 
                imagem, link, loja: lojaNome, posicao: index + 1 
              });
            }
          } catch (e) {}
        });
        return items;
      }, lojaInfo.nome, lojaInfo.palavras_chave);
      
      todosProtudos.push(...produtos);
      console.log(`[Shein] ${lojaInfo.nome}: ${produtos.length} produtos encontrados`);
    }
    
    await browser.close();
    
    // Calcular pontuação e ordenar
    const produtosComPontuacao = todosProtudos.map(p => {
      const pontuacao = calcularPontuacaoProduto(p);
      const classificacao = classificarProduto(pontuacao);
      return { ...p, pontuacao, classificacao: classificacao.nivel, emoji_qualidade: classificacao.emoji };
    });
    
    // Ordenar por pontuação (melhores primeiro)
    produtosComPontuacao.sort((a, b) => b.pontuacao - a.pontuacao);
    
    // Limitar quantidade
    const produtosFinais = produtosComPontuacao.slice(0, parseInt(limite));
    
    res.json({
      status: "ok",
      plataforma: "shein",
      lojas_buscadas: loja === "todas" ? Object.keys(SHEIN_LOJAS_EXCLUSIVAS) : [loja],
      total_encontrados: produtosComPontuacao.length,
      total_retornados: produtosFinais.length,
      data_extracao: new Date().toISOString(),
      produtos: produtosFinais
    });
    
  } catch (error) {
    console.error("[Shein] Erro:", error);
    res.status(500).json({ status: "erro", mensagem: error.message });
  }
});

// ============================================
// 🆕 ROTA: GERAR MENSAGEM COM IA
// ============================================
app.post("/gerar-mensagem", async (req, res) => {
  try {
    const { produto, plataforma = "amazon" } = req.body;
    
    if (!produto) {
      return res.status(400).json({ status: "erro", mensagem: "Produto não fornecido" });
    }
    
    const mensagem = await gerarMensagemComIA(produto, plataforma);
    
    res.json({
      status: "ok",
      plataforma,
      mensagem,
      gerado_com_ia: !!CLAUDE_API_KEY
    });
    
  } catch (error) {
    console.error("[IA] Erro:", error);
    res.status(500).json({ status: "erro", mensagem: error.message });
  }
});

// ============================================
// 🆕 ROTA: ANÁLISE DE PRODUTOS (Top Picks Inteligente)
// ============================================
app.post("/analisar-produtos", async (req, res) => {
  try {
    const { produtos, limite = 10, min_pontuacao = 50 } = req.body;
    
    if (!produtos || !Array.isArray(produtos)) {
      return res.status(400).json({ status: "erro", mensagem: "Array de produtos não fornecido" });
    }
    
    // Calcular pontuação para cada produto
    const produtosAnalisados = produtos.map(p => {
      const pontuacao = calcularPontuacaoProduto(p);
      const classificacao = classificarProduto(pontuacao);
      return {
        ...p,
        pontuacao,
        classificacao: classificacao.nivel,
        emoji_qualidade: classificacao.emoji,
        prioridade: classificacao.prioridade
      };
    });
    
    // Filtrar por pontuação mínima
    const produtosFiltrados = produtosAnalisados.filter(p => p.pontuacao >= min_pontuacao);
    
    // Ordenar por pontuação (melhores primeiro)
    produtosFiltrados.sort((a, b) => b.pontuacao - a.pontuacao);
    
    // Limitar quantidade
    const topPicks = produtosFiltrados.slice(0, limite);
    
    res.json({
      status: "ok",
      total_analisados: produtos.length,
      total_qualificados: produtosFiltrados.length,
      total_retornados: topPicks.length,
      min_pontuacao,
      produtos: topPicks
    });
    
  } catch (error) {
    console.error("[Análise] Erro:", error);
    res.status(500).json({ status: "erro", mensagem: error.message });
  }
});

// ============================================
// ROTA: INFO DA API (atualizada)
// ============================================
app.get("/", (req, res) => {
  res.json({
    status: "online",
    versao: "10.0 - INTELIGENTE",
    novidades: [
      "🎨 Novas cores: Amazon azul, ML amarelo, Shein preto",
      "🧠 Sistema de pontuação inteligente",
      "🤖 Integração com Claude AI para mensagens",
      "🏪 Busca em lojas exclusivas Shein",
      "📊 Análise e ranking de produtos"
    ],
    endpoints: {
      // Existentes
      "GET /ofertas":          "Busca ofertas do dia (Mercado Livre)",
      "GET /ofertas/:categoria":"Busca ofertas por categoria (ML)",
      "GET /bugs":             "Bugs de preço no Mercado Livre",
      "GET /bugs/amazon":      "Bugs de preço na Amazon",
      "GET /bugs/shein":       "Bugs de preço na Shein",
      "GET /bugs/shopee":      "Bugs de preço na Shopee",
      "GET /amazon":           "Busca ofertas Amazon",
      "GET /shein":            "Busca produtos Shein",
      "GET /shopee":           "Busca produtos da Flash Sale Shopee",
      
      // Novos
      "GET /shein/lojas-exclusivas": "🆕 Busca lojas específicas Shein (?loja=linho-collection&limite=10)",
      "POST /gerar-mensagem":        "🆕 Gera mensagem com Claude AI {produto, plataforma}",
      "POST /analisar-produtos":     "🆕 Analisa e classifica produtos {produtos[], limite, min_pontuacao}",
      
      // Links de afiliado
      "POST /mercado-simples": "Gera link de afiliado ML simples",
      "POST /mercado-oficial": "Gera link meli.la oficial (ML)",
      "POST /amazon-link":     "Gera link de afiliado Amazon",
      "POST /shein-link":      "Gera link de afiliado Shein",
      "POST /shopee-link":     "Gera link de afiliado Shopee",
      
      // Busca avançada
      "POST /amazon-buscar":   "Busca produtos via Creators API",
      "POST /amazon-produto":  "Detalhes de produto por ASIN",
      
      // TikTok
      "POST /tiktok/seguir":   "Segue um creator no TikTok",
      
      // Debug
      "GET /tiktok-screenshot":"Ver último screenshot do TikTok",
      "GET /debug-screenshot": "Ver último screenshot Shein",
      "GET /shopee-screenshot":"Ver último screenshot Shopee"
    },
    lojas_exclusivas_shein: Object.keys(SHEIN_LOJAS_EXCLUSIVAS)
  });
});

// ============================================
// INICIAR SERVIDOR
// ============================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor INTELIGENTE rodando na porta ${PORT}`);
  console.log(`📊 Sistema de pontuação: ATIVO`);
  console.log(`🤖 Claude AI: ${CLAUDE_API_KEY ? 'CONFIGURADO ✅' : 'NÃO CONFIGURADO ⚠️'}`);
  console.log(`🏪 Lojas Shein exclusivas: ${Object.keys(SHEIN_LOJAS_EXCLUSIVAS).length} disponíveis`);
});
