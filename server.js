// ============================================
// IMPORTS E CONFIGURAÇÃO INICIAL
// ============================================
require("dotenv").config();
const express  = require("express");
const { chromium } = require("playwright");
const fs   = require("fs");
const path = require("path");

const app = express();
app.use(express.json());

// ============================================
// VARIÁVEIS DE AMBIENTE
// ============================================
const AMAZON_TAG             = process.env.AMAZON_TAG            || "giseleramosd-20";
const SHOPEE_AFFILIATE       = process.env.SHOPEE_AFFILIATE      || "";
const SHEIN_MEMBER_ID        = process.env.SHEIN_MEMBER_ID       || "1180825914";
const CREATORS_CLIENT_ID     = process.env.AMAZON_CLIENT_ID;
const CREATORS_CLIENT_SECRET = process.env.AMAZON_CLIENT_SECRET;
const CLAUDE_API_KEY         = process.env.CLAUDE_API_KEY        || "";
const ML_TRACKING_ID         = process.env.ML_TRACKING_ID        || "ragi6098412";
const ML_COOKIE              = process.env.ML_COOKIE             || "";

if (!CREATORS_CLIENT_ID || !CREATORS_CLIENT_SECRET) {
  console.warn("⚠️  Credenciais Amazon não encontradas — endpoints Amazon estarão indisponíveis.");
}

// ============================================
// PALETA DE CORES / PLATAFORMAS
// ============================================
const PLATFORM_STYLES = {
  amazon: {
    emoji: "🔵",
    cor_urgencia: "🔵⚡",
    nome: "AMAZON",
    tag: "#Amazon"
  },
  mercado_livre: {
    emoji: "💛",
    cor_urgencia: "💛⚡",
    nome: "MERCADO LIVRE",
    tag: "#MercadoLivre"
  },
  shopee: {
    emoji: "🧡",
    cor_urgencia: "🧡⚡",
    nome: "SHOPEE",
    tag: "#Shopee"
  },
  shein: {
    emoji: "⚫",
    cor_urgencia: "⚫⚡",
    nome: "SHEIN",
    tag: "#Shein"
  }
};

// ============================================
// LOJAS EXCLUSIVAS SHEIN
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
// COOKIES DO TIKTOK
// ============================================
const TIKTOK_COOKIES = [
  { name: "tt_csrf_token",               value: "fMWbLlP0-bWNFgfrqY75qGjQbytPs6rzPsDs",              domain: ".tiktok.com", path: "/" },
  { name: "tt_chain_token",              value: "oe5Yl/GgqqzePSSaHElF8A==",                           domain: ".tiktok.com", path: "/" },
  { name: "tiktok_webapp_theme",         value: "light",                                               domain: ".tiktok.com", path: "/" },
  { name: "_ttp",                        value: "3DRa9EVRr1RMt7h1r6VYkwMNaWx",                        domain: ".tiktok.com", path: "/" },
  { name: "ttwid",                       value: "1%7CDQCkOWjH-OZvFdBtE87cPnUIlLQRspfKE2MKDjB2fgM%7C1779027682%7Cdddd86f6c08a1f9b723c828903d7ea59d69f7acdbca9c7de61dcdc45b5d9a687", domain: ".tiktok.com", path: "/" },
  { name: "passport_csrf_token",         value: "981f81810312de1423936c841f0b4afe",                   domain: ".tiktok.com", path: "/" },
  { name: "passport_csrf_token_default", value: "981f81810312de1423936c841f0b4afe",                   domain: ".tiktok.com", path: "/" },
  { name: "uid_tt",                      value: "0414977c1e340a04e97450597f97e75584baaa144b59628e16459ca144eb8ff6", domain: ".tiktok.com", path: "/" },
  { name: "uid_tt_ss",                   value: "0414977c1e340a04e97450597f97e75584baaa144b59628e16459ca144eb8ff6", domain: ".tiktok.com", path: "/" },
  { name: "sid_tt",                      value: "519dd02c7106b721031c189231aee9bb",                   domain: ".tiktok.com", path: "/" },
  { name: "sessionid",                   value: "519dd02c7106b721031c189231aee9bb",                   domain: ".tiktok.com", path: "/" },
  { name: "sessionid_ss",                value: "519dd02c7106b721031c189231aee9bb",                   domain: ".tiktok.com", path: "/" },
  { name: "sid_guard",                   value: "519dd02c7106b721031c189231aee9bb%7C1779027677%7C15552000%7CFri%2C+13-Nov-2026+14%3A21%3A17+GMT", domain: ".tiktok.com", path: "/" },
  { name: "odin_tt",                     value: "933414d585ba224a790475d9cb1269e248c03f862db14e20877cd5569c5b372ea2abe0157ae472dfb2a26406db440b5419f9444178e30e0cc98fc39b3267bcea146af0134fa97d7c043a34f75ed98841", domain: ".tiktok.com", path: "/" },
  { name: "store-country-code",          value: "br",                                                 domain: ".tiktok.com", path: "/" },
  { name: "timezone_name",              value: "America%2FSao_Paulo",                                 domain: ".tiktok.com", path: "/" }
];

// ============================================
// TOKEN AMAZON CREATORS API (cache em memória)
// ============================================
let creatorsToken       = null;
let creatorsTokenExpiry = null;

async function getCreatorsToken() {
  const agora = Date.now();
  if (creatorsToken && creatorsTokenExpiry && agora < creatorsTokenExpiry - 60000) {
    console.log("🔑 Reutilizando token Creators API");
    return creatorsToken;
  }
  console.log("🔄 Buscando novo token Creators API...");
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
  console.log("✅ Token Creators API obtido com sucesso");
  return creatorsToken;
}

