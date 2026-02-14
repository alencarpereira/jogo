// ===============================
// HELPERS
// ===============================

function getOdd(id) {
    const el = document.getElementById(id);
    if (!el) return null;

    const value = parseFloat(el.value);
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

function addSuggestion(arr, name, score) {
    if (score >= 60) {
        arr.push({ name, score });
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
    let clareza = 55;
    let contradicao = false;

    // ===============================
    // 1X2
    // ===============================

    const oddCasa = getOdd("oddCasa");
    const oddEmpate = getOdd("oddEmpate");
    const oddVisitante = getOdd("oddVisitante");

    let favorito = null;
    let equilibrio = false;

    if (oddCasa && oddEmpate && oddVisitante) {

        const probs = normalizeProbs([
            prob(oddCasa),
            prob(oddEmpate),
            prob(oddVisitante)
        ]);

        const maxProb = Math.max(...probs);
        const index = probs.indexOf(maxProb);

        if (maxProb > 0.55) {
            clareza += 25;
            favorito = ["Casa", "Empate", "Visitante"][index];
        } else {
            equilibrio = true;
            clareza -= 10;
        }
    }

    // ===============================
    // GOLS
    // ===============================

    const over25 = getOdd("oddOver25");
    const under35 = getOdd("oddUnder35");

    let jogoModerado = false;
    let jogoExplosivo = false;
    let jogoControlado = false;

    if (over25 && over25 < 1.70) {
        jogoModerado = true;
        clareza += 8;
    }

    if (over25 && over25 < 1.40) {
        jogoExplosivo = true;
        clareza += 12;
    }

    if (under35 && under35 < 1.55) {
        jogoControlado = true;
        clareza += 6;
    }

    if (over25 && under35) {
        if (over25 > 1.90 && under35 < 1.50) {
            contradicao = true;
            clareza -= 20;
        }
    }

    // ===============================
    // BTTS
    // ===============================

    const bttsSim = getOdd("oddBttsSim");

    if (bttsSim && bttsSim < 1.60 && jogoModerado) {
        clareza += 5;
    }

    // ===============================
    // ESCANTEIOS
    // ===============================

    const esc8 = getOdd("oddEsc8");
    let pressaoAlta = false;

    if (esc8 && esc8 < 1.65) {
        pressaoAlta = true;
        clareza += 6;
    }

    // ===============================
    // CARTÕES
    // ===============================

    const card3 = getOdd("oddCard3");
    let jogoTenso = false;

    if (card3 && card3 < 1.65) {
        jogoTenso = true;
        clareza -= 8;
    }

    // ===============================
    // AJUSTE PROFISSIONAL DE CLAREZA (ANTES DAS SUGESTÕES)
    // ===============================

    if (oddVisitante && oddVisitante < 1.35) {
        clareza -= 5;
    }

    if (over25 && over25 < 1.30) {
        clareza -= 4;
    }

    if (pressaoAlta && jogoExplosivo) {
        clareza -= 3;
    }

    // Teto estrutural
    const TETO_MAXIMO = 95;
    clareza = Math.min(clareza, TETO_MAXIMO);

    // Limite inferior
    clareza = Math.max(0, clareza);

    // ===============================
    // DIAGNÓSTICO
    // ===============================

    if (contradicao) {
        diagnostico = "Mercado apresenta inconsistência estrutural.";
    } else {

        if (favorito) diagnostico += `Favoritismo forte do ${favorito}. `;
        if (equilibrio) diagnostico += `Jogo equilibrado. `;
        if (jogoExplosivo) diagnostico += `Tendência ofensiva intensa. `;
        else if (jogoModerado) diagnostico += `Expectativa de 2+ gols. `;
        if (jogoControlado) diagnostico += `Dificuldade para ultrapassar 3 gols. `;
        if (pressaoAlta) diagnostico += `Alta projeção de escanteios. `;
        if (jogoTenso) diagnostico += `Possível jogo físico. `;

        if (diagnostico === "") {
            diagnostico = "Mercado neutro.";
        }
    }

    // ===============================
    // SUGESTÕES
    // ===============================

    if (!contradicao && clareza >= 60) {

        const scoreBase = 70 + Math.floor(clareza / 5);

        if (favorito && jogoControlado && !jogoTenso) {
            addSuggestion(sugestoes, `${favorito} & Under 3.5`, scoreBase + 5);
        }

        if (favorito && (jogoModerado || jogoExplosivo) && !jogoTenso) {
            addSuggestion(sugestoes, `${favorito} & Over 1.5`, scoreBase + 3);
        }

        if (favorito && pressaoAlta && (jogoModerado || jogoExplosivo)) {
            addSuggestion(sugestoes, `Over Escanteios`, scoreBase);
        }

        if (equilibrio && jogoTenso) {
            addSuggestion(sugestoes, `Over Cartões`, scoreBase - 5);
        }
    }

    sugestoes.sort((a, b) => b.score - a.score);

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
            ranking.innerHTML = "<li>❌ Mercado sem clareza suficiente.</li>";
        } else if (sugestoes.length === 0) {
            ranking.innerHTML = "<li>⚠ Nenhuma aposta atende critérios técnicos.</li>";
        } else {
            sugestoes.slice(0, 3).forEach((s, i) => {
                const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉";
                const li = document.createElement("li");
                li.innerText = `${medal} ${s.name} — Confiança ${s.score}%`;
                ranking.appendChild(li);
            });
        }
    }

    if (indice) {
        indice.innerText = `${clareza}/100`;
    }
}



