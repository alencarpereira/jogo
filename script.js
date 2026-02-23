// ===============================
// HELPERS
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

function calcMargem(probs) {
    const soma = probs.reduce((a, b) => a + b, 0);
    return (soma - 1) * 100;
}

function addSugestao(arr, nome, score, odd, probReal) {
    arr.push({
        nome,
        score: Math.round(score),
        odd: odd ? odd.toFixed(2) : "—",
        prob: probReal ? (probReal * 100).toFixed(1) : "—"
    });
}

// ===============================
// EVENTO
// ===============================

document.addEventListener("DOMContentLoaded", function () {
    const btn = document.getElementById("btnAnalisar");
    if (btn) btn.addEventListener("click", analisarMercado);
});

// ===============================
// FUNÇÃO PRINCIPAL
// ===============================

function analisarMercado() {

    let clareza = 50;
    let sugestoes = [];

    // ===============================
    // 1X2
    // ===============================

    const oddCasa = getOdd("oddCasa");
    const oddEmpate = getOdd("oddEmpate");
    const oddVisitante = getOdd("oddVisitante");

    let probs1x2 = null;
    let favorito = null;
    let margem1x2 = null;

    if (oddCasa && oddEmpate && oddVisitante) {

        const probsBrutas = [
            prob(oddCasa),
            prob(oddEmpate),
            prob(oddVisitante)
        ];

        margem1x2 = calcMargem(probsBrutas);
        probs1x2 = normalizeProbs(probsBrutas);

        const H = entropy(probs1x2);
        const dominancia = 1 - (H / Math.log(3));

        clareza += dominancia * 40;

        const maxProb = Math.max(...probs1x2);
        const index = probs1x2.indexOf(maxProb);
        favorito = ["Casa", "Empate", "Visitante"][index];

        if (maxProb > 0.55) {
            addSugestao(sugestoes, `Vitória ${favorito}`, 65 + (maxProb * 40),
                [oddCasa, oddEmpate, oddVisitante][index], maxProb);
        }
    }

    // ===============================
    // GOLS
    // ===============================

    const over25 = getOdd("oddOver25");
    const under35 = getOdd("oddUnder35");

    const pOver25 = over25 ? prob(over25) : null;
    const pUnder35 = under35 ? prob(under35) : null;

    if (pOver25) {
        clareza += (pOver25 - 0.5) * 60;

        if (pOver25 > 0.60) {
            addSugestao(sugestoes, "Over 2.5 Gols", 60 + (pOver25 * 35), over25, pOver25);
        }
    }

    if (pUnder35 && pUnder35 > 0.60) {
        addSugestao(sugestoes, "Under 3.5 Gols", 60 + (pUnder35 * 30), under35, pUnder35);
    }

    // ===============================
    // BTTS
    // ===============================

    const oddBttsSim = getOdd("oddBttsSim");
    const pBtts = oddBttsSim ? prob(oddBttsSim) : null;

    if (pBtts) {
        clareza += (pBtts - 0.5) * 25;

        if (pBtts > 0.60) {
            addSugestao(sugestoes, "BTTS Sim", 58 + (pBtts * 30), oddBttsSim, pBtts);
        }
    }

    // ===============================
    // ESCANTEIOS
    // ===============================

    const oddEsc8 = getOdd("oddEsc8");
    const pEsc = oddEsc8 ? prob(oddEsc8) : null;

    if (pEsc && pEsc > 0.65) {
        addSugestao(sugestoes, "Over 8.5 Escanteios", 55 + (pEsc * 25), oddEsc8, pEsc);
    }

    // ===============================
    // CARTÕES
    // ===============================

    const oddCard3 = getOdd("oddCard3");
    const pCard = oddCard3 ? prob(oddCard3) : null;

    if (pCard && pCard > 0.65) {
        clareza -= 10;
    }

    // ===============================
    // AJUSTE FINAL
    // ===============================

    clareza = Math.max(0, Math.min(95, Math.round(clareza)));

    sugestoes.sort((a, b) => b.score - a.score);

    const rankingEl = document.getElementById("ranking");
    if (rankingEl) {
        rankingEl.innerHTML = "";

        if (sugestoes.length === 0) {
            rankingEl.innerHTML = "<li>Sem oportunidade clara.</li>";
        } else {
            sugestoes.forEach(s => {
                const li = document.createElement("li");
                li.innerText = `${s.nome} | Prob: ${s.prob}% | Odd: ${s.odd} | Score: ${s.score}`;
                rankingEl.appendChild(li);
            });
        }
    }

    const melhor = sugestoes[0];

    const diagnostico = `
📊 Leitura de Mercado

Favorito: ${favorito || "—"}
Margem 1X2: ${margem1x2 ? margem1x2.toFixed(2) + "%" : "—"}

Melhor oportunidade:
${melhor ? melhor.nome : "Nenhuma clara"}

Índice de Clareza: ${clareza}/100
`;

    document.getElementById("diagnostico").innerText = diagnostico;
    document.getElementById("indiceMercado").innerText = `${clareza}/100`;
}