// ============================================
// HELPER: ABRIR BROWSER COM STEALTH
// ============================================
async function abrirBrowser() {
  return await chromium.launch({
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
}

// ============================================
// SISTEMA DE PONTUAÇÃO DE PRODUTOS
// ============================================
function calcularPontuacaoProduto(item) {
  let pontuacao = 0;

  const rating = parseFloat(item.avaliacao) || 0;
  if (rating >= 4.8)      pontuacao += 50;
  else if (rating >= 4.5) pontuacao += 35;
  else if (rating >= 4.0) pontuacao += 20;
  else if (rating >= 3.5) pontuacao += 10;

  const desconto = parseFloat((item.desconto || "").toString().replace(/[^\d.,]/g, "").replace(",", ".")) || 0;
  if (desconto >= 60)      pontuacao += 40;
  else if (desconto >= 40) pontuacao += 30;
  else if (desconto >= 20) pontuacao += 15;

  const avaliacoes = parseInt((item.qtd_avaliacoes || item.num_reviews || "").toString().replace(/[^\d]/g, "")) || 0;
  if (avaliacoes >= 1000)     pontuacao += 30;
  else if (avaliacoes >= 500) pontuacao += 20;
  else if (avaliacoes >= 100) pontuacao += 10;

  if (item.mais_vendido)  pontuacao += 15;
  if (item.frete_gratis)  pontuacao += 10;

  const vendidos = parseInt((item.qtd_vendidos || item.vendidos || "").toString().replace(/[^\d]/g, "")) || 0;
  if (vendidos >= 1000)     pontuacao += 25;
  else if (vendidos >= 500) pontuacao += 15;
  else if (vendidos >= 100) pontuacao += 5;

  return Math.min(pontuacao, 150);
}

function classificarProduto(pontuacao) {
  if (pontuacao >= 100) return { nivel: "PREMIUM",   emoji: "💎", prioridade: 1 };
  if (pontuacao >= 70)  return { nivel: "EXCELENTE", emoji: "🌟", prioridade: 2 };
  if (pontuacao >= 50)  return { nivel: "BOM",       emoji: "✅", prioridade: 3 };
  if (pontuacao >= 30)  return { nivel: "REGULAR",   emoji: "⚠️", prioridade: 4 };
  return                       { nivel: "BAIXO",     emoji: "❌", prioridade: 5 };
}

// ============================================
// DETECÇÃO DE BUGS DE PREÇO
// ============================================
function detectarBugML(item) {
  const titulo  = (item.titulo || "").toLowerCase();
  const desconto = parseFloat((item.desconto || "").toString().replace(/[^\d.,]/g, "").replace(",", ".")) || 0;
  const preco   = item.preco || 0;
  const razoes  = [];

  if (desconto >= 70) razoes.push(`Desconto de ${desconto}% (acima de 70%)`);
  if (titulo.includes("iphone")      && preco > 0 && preco < 1800) razoes.push(`iPhone por R$${preco} (suspeito abaixo de R$1.800)`);
  if (titulo.includes("notebook")    && preco > 0 && preco < 1500) razoes.push(`Notebook por R$${preco} (suspeito abaixo de R$1.500)`);
  if (titulo.includes("playstation") && preco > 0 && preco < 2500) razoes.push(`PlayStation por R$${preco} (suspeito abaixo de R$2.500)`);
  if (titulo.includes("macbook")     && preco > 0 && preco < 3000) razoes.push(`MacBook por R$${preco} (suspeito abaixo de R$3.000)`);
  if (titulo.includes("tv") && titulo.includes("55") && preco > 0 && preco < 1200) razoes.push(`TV 55" por R$${preco} (suspeito abaixo de R$1.200)`);
  if (titulo.includes("air fryer")   && preco > 0 && preco < 80)   razoes.push(`Air Fryer por R$${preco} (suspeito abaixo de R$80)`);
  if (titulo.includes("robô") && titulo.includes("aspirador") && preco > 0 && preco < 300) razoes.push(`Robô aspirador por R$${preco} (suspeito abaixo de R$300)`);

  if (razoes.length === 0) return null;
  const pontuacao     = calcularPontuacaoProduto(item);
  const classificacao = classificarProduto(pontuacao);
  return { ...item, plataforma: "mercado_livre", razoes_bug: razoes, pontuacao, classificacao: classificacao.nivel };
}

function detectarBugAmazon(item) {
  const titulo = (item.titulo || "").toLowerCase();
  const preco  = item.preco || 0;
  const razoes = [];

  if (preco <= 0) return null;
  if (titulo.includes("iphone")   && preco < 2000) razoes.push(`iPhone por R$${preco} (suspeito abaixo de R$2.000)`);
  if (titulo.includes("kindle")   && preco < 150)  razoes.push(`Kindle por R$${preco} (suspeito abaixo de R$150)`);
  if (titulo.includes("echo") && titulo.includes("dot") && preco < 60) razoes.push(`Echo Dot por R$${preco} (suspeito abaixo de R$60)`);
  if ((titulo.includes("notebook") || titulo.includes("laptop")) && preco < 1800) razoes.push(`Notebook por R$${preco} (suspeito abaixo de R$1.800)`);
  if (titulo.includes("fone") && titulo.includes("bluetooth") && preco < 30) razoes.push(`Fone Bluetooth por R$${preco} (suspeito abaixo de R$30)`);
  if (titulo.includes("câmera")   && preco < 500)  razoes.push(`Câmera por R$${preco} (suspeito abaixo de R$500)`);
  if (titulo.includes("monitor")  && preco < 400)  razoes.push(`Monitor por R$${preco} (suspeito abaixo de R$400)`);
  if (titulo.includes("smartwatch") && preco < 80) razoes.push(`Smartwatch por R$${preco} (suspeito abaixo de R$80)`);
  if (titulo.includes("galaxy") && titulo.includes("s") && preco < 1500) razoes.push(`Galaxy S por R$${preco} (suspeito abaixo de R$1.500)`);

  if (razoes.length === 0) return null;
  const pontuacao     = calcularPontuacaoProduto(item);
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
  if ((titulo.includes("maquiagem") || titulo.includes("makeup")) && preco < 8)             razoes.push(`Maquiagem por R$${preco} (suspeito abaixo de R$8)`);
  if ((titulo.includes("conjunto") || titulo.includes("set")) && preco < 20)               razoes.push(`Conjunto por R$${preco} (suspeito abaixo de R$20)`);
  if ((titulo.includes("calça") || titulo.includes("pants")) && preco < 15)                razoes.push(`Calça por R$${preco} (suspeito abaixo de R$15)`);

  if (razoes.length === 0) return null;
  const pontuacao     = calcularPontuacaoProduto(item);
  const classificacao = classificarProduto(pontuacao);
  return { ...item, plataforma: "shein", razoes_bug: razoes, pontuacao, classificacao: classificacao.nivel };
}

function detectarBugShopee(item) {
  const titulo = (item.titulo || "").toLowerCase();
  const preco  = item.preco || 0;
  const razoes = [];

  if (preco <= 0) return null;
  if (preco < 1) razoes.push(`Produto por R$${preco} (abaixo de R$1 — possível bug de cadastro)`);
  if (titulo.includes("iphone")   && preco < 1500) razoes.push(`iPhone por R$${preco} (suspeito abaixo de R$1.500)`);
  if ((titulo.includes("notebook") || titulo.includes("laptop")) && preco < 1200) razoes.push(`Notebook por R$${preco} (suspeito abaixo de R$1.200)`);
  if (titulo.includes("smartwatch") && preco < 50) razoes.push(`Smartwatch por R$${preco} (suspeito abaixo de R$50)`);
  if (titulo.includes("fone") && titulo.includes("bluetooth") && preco < 15) razoes.push(`Fone Bluetooth por R$${preco} (suspeito abaixo de R$15)`);
  if ((titulo.includes("air fryer") || titulo.includes("airfryer")) && preco < 60) razoes.push(`Air Fryer por R$${preco} (suspeito abaixo de R$60)`);
  if (titulo.includes("robô") && titulo.includes("aspirador") && preco < 200) razoes.push(`Robô aspirador por R$${preco} (suspeito abaixo de R$200)`);
  if ((titulo.includes("tênis") || titulo.includes("tenis")) && preco < 20) razoes.push(`Tênis por R$${preco} (suspeito abaixo de R$20)`);
  if (titulo.includes("perfume")  && preco < 30)  razoes.push(`Perfume por R$${preco} (suspeito abaixo de R$30)`);
  if (titulo.includes("tablet")   && preco < 300) razoes.push(`Tablet por R$${preco} (suspeito abaixo de R$300)`);
  if ((titulo.includes("câmera") || titulo.includes("camera")) && preco < 100) razoes.push(`Câmera por R$${preco} (suspeito abaixo de R$100)`);
  if (titulo.includes("monitor")  && preco < 200) razoes.push(`Monitor por R$${preco} (suspeito abaixo de R$200)`);

  if (razoes.length === 0) return null;
  const pontuacao     = calcularPontuacaoProduto(item);
  const classificacao = classificarProduto(pontuacao);
  return { ...item, plataforma: "shopee", razoes_bug: razoes, pontuacao, classificacao: classificacao.nivel };
}

// ============================================
// GERAR MENSAGEM COM CLAUDE AI
// ============================================
async function gerarMensagemComIA(produto, plataforma) {
  if (!CLAUDE_API_KEY) {
    return gerarMensagemPadrao(produto, plataforma);
  }
  try {
    const style  = PLATFORM_STYLES[plataforma] || PLATFORM_STYLES.amazon;
    const prompt = `Você é um especialista em marketing de afiliados no Brasil.
Crie uma mensagem ATRATIVA e PERSUASIVA para WhatsApp/Telegram com este produto:

PRODUTO: ${produto.titulo}
PLATAFORMA: ${style.nome}
PREÇO: R$ ${produto.preco}
${produto.preco_original ? `PREÇO ORIGINAL: R$ ${produto.preco_original}` : ""}
${produto.desconto ? `DESCONTO: ${produto.desconto}%` : ""}
${produto.avaliacao ? `AVALIAÇÃO: ${produto.avaliacao}/5` : ""}
${produto.qtd_avaliacoes || produto.num_reviews ? `AVALIAÇÕES: ${produto.qtd_avaliacoes || produto.num_reviews}` : ""}

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
        "Content-Type":    "application/json",
        "x-api-key":       CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model:      "claude-sonnet-4-20250514",
        max_tokens: 1024,
        messages:   [{ role: "user", content: prompt }]
      })
    });
    if (!response.ok) throw new Error(`Claude API erro: ${response.status}`);
    const data = await response.json();
    return data.content[0].text;
  } catch (error) {
    console.error("[IA] Erro ao gerar mensagem:", error.message);
    return gerarMensagemPadrao(produto, plataforma);
  }
}

// ============================================
// GERAR MENSAGEM PADRÃO (fallback sem IA)
// ============================================
function gerarMensagemPadrao(produto, plataforma) {
  const style         = PLATFORM_STYLES[plataforma] || PLATFORM_STYLES.amazon;
  const pontuacao     = calcularPontuacaoProduto(produto);
  const classificacao = classificarProduto(pontuacao);
  let mensagem = `${style.emoji} *${style.nome}* ${style.emoji}\n\n`;
  mensagem += `${classificacao.emoji} *${classificacao.nivel}*\n\n`;
  mensagem += `*${produto.titulo}*\n\n`;
  mensagem += `💰 *PREÇO:*\n`;
  if (produto.preco_original && produto.desconto) {
    mensagem += `De: ~R$ ${produto.preco_original}~\n`;
    mensagem += `*Por: R$ ${produto.preco}* (${produto.desconto}% OFF)\n\n`;
  } else {
    mensagem += `*R$ ${produto.preco}*\n\n`;
  }
  if (produto.avaliacao) {
    const estrelas = "⭐".repeat(Math.floor(produto.avaliacao));
    mensagem += `${estrelas} ${produto.avaliacao}/5`;
    if (produto.qtd_avaliacoes || produto.num_reviews) {
      mensagem += ` (${produto.qtd_avaliacoes || produto.num_reviews} avaliações)`;
    }
    mensagem += `\n\n`;
  }
  if (produto.qtd_vendidos || produto.vendidos) {
    mensagem += `🔥 *${produto.qtd_vendidos || produto.vendidos}* vendidos!\n\n`;
  }
  mensagem += `🛒 *COMPRAR AGORA:*\n`;
  mensagem += `👉 ${produto.link}\n\n`;
  mensagem += `⏰ *Oferta por tempo limitado!*\n\n`;
  mensagem += `${style.tag} #Ofertas #Desconto\n`;
  mensagem += `━━━━━━━━━━━━━━━━━━`;
  return mensagem;
}

// ============================================
// TEMPLATES DE ALERTA DE BUG
// ============================================
function gerarAlertaBugCritico(produto, plataforma) {
  const style = PLATFORM_STYLES[plataforma] || PLATFORM_STYLES.amazon;
  let mensagem = `🚨🚨🚨 *ALERTA DE BUG* 🚨🚨🚨\n`;
  mensagem += `${style.cor_urgencia} *${style.nome}* ${style.cor_urgencia}\n\n`;
  mensagem += `⚠️ *ATENÇÃO: ERRO DE PREÇO DETECTADO!*\n\n━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  mensagem += `📦 *PRODUTO:*\n${produto.titulo}\n\n💰 *PREÇO COM BUG:*\n`;
  if (produto.preco_original && produto.preco_original > 0) {
    const economia = (produto.preco_original - produto.preco).toFixed(2);
    mensagem += `~R$ ${produto.preco_original}~ → *R$ ${produto.preco}*\n`;
    mensagem += `💎 *ECONOMIA: R$ ${economia}*\n`;
    if (produto.desconto) mensagem += `🔥 *${produto.desconto}% OFF*\n`;
  } else {
    mensagem += `*R$ ${produto.preco}* ⚡\n`;
  }
  mensagem += `\n`;
  if (produto.razoes_bug && produto.razoes_bug.length > 0) {
    mensagem += `❗ *POR QUE É BUG:*\n`;
    produto.razoes_bug.forEach((r, i) => { mensagem += `${i + 1}. ${r}\n`; });
    mensagem += `\n`;
  }
  if (produto.avaliacao) {
    const estrelas = "⭐".repeat(Math.floor(produto.avaliacao));
    mensagem += `${estrelas} *${produto.avaliacao}/5*`;
    if (produto.qtd_avaliacoes || produto.num_reviews) mensagem += ` (${produto.qtd_avaliacoes || produto.num_reviews} avaliações)`;
    mensagem += `\n\n`;
  }
  mensagem += `⏰ *COMPRE IMEDIATAMENTE!*\n`;
  mensagem += `⚡ *BUG PODE SER CORRIGIDO A QUALQUER MOMENTO!*\n\n`;
  mensagem += `🛒 *LINK DIRETO:*\n👉 ${produto.link}\n\n`;
  mensagem += `🎯 *COMO COMPRAR RÁPIDO:*\n1️⃣ Clique no link agora\n2️⃣ Adicione ao carrinho\n3️⃣ Finalize RÁPIDO antes que corrijam\n\n`;
  mensagem += `⚠️ *NÃO PERCA TEMPO!*\n\n━━━━━━━━━━━━━━━━━━━━━━\n`;
  mensagem += `#BugDePreço #Urgente #CompraAgora ${style.emoji} #${style.nome.replace(" ", "")}`;
  return mensagem;
}

// ============================================
// ROTA RAIZ — INFO DA API
// ============================================
app.get("/", (req, res) => {
  res.json({
    status:  "online",
    versao:  "11.0 - UNIFICADO",
    endpoints: {
      // Mercado Livre
      "GET /ofertas":               "Busca ofertas do dia (ML)",
      "GET /ofertas/:categoria":    "Busca ofertas por categoria (ML)",
      "GET /bugs":                  "Detecta bugs de preço (ML)",
      "POST /mercado-simples":      "Gera link de afiliado simples (ML)",
      "POST /mercado":              "Gera link de afiliado (tenta encurtar) (ML)",
      "POST /mercado-oficial":      "Gera link meli.la oficial (ML)",
      // Amazon
      "GET /amazon":                "Busca ofertas Amazon (Playwright)",
      "GET /bugs/amazon":           "Detecta bugs de preço (Amazon)",
      "POST /amazon-link":          "Gera link de afiliado Amazon",
      "POST /amazon-buscar":        "Busca produtos via Creators API",
      "POST /amazon-produto":       "Detalhes de produto por ASIN",
      "POST /encurtar-link":        "Encurta link Amazon (SiteStripe)",
      // Shopee
      "GET /shopee":                "Busca Flash Sale Shopee",
      "GET /bugs/shopee":           "Detecta bugs de preço (Shopee)",
      "POST /shopee-link":          "Gera link de afiliado Shopee",
      // Shein
      "GET /shein":                 "Busca produtos Shein",
      "GET /shein/lojas-exclusivas":"Busca lojas exclusivas Shein",
      "GET /bugs/shein":            "Detecta bugs de preço (Shein)",
      "POST /shein-link":           "Gera link de afiliado Shein",
      // IA e análise
      "POST /gerar-mensagem":       "Gera mensagem de oferta com Claude AI",
      "POST /analisar-produtos":    "Classifica e ranqueia produtos por pontuação",
      // TikTok
      "POST /tiktok/seguir":        "Segue um creator no TikTok"
    },
    lojas_exclusivas_shein: Object.keys(SHEIN_LOJAS_EXCLUSIVAS)
  });
});

// ============================================
// MERCADO LIVRE — OFERTAS POR CATEGORIA
// ============================================
app.get("/ofertas/:categoria", async (req, res) => {

  try {

    const { categoria } = req.params;

    // =====================================
    // URLs POR CATEGORIA
    // =====================================
    const urlsPorCategoria = {

      beleza:
        "https://lista.mercadolivre.com.br/beleza-cuidado-pessoal",

      moda:
        "https://lista.mercadolivre.com.br/moda-acessorios",

      suplementos:
        "https://lista.mercadolivre.com.br/suplementos-proteinas",

      casa:
        "https://lista.mercadolivre.com.br/casa-moveis-decoracao",

      skincare:
        "https://lista.mercadolivre.com.br/skincare",

      maquiagem:
        "https://lista.mercadolivre.com.br/maquiagem",

      organizadores:
        "https://lista.mercadolivre.com.br/organizadores",

      cozinha:
        "https://lista.mercadolivre.com.br/cozinha",

      academia:
        "https://lista.mercadolivre.com.br/academia",

      eletronicos:
        "https://lista.mercadolivre.com.br/eletronicos",

      ofertas:
        "https://www.mercadolivre.com.br/ofertas"

    };

    const url =
      urlsPorCategoria[categoria] ||
      urlsPorCategoria["ofertas"];

    console.log(`🔄 Categoria: ${categoria}`);
    console.log(`🌐 URL: ${url}`);

    // =====================================
    // ABRIR BROWSER
    // =====================================
    const browser = await abrirBrowser();

    const context = await browser.newContext({

      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",

      viewport: {
        width: 1920,
        height: 1080
      },

      locale: "pt-BR"

    });

    const page = await context.newPage();

    // =====================================
    // ABRIR PÁGINA
    // =====================================
    await page.goto(url, {

      waitUntil: "domcontentloaded",
      timeout: 30000

    });

    // =====================================
    // ESPERA CARREGAR
    // =====================================
    await page.waitForSelector("[class*='poly-card']", {

      timeout: 15000

    });

    // =====================================
    // SIMULA USUÁRIO
    // =====================================
    await page.mouse.wheel(0, 2000);

    await page.waitForTimeout(3000);

    // =====================================
    // EXTRAÇÃO
    // =====================================
    const produtos = await page.evaluate(() => {

      const items = [];

      // =====================================
      // PEGA CARDS
      // =====================================
      const cards = Array.from(

        document.querySelectorAll(
          "[class*='poly-card']"
        )

      );

      console.log("CARDS:", cards.length);

      // =====================================
      // LOOP DOS PRODUTOS
      // =====================================
      cards.forEach((card, index) => {

        try {

          // =================================
          // IGNORA CARD SEM TÍTULO
          // =================================
          if (
            !card.querySelector(
              ".poly-component__title"
            )
          ) {
            return;
          }

          // =================================
          // TÍTULO
          // =================================
          const tituloEl = card.querySelector(
            ".poly-component__title"
          );

          const titulo = tituloEl
            ? tituloEl.textContent.trim()
            : "";

          // =================================
          // PREÇO
          // =================================
          const precoEl = card.querySelector(
            ".andes-money-amount__fraction"
          );

          const preco = precoEl
            ? parseFloat(

                precoEl.textContent
                  .trim()
                  .replace(/[^\d,]/g, "")
                  .replace(",", ".")

              )
            : 0;

          // =================================
          // PREÇO ORIGINAL
          // =================================
          const precoOrigEl = card.querySelector(

            "s .andes-money-amount__fraction, .andes-money-amount--previous .andes-money-amount__fraction"

          );

          const preco_original = precoOrigEl
            ? parseFloat(

                precoOrigEl.textContent
                  .trim()
                  .replace(/[^\d,]/g, "")
                  .replace(",", ".")

              )
            : preco;

          // =================================
          // DESCONTO
          // =================================
          const desconto =

            card.querySelector(
              ".poly-price__disc_label, [class*='discount'], [class*='off']"
            )?.textContent?.trim() || "";

          // =================================
          // PARCELAS
          // =================================
          const parcelas =

            card.querySelector(
              ".poly-price__installments, [class*='installment']"
            )?.textContent?.trim() || "";

          // =================================
          // AVALIAÇÃO
          // =================================
          const avaliacao = parseFloat(

            card.querySelector(
              ".poly-reviews__rating, [class*='rating']"
            )?.textContent?.trim()

          ) || 0;

          // =================================
          // QUANTIDADE DE AVALIAÇÕES
          // =================================
          const qtd_avaliacoes =

            card.querySelector(
              ".poly-reviews__total, [class*='reviews__total']"
            )?.textContent?.replace(/[^\d]/g, "") || "";

          // =================================
          // FRETE
          // =================================
          const freteEl = card.querySelector(

            ".poly-component__shipping, [class*='shipping']"

          );

          const frete_gratis = freteEl
            ? freteEl.textContent
                .toLowerCase()
                .includes("grátis")
            : false;

          // =================================
          // LINK
          // =================================
          const link =

            card.querySelector("a")?.href || "";

          // =================================
          // IMAGEM
          // =================================
          const imagem =

            card.querySelector("img")?.src ||

            card.querySelector("img")
              ?.getAttribute("data-src") ||

            "";

          // =================================
          // FILTROS
          // =================================

          // PREÇO MÍNIMO
          if (preco < 20) return;

          // AVALIAÇÃO
          if (
            avaliacao > 0 &&
            avaliacao < 4.0
          ) {
            return;
          }

          // TÍTULO
          if (
            !titulo ||
            titulo.length < 5
          ) {
            return;
          }

          // LINK
          if (
            !link.includes("MLB") &&
            !link.includes("mercadolivre")
          ) {
            return;
          }

          // =================================
          // BLACKLIST
          // =================================
          const blacklist = [

            "película",
            "cabo",
            "adaptador",
            "conector",
            "adesivo",
            "refil",
            "parafuso"

          ];

          if (

            blacklist.some(p =>

              titulo
                .toLowerCase()
                .includes(p)

            )

          ) {
            return;
          }

          // =================================
          // SALVAR
          // =================================
          items.push({

            titulo,
            preco,
            preco_original,
            desconto,
            parcelas,
            avaliacao,
            qtd_avaliacoes,
            frete_gratis,
            link,
            imagem,
            posicao: index + 1

          });

        } catch (e) {

          console.log(
            `Erro no card ${index}:`,
            e.message
          );

        }

      });

      // =====================================
      // REMOVE DUPLICADOS
      // =====================================
      const vistos = new Set();

      return items.filter(p => {

        const id =
          p.link.match(/MLB\d+/)?.[0];

        if (!id) return false;

        if (vistos.has(id)) {
          return false;
        }

        vistos.add(id);

        return true;

      });

    });

    // =====================================
    // FECHAR BROWSER
    // =====================================
    await browser.close();

    console.log(
      `✅ ${produtos.length} produtos encontrados`
    );

    // =====================================
    // RESPOSTA
    // =====================================
    res.json({

      status: "ok",
      categoria,
      total: produtos.length,
      data_extracao: new Date().toISOString(),
      produtos

    });

  } catch (error) {

    console.error(
      "❌ ERRO ML:",
      error.message
    );

    res.status(500).json({

      status: "erro",
      mensagem: error.message

    });

  }

});

// ============================================
// MERCADO LIVRE — DETECTAR BUGS DE PREÇO
// ============================================
app.get("/bugs", async (req, res) => {
  try {
    console.log("🔄 [ML] Detectando bugs de preço...");
    const browser = await abrirBrowser();
    const context = await browser.newContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      viewport:  { width: 1920, height: 1080 },
      locale:    "pt-BR"
    });
    const page = await context.newPage();
    await page.goto("https://www.mercadolivre.com.br/ofertas", { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(3000);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);

    const todos = await page.evaluate(() => {
      const items = [];
      const cards = Array.from(document.querySelectorAll("article, div[class*='promotion-item'], div.poly-card, li.poly-component__item"));
      cards.forEach((card, i) => {
        try {
          const titulo = card.querySelector("h2, h3, [class*='title']")?.textContent?.trim() || "";
          const precoTxt = card.querySelector(".andes-money-amount__fraction, [class*='price']")?.textContent?.trim() || "";
          const preco = parseFloat(precoTxt.replace(/[^\d,]/g, "").replace(",", ".")) || 0;
          const precoOrigEl = card.querySelector("s .andes-money-amount__fraction, .andes-money-amount--previous .andes-money-amount__fraction");
          const preco_original = precoOrigEl ? parseFloat(precoOrigEl.textContent.trim().replace(/[^\d,]/g, "").replace(",", ".")) : 0;
          const desconto = card.querySelector("[class*='discount'], [class*='off']")?.textContent?.trim() || "";
          const avaliacao = parseFloat(card.querySelector("[class*='rating']")?.textContent?.trim()) || 0;
          const link = card.querySelector("a")?.href || "";
          const imagem = card.querySelector("img")?.src || "";
          if (titulo && preco > 0 && link) items.push({ titulo, preco, preco_original, desconto, avaliacao, link, imagem, posicao: i + 1 });
        } catch (e) {}
      });
      return items;
    });

    await browser.close();
    const bugs = todos.map(detectarBugML).filter(Boolean);
    bugs.sort((a, b) => b.pontuacao - a.pontuacao);
    res.json({ status: "ok", plataforma: "mercado_livre", total_analisados: todos.length, total_bugs: bugs.length, data_extracao: new Date().toISOString(), bugs });
  } catch (error) {
    res.status(500).json({ status: "erro", mensagem: error.message });
  }
});

// ============================================
// MERCADO LIVRE — LINKS DE AFILIADO
// ============================================
app.post("/mercado-simples", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ status: "erro", mensagem: "URL do produto não fornecida" });
    if (!url.includes("mercadolivre.com") && !url.includes("mercadolibre.com")) {
      return res.status(400).json({ status: "erro", mensagem: "URL inválida — deve ser do Mercado Livre" });
    }
    const affiliateUrl = url.includes("?") ? `${url}&tracking_id=${ML_TRACKING_ID}` : `${url}?tracking_id=${ML_TRACKING_ID}`;
    res.json({ status: "ok", url_original: url, url_afiliado: affiliateUrl, tracking_id: ML_TRACKING_ID });
  } catch (error) {
    res.status(500).json({ status: "erro", mensagem: error.message });
  }
});

