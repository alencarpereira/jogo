// ===============================
// HELPERS MATEMÁTICOS
// ===============================

function getOdd(id) {
    const el = document.getElementById(id);
    if (!el) return null;

    const raw = el.value.replace(",", ".");
    const value = parseFloat(raw);

    if (isNaN(value) || value <= 1) return null;

    return value;
}

function prob(odd) {
    return 1 / odd;
}

function normalizeProbs(probs) {
    const total = probs.reduce((a, b) => a + b, 0);
    if (total === 0) return probs;
    return probs.map(p => p / total);
}

function entropy(probs) {
    return -probs.reduce((sum, p) => {
        return p > 0 ? sum + p * Math.log(p) : sum;
    }, 0);
}

function addSuggestion(arr, name, score) {
    if (score >= 60) {
        arr.push({ name, score: Math.round(score) });
    }
}

// ===============================
// EVENTO BOTÃO
// ===============================

document.addEventListener("DOMContentLoaded", function () {
    const btn = document.getElementById("btnAnalisar");
    if (btn) {
        btn.addEventListener("click", analisarMercado);
    }
});

// ===============================
// FUNÇÃO PRINCIPAL
// ===============================

function analisarMercado() {

    let diagnostico = "";
    let sugestoes = [];
    let clareza = 50;
    let contradicao = false;

    // ===============================
    // 1X2
    // ===============================

    const oddCasa = getOdd("oddCasa");
    const oddEmpate = getOdd("oddEmpate");
    const oddVisitante = getOdd("oddVisitante");

    let favorito = null;
    let probs1x2 = null;

    if (oddCasa && oddEmpate && oddVisitante) {

        probs1x2 = normalizeProbs([
            prob(oddCasa),
            prob(oddEmpate),
            prob(oddVisitante)
        ]);

        const H = entropy(probs1x2);
        const Hmax = Math.log(3);

        const equilibrio = H / Hmax;
        const dominancia = 1 - equilibrio;

        const maxProb = Math.max(...probs1x2);
        const index = probs1x2.indexOf(maxProb);
        favorito = ["Casa", "Empate", "Visitante"][index];

        clareza += dominancia * 40;
    }

    // ===============================
    // GOLS
    // ===============================

    const over25 = getOdd("oddOver25");
    const under35 = getOdd("oddUnder35");

    let pOver25 = over25 ? prob(over25) : null;
    let pUnder35 = under35 ? prob(under35) : null;

    if (pOver25) clareza += (pOver25 - 0.5) * 60;
    if (pUnder35) clareza += (pUnder35 - 0.5) * 30;

    if (pOver25 && pUnder35 && pOver25 > 0.75 && pUnder35 > 0.65) {
        clareza -= 10;
        diagnostico += "Mercado extremamente comprimido em 2–3 gols. ";
    }

    if (pOver25 && pUnder35 && pOver25 < 0.45 && pUnder35 > 0.70) {
        contradicao = true;
        clareza -= 20;
    }

    // ===============================
    // BTTS
    // ===============================

    const bttsSim = getOdd("oddBttsSim");
    const pBtts = bttsSim ? prob(bttsSim) : null;
    if (pBtts) clareza += (pBtts - 0.5) * 25;

    // ===============================
    // ESCANTEIOS
    // ===============================

    const esc8 = getOdd("oddEsc8");
    const pEsc = esc8 ? prob(esc8) : null;
    if (pEsc) clareza += (pEsc - 0.5) * 20;

    // ===============================
    // CARTÕES
    // ===============================

    const card3 = getOdd("oddCard3");
    const pCard = card3 ? prob(card3) : null;
    if (pCard && pCard > 0.65) clareza -= 8;

    // ===============================
    // NORMALIZAÇÃO FINAL
    // ===============================

    clareza = Math.max(0, Math.min(95, Math.round(clareza)));

    // ===============================
    // PROJEÇÕES ESTATÍSTICAS
    // ===============================

    const percent = (p) => p ? (p * 100).toFixed(1) : "—";

    let projCasa = probs1x2 ? percent(probs1x2[0]) : "—";
    let projEmpate = probs1x2 ? percent(probs1x2[1]) : "—";
    let projVisit = probs1x2 ? percent(probs1x2[2]) : "—";

    let expectativaGols = 0;
    if (pOver25 && pUnder35) {
        expectativaGols = (2.5 * pOver25 + 2 * (1 - pOver25)).toFixed(2);
    }

    let placarProvavel = "0x0";
    if (pOver25 && pOver25 > 0.6) placarProvavel = "2x1";
    else if (pOver25 && pOver25 > 0.52) placarProvavel = "1x1";

    // ===============================
    // INTERPRETAÇÃO
    // ===============================

    let interpretacao = "";

    if (probs1x2) {
        const diff = Math.max(...probs1x2) - Math.min(...probs1x2);

        if (diff < 0.08) {
            interpretacao += "Confronto equilibrado sem favorito claro. ";
        } else {
            interpretacao += `Leve favoritismo para ${favorito}. `;
        }
    }

    if (pOver25 && pOver25 < 0.45) {
        interpretacao += "Tendência de poucos gols. ";
    } else if (pOver25 && pOver25 > 0.6) {
        interpretacao += "Boa probabilidade de jogo movimentado. ";
    }

    if (pBtts && pBtts < 0.45) {
        interpretacao += "Baixa probabilidade de ambas marcarem. ";
    } else if (pBtts && pBtts > 0.6) {
        interpretacao += "Alta chance de ambas equipes marcarem. ";
    }

    if (expectativaGols) {
        interpretacao += `Expectativa média de ${expectativaGols} gols.`;
    }

    // ===============================
    // SUGESTÃO PRINCIPAL
    // ===============================

    if (!contradicao && clareza >= 60) {
        const scoreBase = 65 + (clareza * 0.4);

        if (favorito && pOver25 && pOver25 > 0.60) addSuggestion(sugestoes, `${favorito} & Over 1.5`, scoreBase + 5);
        if (favorito && pUnder35 && pUnder35 > 0.60) addSuggestion(sugestoes, `${favorito} & Under 3.5`, scoreBase + 3);
        if (pEsc && pEsc > 0.65) addSuggestion(sugestoes, `Over Escanteios`, scoreBase);
        if (pBtts && pBtts > 0.60) addSuggestion(sugestoes, `BTTS Sim`, scoreBase - 3);
        if (pOver25 && pOver25 > 0.50) addSuggestion(sugestoes, `Over 2.5 Gols`, scoreBase - 5);
        if (pUnder35 && pUnder35 > 0.50) addSuggestion(sugestoes, `Under 3.5 Gols`, scoreBase - 5);
        if (pCard && pCard < 0.65) addSuggestion(sugestoes, `Over 1.5 Cartões`, scoreBase - 10);
    }

    sugestoes.sort((a, b) => b.score - a.score);
    const principal = sugestoes[0] || null;

    let melhorMercado = "Sem edge estatístico claro.";
    if (principal) melhorMercado = principal.name;

    // ===============================
    // SAÍDA FINAL FORMATADA
    // ===============================

    const output = `
📊 Análise Estatística
Placar mais provável: ${placarProvavel}

Over 2.5: ${percent(pOver25)}%
BTTS: ${percent(pBtts)}%

Vitória A: ${projCasa}%
Empate: ${projEmpate}%
Vitória B: ${projVisit}%

🧠 Interpretação:
${interpretacao}

🎯 Sugestão estatística:
Mercado com melhor projeção: ${melhorMercado}
`;

    const diagEl = document.getElementById("diagnostico");
    const indice = document.getElementById("indiceMercado");

    if (diagEl) diagEl.innerText = output;
    if (indice) indice.innerText = `${clareza}/100`;
}



