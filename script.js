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
    // 1X2 — MODELO PROBABILÍSTICO REAL
    // ===============================

    const oddCasa = getOdd("oddCasa");
    const oddEmpate = getOdd("oddEmpate");
    const oddVisitante = getOdd("oddVisitante");

    let favorito = null;

    if (oddCasa && oddEmpate && oddVisitante) {

        const probs = normalizeProbs([
            prob(oddCasa),
            prob(oddEmpate),
            prob(oddVisitante)
        ]);

        const H = entropy(probs);
        const Hmax = Math.log(3);

        const equilibrio = H / Hmax;
        const dominancia = 1 - equilibrio;

        const maxProb = Math.max(...probs);
        const index = probs.indexOf(maxProb);
        favorito = ["Casa", "Empate", "Visitante"][index];

        clareza += dominancia * 40;
    }

    // ===============================
    // GOLS — ESCALA CONTÍNUA
    // ===============================

    const over25 = getOdd("oddOver25");
    const under35 = getOdd("oddUnder35");

    let pOver25 = over25 ? prob(over25) : null;
    let pUnder35 = under35 ? prob(under35) : null;

    if (pOver25) clareza += (pOver25 - 0.5) * 60;
    if (pUnder35) clareza += (pUnder35 - 0.5) * 30;

    // Detector de compressão 2–3 gols
    if (pOver25 && pUnder35 && pOver25 > 0.75 && pUnder35 > 0.65) {
        clareza -= 10;
        diagnostico += "Mercado extremamente comprimido em 2–3 gols. ";
    }

    // Contradição estrutural
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
    // DIAGNÓSTICO
    // ===============================

    if (contradicao) {
        diagnostico = "Mercado apresenta inconsistência estrutural.";
    } else {

        if (favorito) diagnostico += `Favoritismo estrutural do ${favorito}. `;
        if (pOver25 && pOver25 > 0.65) diagnostico += "Alta expectativa de gols. ";
        if (pUnder35 && pUnder35 > 0.65) diagnostico += "Probabilidade relevante de limite até 3 gols. ";
        if (pEsc && pEsc > 0.65) diagnostico += "Forte tendência de escanteios. ";
        if (diagnostico === "") diagnostico = "Mercado relativamente neutro.";
    }

    // ===============================
    // SUGESTÕES BASEADAS EM PROBABILIDADE
    // ===============================

    if (!contradicao && clareza >= 60) {
        const scoreBase = 65 + (clareza * 0.4);

        if (favorito && pOver25 && pOver25 > 0.60) addSuggestion(sugestoes, `${favorito} & Over 1.5`, scoreBase + 5);
        if (favorito && pUnder35 && pUnder35 > 0.60) addSuggestion(sugestoes, `${favorito} & Under 3.5`, scoreBase + 3);
        if (pEsc && pEsc > 0.65) addSuggestion(sugestoes, `Over Escanteios`, scoreBase);
        if (pBtts && pBtts > 0.60) addSuggestion(sugestoes, `BTTS Sim`, scoreBase - 3);

        // Outras apostas possíveis para fallback
        if (pOver25 && pOver25 > 0.50) addSuggestion(sugestoes, `Over 2.5 Gols`, scoreBase - 5);
        if (pUnder35 && pUnder35 > 0.50) addSuggestion(sugestoes, `Under 3.5 Gols`, scoreBase - 5);
        if (pCard && pCard < 0.65) addSuggestion(sugestoes, `Over 1.5 Cartões`, scoreBase - 10);
    }

    // ===============================
    // DEFINIÇÃO DE APOSTA PRINCIPAL E TEIMOSINHA
    // ===============================

    sugestoes.sort((a, b) => b.score - a.score);

    const principal = sugestoes[0] || null;

    // Teimosinha diversificada: não repetir a principal, score >= 60
    const teimosinha = sugestoes.find(s => s.name !== (principal ? principal.name : "") && s.score >= 60) || null;

    // ===============================
    // OUTPUT
    // ===============================

    const diagEl = document.getElementById("diagnostico");
    const ranking = document.getElementById("ranking");
    const indice = document.getElementById("indiceMercado");

    if (diagEl) diagEl.innerText = diagnostico;
    if (ranking) ranking.innerHTML = "";

    if (ranking) {
        if (clareza < 60) {
            ranking.innerHTML = "<li>❌ Mercado sem clareza estatística suficiente.</li>";
        } else if (!principal) {
            ranking.innerHTML = "<li>⚠ Nenhuma aposta apresenta edge estrutural claro.</li>";
        } else {
            // mostra apenas a aposta principal no ranking
            const li = document.createElement("li");
            li.innerText = `🥇 ${principal.name} — Confiança ${principal.score}%`;
            ranking.appendChild(li);

            // teimosinha usada apenas para análise
            if (teimosinha) {
                console.log(`💡 Teimosinha analisada: ${teimosinha.name} — Score ${teimosinha.score}`);
                diagnostico += `⚡ Teimosinha: Se a aposta principal falhar, considerar ${teimosinha.name}. `;
            }
        }
    }

    if (indice) indice.innerText = `${clareza}/100`;

    // Atualiza diagnóstico final com teimosinha
    if (diagEl) diagEl.innerText = diagnostico;
}