app.post("/mercado", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ status: "erro", mensagem: "URL não fornecida" });
    const affiliateUrl = url.includes("?") ? `${url}&tracking_id=${ML_TRACKING_ID}` : `${url}?tracking_id=${ML_TRACKING_ID}`;
    try {
      const browser = await abrirBrowser();
      const context = await browser.newContext();
      const page    = await context.newPage();
      await page.goto("https://www.mercadolivre.com.br/afiliados/linkbuilder#hub", { timeout: 15000 });
      const shortened = await page.evaluate(async (longUrl, tag) => {
        try {
          const r = await fetch("https://www.mercadolivre.com.br/affiliate-program/api/v2/affiliates/createLink", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ urls: [longUrl], tag })
          });
          return r.ok ? await r.json() : null;
        } catch (e) { return null; }
      }, url, ML_TRACKING_ID);
      await browser.close();
      if (shortened?.urls?.[0]) {
        return res.json({ status: "ok", url_original: url, url_afiliado: shortened.urls[0].short_url || affiliateUrl, url_encurtada: shortened.urls[0].short_url, tracking_id: ML_TRACKING_ID });
      }
    } catch (e) { console.log("⚠️ Não conseguiu encurtar, retornando link padrão"); }
    res.json({ status: "ok", url_original: url, url_afiliado: affiliateUrl, tracking_id: ML_TRACKING_ID, mensagem: "Link gerado (não encurtado)" });
  } catch (error) {
    res.status(500).json({ status: "erro", mensagem: error.message });
  }
});

