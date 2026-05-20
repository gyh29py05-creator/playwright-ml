const express = require("express");
const router = express.Router();

console.log("✅ Arquivo mercado-livre.js carregado com sucesso!");

router.get("/ofertas/:categoria", (req, res) => {
  res.json({
    status: "ok",
    mensagem: "Rota Mercado Livre funcionando (versão mínima)",
    categoria: req.params.categoria
  });
});

router.post("/mercado-simples", (req, res) => {
  res.json({ status: "ok", mensagem: "Afiliado funcionando" });
});

module.exports = router;