app.post("/mercado-oficial", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ status: "erro", mensagem: "URL não fornecida" });
    const response = await fetch("https://www.mercadolivre.com.br/affiliate-program/api/v2/affiliates/createLink", {
      method:  "POST",
      headers: { "Content-Type": "application/json", "Cookie": ML_COOKIE, "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
      body:    JSON.stringify({ urls: [url], tag: ML_TRACKING_ID })
    });
    const data     = await response.json();
    const shortUrl = data.urls?.[0]?.short_url;
    res.json({ status: "ok", url_original: url, url_afiliado: shortUrl || url, meli_la: shortUrl });
  } catch (error) {
    res.status(500).json({ status: "erro", mensagem: error.message });
  }
});

// ============================================
// AMAZON — BUSCAR OFERTAS (Playwright)
// ============================================
app.get("/amazon", async (req, res) => {
  try {
    console.log("🔄 [Amazon] Buscando ofertas...");
    const browser = await abrirBrowser();
    const context = await browser.newContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      viewport:  { width: 1920, height: 1080 },
      locale:    "pt-BR",
      extraHTTPHeaders: { "Accept-Language": "pt-BR,pt;q=0.9" }
    });
    const page = await context.newPage();
    await page.goto("https://www.amazon.com.br/s?k=casa+e+decoracao&i=home&bbn=16209062011&rh=n%3A16209062011&dc&ref=sr_nr_n_1", { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(4000);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await page.waitForTimeout(2000);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);

    const produtos = await page.evaluate((tag) => {
      const items = [];
      const cards = Array.from(document.querySelectorAll("div[data-component-type='s-search-result']"));
      cards.forEach((card, index) => {
        try {
          const titulo       = card.querySelector("h2 a span, h2 span")?.textContent?.trim() || "";
          const precoInteiro = card.querySelector(".a-price-whole")?.textContent?.replace(/[^\d]/g, "") || "0";
          const precoFracao  = card.querySelector(".a-price-fraction")?.textContent?.replace(/[^\d]/g, "") || "00";
          const preco        = parseFloat(`${precoInteiro}.${precoFracao}`) || 0;
          const precoOrigTxt = card.querySelector(".a-text-price .a-offscreen")?.textContent?.trim() || "";
          const preco_original = parseFloat(precoOrigTxt.replace(/[^\d,]/g, "").replace(",", ".")) || 0;
          const desconto     = card.querySelector("span.a-letter-space + span, [class*='savingsPercentage']")?.textContent?.trim() || "";
          const avaliacaoTxt = card.querySelector("span.a-icon-alt")?.textContent?.trim() || "";
          const avaliacao    = parseFloat(avaliacaoTxt.replace(",", ".")) || 0;
          const num_reviews  = parseInt(card.querySelector("span[aria-label*='estrelas'] + span, a[href*='customerReviews'] span")?.textContent?.replace(/[^\d]/g, "")) || 0;
          const imagem       = card.querySelector("img.s-image")?.src || "";
          const linkEl       = card.querySelector("h2 a, a.a-link-normal");
          let link           = linkEl?.href || "";
          if (link && !link.startsWith("http")) link = "https://www.amazon.com.br" + link;
          const asin         = card.getAttribute("data-asin") || "";
          const frete_gratis = !!card.querySelector("i[aria-label='Amazon Prime'], [data-testid*='prime']");
          if (titulo && titulo.length > 3 && preco > 0) {
            items.push({ titulo, preco, preco_original, desconto, avaliacao, num_reviews, imagem, link, asin, frete_gratis, url_afiliado: `https://www.amazon.com.br/dp/${asin}?tag=${tag}`, posicao: index + 1 });
          }
        } catch (e) {}
      });
      return items;
    }, AMAZON_TAG);

    await browser.close();
    console.log(`✅ [Amazon] ${produtos.length} produtos extraídos`);
    res.json({ status: "ok", total: produtos.length, data_extracao: new Date().toISOString(), produtos });
  } catch (error) {
    console.error("❌ [Amazon] Erro:", error.message);
    res.status(500).json({ status: "erro", mensagem: error.message });
  }
});

// ============================================
// AMAZON — BUGS DE PREÇO
// ============================================
app.get("/bugs/amazon", async (req, res) => {
  try {
    const browser = await abrirBrowser();
    const context = await browser.newContext({ userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36", viewport: { width: 1920, height: 1080 }, locale: "pt-BR" });
    const page    = await context.newPage();
    await page.goto("https://www.amazon.com.br/deals", { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(4000);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);

    const todos = await page.evaluate((tag) => {
      const items = [];
      const cards = Array.from(document.querySelectorAll("div[data-component-type='s-search-result'], div[class*='DealCard']"));
      cards.forEach((card, i) => {
        try {
          const titulo       = card.querySelector("h2 a span, h2 span, [class*='title']")?.textContent?.trim() || "";
          const precoInteiro = card.querySelector(".a-price-whole")?.textContent?.replace(/[^\d]/g, "") || "0";
          const precoFracao  = card.querySelector(".a-price-fraction")?.textContent?.replace(/[^\d]/g, "") || "00";
          const preco        = parseFloat(`${precoInteiro}.${precoFracao}`) || 0;
          const precoOrigTxt = card.querySelector(".a-text-price .a-offscreen")?.textContent?.trim() || "";
          const preco_original = parseFloat(precoOrigTxt.replace(/[^\d,]/g, "").replace(",", ".")) || 0;
          const desconto     = card.querySelector("[class*='savingsPercentage'], span.a-letter-space + span")?.textContent?.trim() || "";
          const avaliacao    = parseFloat(card.querySelector("span.a-icon-alt")?.textContent?.replace(",", ".")) || 0;
          const asin         = card.getAttribute("data-asin") || "";
          const link         = asin ? `https://www.amazon.com.br/dp/${asin}?tag=${tag}` : (card.querySelector("h2 a")?.href || "");
          const imagem       = card.querySelector("img.s-image, img")?.src || "";
          if (titulo && preco > 0) items.push({ titulo, preco, preco_original, desconto, avaliacao, link, imagem, posicao: i + 1 });
        } catch (e) {}
      });
      return items;
    }, AMAZON_TAG);

    await browser.close();
    const bugs = todos.map(detectarBugAmazon).filter(Boolean);
    bugs.sort((a, b) => b.pontuacao - a.pontuacao);
    res.json({ status: "ok", plataforma: "amazon", total_analisados: todos.length, total_bugs: bugs.length, data_extracao: new Date().toISOString(), bugs });
  } catch (error) {
    res.status(500).json({ status: "erro", mensagem: error.message });
  }
});

// ============================================
// AMAZON — LINKS DE AFILIADO
// ============================================
app.post("/amazon-link", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ status: "erro", mensagem: "URL do produto não fornecida" });
    if (!url.includes("amazon.com.br") && !url.includes("amzn.to")) {
      return res.status(400).json({ status: "erro", mensagem: "URL inválida — deve ser da Amazon Brasil" });
    }
    const asinMatch = url.match(/\/dp\/([A-Z0-9]{10})|\/gp\/product\/([A-Z0-9]{10})/);
    const asin      = asinMatch ? (asinMatch[1] || asinMatch[2]) : "";
    const urlAfiliado = asin
      ? `https://www.amazon.com.br/dp/${asin}?tag=${AMAZON_TAG}`
      : (url.includes("?") ? `${url}&tag=${AMAZON_TAG}` : `${url}?tag=${AMAZON_TAG}`);
    res.json({ status: "ok", url_original: url, url_afiliado: urlAfiliado, asin: asin || "não encontrado", tag: AMAZON_TAG });
  } catch (error) {
    res.status(500).json({ status: "erro", mensagem: error.message });
  }
});

app.post("/encurtar-link", async (req, res) => {
  const { asin } = req.body;
  if (!asin) return res.status(400).json({ status: "erro", mensagem: "ASIN obrigatório" });
  const browser = await abrirBrowser();
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    extraHTTPHeaders: { "Accept-Language": "pt-BR,pt;q=0.9" }
  });
  await context.addCookies([
    { name: "session-id",  value: "132-2538792-9842543",  domain: ".amazon.com.br", path: "/" },
    { name: "ubid-acbbr", value: "134-1696896-9118130",   domain: ".amazon.com.br", path: "/" },
    { name: "lc-acbbr",   value: "pt_BR",                 domain: ".amazon.com.br", path: "/" },
    { name: "i18n-prefs", value: "BRL",                   domain: ".amazon.com.br", path: "/" }
  ]);
  const page = await context.newPage();
  try {
    const url = `https://www.amazon.com.br/associates/sitestripe/getShortUrl?asin=${asin}&tag=${AMAZON_TAG}&linkType=text`;
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
    const bodyText = await page.textContent("body");
    const json = JSON.parse(bodyText);
    await browser.close();
    if (json?.shortUrl) return res.json({ status: "ok", url_curta: json.shortUrl, asin });
    return res.json({ status: "erro", mensagem: "Link não gerado", resposta: json });
  } catch (err) {
    await browser.close();
    return res.status(500).json({ status: "erro", mensagem: err.message });
  }
});

// ============================================
// AMAZON — CREATORS API
// ============================================
app.post("/amazon-buscar", async (req, res) => {
  try {
    const { keywords, categoria = "All", pagina = 1 } = req.body;
    if (!keywords) return res.status(400).json({ status: "erro", mensagem: "Campo 'keywords' obrigatório" });
    const token   = await getCreatorsToken();
    const payload = {
      keywords, partnerTag: AMAZON_TAG, partnerType: "Associates", searchIndex: categoria,
      itemPage: pagina, itemCount: 10,
      resources: ["itemInfo.title", "itemInfo.byLineInfo", "offersV2.listings.price", "offersV2.listings.condition", "images.primary.medium", "customerReviews.count", "customerReviews.starRating", "itemInfo.features"],
      marketplace: "www.amazon.com.br", languagesOfPreference: ["pt_BR"]
    };
    const response = await fetch("https://affiliate-program.amazon.com/creatorapi/paapi5/searchitems", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}`, "x-marketplace": "www.amazon.com.br" },
      body:   JSON.stringify(payload)
    });
    if (!response.ok) {
      const erro = await response.text();
      return res.status(response.status).json({ status: "erro", mensagem: `Erro na Creators API: ${response.status}`, detalhe: erro });
    }
    const data    = await response.json();
    const produtos = (data.SearchResult?.Items || []).map((item, index) => ({
      asin:           item.ASIN || "",
      titulo:         item.ItemInfo?.Title?.DisplayValue || "",
      preco:          item.OffersV2?.Listings?.[0]?.Price?.Amount || 0,
      moeda:          item.OffersV2?.Listings?.[0]?.Price?.Currency || "BRL",
      preco_formatado:item.OffersV2?.Listings?.[0]?.Price?.DisplayAmount || "",
      imagem:         item.Images?.Primary?.Medium?.URL || "",
      avaliacao:      item.CustomerReviews?.StarRating?.Value || 0,
      num_reviews:    item.CustomerReviews?.Count || 0,
      url_afiliado:   `https://www.amazon.com.br/dp/${item.ASIN}?tag=${AMAZON_TAG}`,
      posicao:        index + 1
    }));
    res.json({ status: "ok", keywords, total: produtos.length, pagina, data_extracao: new Date().toISOString(), produtos });
  } catch (error) {
    res.status(500).json({ status: "erro", mensagem: error.message });
  }
});

app.post("/amazon-produto", async (req, res) => {
  try {
    const { asin } = req.body;
    if (!asin) return res.status(400).json({ status: "erro", mensagem: "Campo 'asin' obrigatório" });
    const token   = await getCreatorsToken();
    const payload = {
      itemIds: [asin], partnerTag: AMAZON_TAG, partnerType: "Associates",
      resources: ["itemInfo.title", "itemInfo.byLineInfo", "itemInfo.features", "offersV2.listings.price", "offersV2.listings.condition", "offersV2.listings.deliveryInfo.isPrimeEligible", "images.primary.large", "customerReviews.count", "customerReviews.starRating"],
      marketplace: "www.amazon.com.br", languagesOfPreference: ["pt_BR"]
    };
    const response = await fetch("https://affiliate-program.amazon.com/creatorapi/paapi5/getitems", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}`, "x-marketplace": "www.amazon.com.br" },
      body:   JSON.stringify(payload)
    });
    if (!response.ok) {
      const erro = await response.text();
      return res.status(response.status).json({ status: "erro", mensagem: `Erro na Creators API: ${response.status}`, detalhe: erro });
    }
    const data = await response.json();
    const item = data.ItemsResult?.Items?.[0];
    if (!item) return res.json({ status: "aviso", mensagem: "Produto não encontrado", asin });
    res.json({
      status: "ok", asin,
      titulo:          item.ItemInfo?.Title?.DisplayValue || "",
      preco:           item.OffersV2?.Listings?.[0]?.Price?.Amount || 0,
      preco_formatado: item.OffersV2?.Listings?.[0]?.Price?.DisplayAmount || "",
      prime:           item.OffersV2?.Listings?.[0]?.DeliveryInfo?.IsPrimeEligible || false,
      imagem:          item.Images?.Primary?.Large?.URL || "",
      avaliacao:       item.CustomerReviews?.StarRating?.Value || 0,
      num_reviews:     item.CustomerReviews?.Count || 0,
      features:        item.ItemInfo?.Features?.DisplayValues || [],
      url_afiliado:    `https://www.amazon.com.br/dp/${asin}?tag=${AMAZON_TAG}`,
      tag:             AMAZON_TAG
    });
  } catch (error) {
    res.status(500).json({ status: "erro", mensagem: error.message });
  }
});

// ============================================
// SHOPEE — FLASH SALE
// ============================================
app.get("/shopee", async (req, res) => {
  try {
    const { limite = 20 } = req.query;
    console.log("🔄 [Shopee] Buscando Flash Sale...");
    const browser = await abrirBrowser();
    const context = await browser.newContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      viewport:  { width: 1920, height: 1080 },
      locale:    "pt-BR"
    });
    const page = await context.newPage();
    await page.goto("https://shopee.com.br/flash_sale", { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(6000);
    try { await page.click('[class*="close"], .close-btn', { timeout: 3000 }); } catch (e) {}
    for (let i = 1; i <= 6; i++) {
      await page.evaluate((s) => window.scrollTo(0, (document.body.scrollHeight / 6) * s), i);
      await page.waitForTimeout(1500);
    }
    await page.waitForTimeout(2000);

    const produtos = await page.evaluate(() => {
      const items = [];
      const cards = Array.from(document.querySelectorAll("[class*='flash-sale-item'], [class*='FlashSaleItem'], [class*='product-item'], [class*='item-card']"));
      cards.forEach((card, index) => {
        try {
          const titulo     = card.querySelector("[class*='name'], [class*='title'], h3")?.textContent?.trim() || "";
          const precoTxt   = card.querySelector("[class*='price-sale'], [class*='discounted-price'], [class*='price']")?.textContent?.trim() || "";
          const preco      = parseFloat(precoTxt.replace(/[^\d.,]/g, "").replace(",", ".")) || 0;
          const precoOrigTxt = card.querySelector("[class*='price-before'], [class*='original-price'], s")?.textContent?.trim() || "";
          const preco_original = parseFloat(precoOrigTxt.replace(/[^\d.,]/g, "").replace(",", ".")) || 0;
          const desconto   = card.querySelector("[class*='discount'], [class*='off']")?.textContent?.trim() || "";
          const vendidos   = card.querySelector("[class*='sold'], [class*='vendido']")?.textContent?.trim() || "";
          const avaliacao  = parseFloat(card.querySelector("[class*='star'], [class*='rating']")?.textContent?.trim()) || 0;
          const linkEl     = card.closest("a") || card.querySelector("a");
          let link         = linkEl?.href || "";
          if (link && !link.startsWith("http")) link = "https://shopee.com.br" + link;
          const imagem     = card.querySelector("img")?.src || card.querySelector("img")?.getAttribute("data-src") || "";
          if (titulo && preco > 0 && link) {
            items.push({ titulo, preco, preco_original, desconto, vendidos, avaliacao, link, imagem, posicao: index + 1 });
          }
        } catch (e) {}
      });
      return items;
    });

    await browser.close();
    const comPontuacao = produtos.map(p => {
      const pontuacao     = calcularPontuacaoProduto(p);
      const classificacao = classificarProduto(pontuacao);
      return { ...p, pontuacao, classificacao: classificacao.nivel, emoji_qualidade: classificacao.emoji };
    });
    comPontuacao.sort((a, b) => b.pontuacao - a.pontuacao);
    const resultado = comPontuacao.slice(0, parseInt(limite));
    console.log(`✅ [Shopee] ${resultado.length} produtos`);
    res.json({ status: "ok", plataforma: "shopee", total: resultado.length, data_extracao: new Date().toISOString(), produtos: resultado });
  } catch (error) {
    console.error("❌ [Shopee] Erro:", error.message);
    res.status(500).json({ status: "erro", mensagem: error.message });
  }
});

// ============================================
// SHOPEE — BUGS DE PREÇO
// ============================================
app.get("/bugs/shopee", async (req, res) => {
  try {
    const browser = await abrirBrowser();
    const context = await browser.newContext({ userAgent: "Mozilla/5.0", viewport: { width: 1920, height: 1080 }, locale: "pt-BR" });
    const page    = await context.newPage();
    await page.goto("https://shopee.com.br/flash_sale", { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(6000);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);

    const todos = await page.evaluate(() => {
      const items = [];
      const cards = Array.from(document.querySelectorAll("[class*='flash-sale-item'], [class*='product-item']"));
      cards.forEach((card, i) => {
        try {
          const titulo   = card.querySelector("[class*='name'], [class*='title']")?.textContent?.trim() || "";
          const precoTxt = card.querySelector("[class*='price']")?.textContent?.trim() || "";
          const preco    = parseFloat(precoTxt.replace(/[^\d.,]/g, "").replace(",", ".")) || 0;
          const linkEl   = card.closest("a") || card.querySelector("a");
          const link     = linkEl?.href || "";
          if (titulo && preco > 0) items.push({ titulo, preco, link, posicao: i + 1 });
        } catch (e) {}
      });
      return items;
    });

    await browser.close();
    const bugs = todos.map(detectarBugShopee).filter(Boolean);
    bugs.sort((a, b) => b.pontuacao - a.pontuacao);
    res.json({ status: "ok", plataforma: "shopee", total_analisados: todos.length, total_bugs: bugs.length, data_extracao: new Date().toISOString(), bugs });
  } catch (error) {
    res.status(500).json({ status: "erro", mensagem: error.message });
  }
});

// ============================================
// SHOPEE — LINK DE AFILIADO
// ============================================
app.post("/shopee-link", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ status: "erro", mensagem: "URL não fornecida" });
    const affiliateUrl = SHOPEE_AFFILIATE ? `${url}?af_id=${SHOPEE_AFFILIATE}` : url;
    res.json({ status: "ok", url_original: url, url_afiliado: affiliateUrl });
  } catch (error) {
    res.status(500).json({ status: "erro", mensagem: error.message });
  }
});

// ============================================
// SHEIN — BUSCAR PRODUTOS
// ============================================
app.get("/shein", async (req, res) => {
  try {
    const { limite = 20 } = req.query;
    console.log("🔄 [Shein] Buscando produtos...");
    const browser = await abrirBrowser();
    const context = await browser.newContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      viewport:  { width: 1920, height: 1080 },
      locale:    "pt-BR"
    });
    await context.addCookies([
      { name: "memberId",        value: SHEIN_MEMBER_ID, domain: ".shein.com", path: "/" },
      { name: "sessionID_shein", value: "s%3A7S7sthaovE_Sy9eCpmLnzrOlwWc0Fwmi.37UHrLYj4Eq6Bfxhb4gOBJOuPly4kkpD32FjScputO4", domain: ".shein.com", path: "/" }
    ]);
    const page = await context.newPage();
    await page.goto("https://br.shein.com/Women-Dresses-cat-1727.html?sort=7", { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(6000);
    try { await page.click('[class*="close"]', { timeout: 3000 }); } catch (e) {}
    for (let i = 1; i <= 8; i++) {
      await page.evaluate((s) => window.scrollTo(0, (document.body.scrollHeight / 8) * s), i);
      await page.waitForTimeout(1200);
    }
    await page.waitForTimeout(2000);

    const produtos = await page.evaluate(() => {
      const items = [];
      const seletores = ["[da-eid]", ".product-item-v3", ".S-product-item", "div[class*='product-item']"];
      let cards = [];
      for (const sel of seletores) { cards = Array.from(document.querySelectorAll(sel)); if (cards.length > 0) break; }
      cards.forEach((card, index) => {
        try {
          const linkEl     = card.closest("a[href*='shein.com']") || card.querySelector("a[href*='shein.com']");
          const linkRaw    = linkEl ? linkEl.href : "";
          const idMatch    = linkRaw.match(/-p-(\d+)\.html/);
          const link       = idMatch ? `https://br.shein.com/p-p-${idMatch[1]}.html` : linkRaw.split("?")[0];
          const titulo     = card.querySelector("[class*='name'], [class*='title']")?.textContent?.trim() || "";
          const precoTxt   = card.querySelector("[class*='price-new'], [class*='sale-price']")?.textContent?.trim() || "";
          const preco      = parseFloat(precoTxt.replace("R$", "").replace(/\./g, "").replace(",", ".")) || 0;
          const precoOrigTxt = card.querySelector("[class*='price-del'], [class*='original-price']")?.textContent?.trim() || "";
          const preco_original = parseFloat(precoOrigTxt.replace("R$", "").replace(/\./g, "").replace(",", ".")) || 0;
          const desconto   = card.querySelector("[class*='discount'], [class*='off-percent']")?.textContent?.trim() || "";
          const avaliacao  = card.querySelector("[class*='star-num'], [class*='review-num']")?.textContent?.trim().replace(/[()]/g, "") || "";
          const vendidos   = card.querySelector("[class*='sold'], [class*='vendido']")?.textContent?.trim() || "";
          const imagem     = card.querySelector("img")?.src || card.querySelector("img")?.getAttribute("data-src") || "";
          if (titulo && preco > 0 && link) {
            items.push({ titulo, preco, preco_original, desconto, avaliacao, vendidos, imagem, link, posicao: index + 1 });
          }
        } catch (e) {}
      });
      return items;
    });

    await browser.close();
    const comPontuacao = produtos.map(p => {
      const pontuacao     = calcularPontuacaoProduto(p);
      const classificacao = classificarProduto(pontuacao);
      return { ...p, pontuacao, classificacao: classificacao.nivel, emoji_qualidade: classificacao.emoji };
    });
    comPontuacao.sort((a, b) => b.pontuacao - a.pontuacao);
    const resultado = comPontuacao.slice(0, parseInt(limite));
    console.log(`✅ [Shein] ${resultado.length} produtos`);
    res.json({ status: "ok", plataforma: "shein", total: resultado.length, data_extracao: new Date().toISOString(), produtos: resultado });
  } catch (error) {
    console.error("❌ [Shein] Erro:", error.message);
    res.status(500).json({ status: "erro", mensagem: error.message });
  }
});

// ============================================
// SHEIN — LOJAS EXCLUSIVAS
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
      { name: "sessionID_shein", value: "s%3A7S7sthaovE_Sy9eCpmLnzrOlwWc0Fwmi.37UHrLYj4Eq6Bfxhb4gOBJOuPly4kkpD32FjScputO4", domain: ".shein.com", path: "/" }
    ]);
    const page = await context.newPage();
    const todos = [];
    const lojasParaBuscar = loja === "todas"
      ? Object.entries(SHEIN_LOJAS_EXCLUSIVAS)
      : [[loja, SHEIN_LOJAS_EXCLUSIVAS[loja]]];

    for (const [lojaId, lojaInfo] of lojasParaBuscar) {
      if (!lojaInfo) continue;
      console.log(`[Shein] Buscando: ${lojaInfo.nome}`);
      await page.goto(lojaInfo.url, { waitUntil: "domcontentloaded", timeout: 60000 });
      await page.waitForTimeout(6000);
      try { await page.click('[class*="close"]', { timeout: 3000 }); } catch (e) {}
      for (let i = 1; i <= 8; i++) {
        await page.evaluate((s) => window.scrollTo(0, (document.body.scrollHeight / 8) * s), i);
        await page.waitForTimeout(1200);
      }
      await page.waitForTimeout(2000);

      const produtos = await page.evaluate((lojaNome, palavrasChave) => {
        const items = [];
        const seletores = ["[da-eid]", ".product-item-v3", ".S-product-item", "div[class*='product-item']"];
        let cards = [];
        for (const sel of seletores) { cards = Array.from(document.querySelectorAll(sel)); if (cards.length > 0) break; }
        cards.forEach((card, index) => {
          try {
            const linkEl  = card.closest("a[href*='shein.com']") || card.querySelector("a[href*='shein.com']");
            const linkRaw = linkEl ? linkEl.href : "";
            const idMatch = linkRaw.match(/-p-(\d+)\.html/);
            const link    = idMatch ? `https://br.shein.com/p-p-${idMatch[1]}.html` : linkRaw.split("?")[0];
            const titulo  = card.querySelector("[class*='name'], [class*='title']")?.textContent?.trim() || "";
            const precoTxt = card.querySelector("[class*='price-new'], [class*='sale-price']")?.textContent?.trim() || "";
            const preco   = parseFloat(precoTxt.replace("R$", "").replace(/\./g, "").replace(",", ".")) || 0;
            const precoOrigTxt = card.querySelector("[class*='price-del'], [class*='original-price']")?.textContent?.trim() || "";
            const preco_original = parseFloat(precoOrigTxt.replace("R$", "").replace(/\./g, "").replace(",", ".")) || 0;
            const desconto = card.querySelector("[class*='discount'], [class*='off-percent']")?.textContent?.trim() || "";
            const avaliacao = card.querySelector("[class*='star-num'], [class*='review-num']")?.textContent?.trim().replace(/[()]/g, "") || "";
            const vendidos  = card.querySelector("[class*='sold']")?.textContent?.trim() || "";
            const imagem    = card.querySelector("img")?.src || card.querySelector("img")?.getAttribute("data-src") || "";
            const tituloLower = titulo.toLowerCase();
            const temPalavraChave = palavrasChave.some(p => tituloLower.includes(p.toLowerCase()));
            if (titulo && preco > 0 && link && temPalavraChave) {
              items.push({ titulo, preco, preco_original, desconto, avaliacao, vendidos, imagem, link, loja: lojaNome, posicao: index + 1 });
            }
          } catch (e) {}
        });
        return items;
      }, lojaInfo.nome, lojaInfo.palavras_chave);

      todos.push(...produtos);
      console.log(`[Shein] ${lojaInfo.nome}: ${produtos.length} produtos`);
    }

    await browser.close();
    const comPontuacao = todos.map(p => {
      const pontuacao     = calcularPontuacaoProduto(p);
      const classificacao = classificarProduto(pontuacao);
      return { ...p, pontuacao, classificacao: classificacao.nivel, emoji_qualidade: classificacao.emoji };
    });
    comPontuacao.sort((a, b) => b.pontuacao - a.pontuacao);
    const resultado = comPontuacao.slice(0, parseInt(limite));
    res.json({ status: "ok", plataforma: "shein", lojas_buscadas: loja === "todas" ? Object.keys(SHEIN_LOJAS_EXCLUSIVAS) : [loja], total_encontrados: todos.length, total_retornados: resultado.length, data_extracao: new Date().toISOString(), produtos: resultado });
  } catch (error) {
    console.error("[Shein] Erro:", error);
    res.status(500).json({ status: "erro", mensagem: error.message });
  }
});

// ============================================
// SHEIN — BUGS DE PREÇO
// ============================================
app.get("/bugs/shein", async (req, res) => {
  try {
    const browser = await abrirBrowser();
    const context = await browser.newContext({ userAgent: "Mozilla/5.0", viewport: { width: 1920, height: 1080 }, locale: "pt-BR" });
    await context.addCookies([{ name: "memberId", value: SHEIN_MEMBER_ID, domain: ".shein.com", path: "/" }]);
    const page = await context.newPage();
    await page.goto("https://br.shein.com/Women-Dresses-cat-1727.html?sort=7", { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(6000);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);

    const todos = await page.evaluate(() => {
      const items = [];
      const seletores = ["[da-eid]", ".product-item-v3", "div[class*='product-item']"];
      let cards = [];
      for (const sel of seletores) { cards = Array.from(document.querySelectorAll(sel)); if (cards.length > 0) break; }
      cards.forEach((card, i) => {
        try {
          const titulo  = card.querySelector("[class*='name'], [class*='title']")?.textContent?.trim() || "";
          const precoTxt = card.querySelector("[class*='price-new'], [class*='sale-price']")?.textContent?.trim() || "";
          const preco   = parseFloat(precoTxt.replace("R$", "").replace(/\./g, "").replace(",", ".")) || 0;
          const linkEl  = card.closest("a[href*='shein.com']") || card.querySelector("a[href*='shein.com']");
          const link    = linkEl?.href || "";
          if (titulo && preco > 0) items.push({ titulo, preco, link, posicao: i + 1 });
        } catch (e) {}
      });
      return items;
    });

    await browser.close();
    const bugs = todos.map(detectarBugShein).filter(Boolean);
    bugs.sort((a, b) => b.pontuacao - a.pontuacao);
    res.json({ status: "ok", plataforma: "shein", total_analisados: todos.length, total_bugs: bugs.length, data_extracao: new Date().toISOString(), bugs });
  } catch (error) {
    res.status(500).json({ status: "erro", mensagem: error.message });
  }
});

// ============================================
// SHEIN — LINK DE AFILIADO
// ============================================
app.post("/shein-link", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ status: "erro", mensagem: "URL não fornecida" });
    const affiliateUrl = SHEIN_MEMBER_ID ? `${url}?url=${encodeURIComponent(url)}&ref=memberId:${SHEIN_MEMBER_ID}` : url;
    res.json({ status: "ok", url_original: url, url_afiliado: affiliateUrl, member_id: SHEIN_MEMBER_ID });
  } catch (error) {
    res.status(500).json({ status: "erro", mensagem: error.message });
  }
});

// ============================================
// IA — GERAR MENSAGEM DE OFERTA
// ============================================
app.post("/gerar-mensagem", async (req, res) => {
  try {
    const { produto, plataforma = "amazon" } = req.body;
    if (!produto) return res.status(400).json({ status: "erro", mensagem: "Produto não fornecido" });
    const mensagem = await gerarMensagemComIA(produto, plataforma);
    res.json({ status: "ok", plataforma, mensagem, gerado_com_ia: !!CLAUDE_API_KEY });
  } catch (error) {
    res.status(500).json({ status: "erro", mensagem: error.message });
  }
});

// ============================================
// IA — ANALISAR E CLASSIFICAR PRODUTOS
// ============================================
app.post("/analisar-produtos", async (req, res) => {
  try {
    const { produtos, limite = 10, min_pontuacao = 50 } = req.body;
    if (!produtos || !Array.isArray(produtos)) {
      return res.status(400).json({ status: "erro", mensagem: "Array de produtos não fornecido" });
    }
    const analisados = produtos.map(p => {
      const pontuacao     = calcularPontuacaoProduto(p);
      const classificacao = classificarProduto(pontuacao);
      return { ...p, pontuacao, classificacao: classificacao.nivel, emoji_qualidade: classificacao.emoji, prioridade: classificacao.prioridade };
    });
    const filtrados = analisados.filter(p => p.pontuacao >= min_pontuacao);
    filtrados.sort((a, b) => b.pontuacao - a.pontuacao);
    const topPicks = filtrados.slice(0, limite);
    res.json({ status: "ok", total_analisados: produtos.length, total_qualificados: filtrados.length, total_retornados: topPicks.length, min_pontuacao, produtos: topPicks });
  } catch (error) {
    res.status(500).json({ status: "erro", mensagem: error.message });
  }
});

// ============================================
// TIKTOK — SEGUIR CREATOR
// ============================================
app.post("/tiktok/seguir", async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ status: "erro", mensagem: "Username não fornecido" });
    console.log(`[TikTok] Tentando seguir: @${username}`);
    const browser = await abrirBrowser();
    const context = await browser.newContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      viewport:  { width: 1280, height: 720 },
      locale:    "pt-BR"
    });
    await context.addCookies(TIKTOK_COOKIES);
    const page = await context.newPage();
    await page.goto(`https://www.tiktok.com/@${username}`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(5000);

    const resultado = await page.evaluate(() => {
      const botaoSeguir = document.querySelector("[data-e2e='follow-button'], button[class*='follow']");
      if (!botaoSeguir) return { sucesso: false, motivo: "Botão não encontrado" };
      const texto = botaoSeguir.textContent?.trim().toLowerCase();
      if (texto === "seguindo" || texto === "following") return { sucesso: false, motivo: "Já está seguindo" };
      botaoSeguir.click();
      return { sucesso: true, motivo: "Clique realizado" };
    });

    await page.waitForTimeout(2000);
    await browser.close();
    res.json({ status: resultado.sucesso ? "ok" : "aviso", username, ...resultado });
  } catch (error) {
    console.error("[TikTok] Erro:", error.message);
    res.status(500).json({ status: "erro", mensagem: error.message });
  }
});

// ============================================
// INICIAR SERVIDOR
// ============================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📦 Plataformas: ML | Amazon | Shopee | Shein | TikTok`);
  console.log(`🤖 Claude AI: ${CLAUDE_API_KEY ? "CONFIGURADO ✅" : "NÃO CONFIGURADO ⚠️"}`);
  console.log(`🏪 Lojas Shein: ${Object.keys(SHEIN_LOJAS_EXCLUSIVAS).length} disponíveis`);
  console.log(`🔗 http://localhost:${PORT}`);
});
