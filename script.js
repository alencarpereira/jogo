// ===============================
// HELPERS
// ===============================

function getOdd(id) {
    const value = parseFloat(document.getElementById(id).value);
    return isNaN(value) || value <= 1 ? null : value;
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
    if (score >= 78) {
        arr.push({ name, score });
    }
}

// ===============================
// MAIN
// ===============================

document.getElementById("btnAnalisar").addEventListener("click", analisarMercado);

function analisarMercado() {

    let diagnostico = "";
    let sugestoes = [];
    let clareza = 55; // ajustado
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

        if (maxProb > 0.50) {  // ajustado
            clareza += 20;
            favorito = ["Casa", "Empate", "Visitante"][index];
        } else {
            equilibrio = true;
            clareza -= 10;
        }
    } else {
        clareza -= 5;
    }

    // ===============================
    // GOLS
    // ===============================

    const over25 = getOdd("oddOver25");
    const under35 = getOdd("oddUnder35");

    let jogoAberto = false;
    let jogoControlado = false;

    if (over25 && over25 < 1.75) {
        jogoAberto = true;
        clareza += 8;
    }

    if (under35 && under35 < 1.55) {
        jogoControlado = true;
        clareza += 5;
    }

    // CONTRADIÇÃO REAL
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

    if (bttsSim && bttsSim < 1.65 && jogoControlado) {
        clareza += 5;
    }

    // ===============================
    // ESCANTEIOS
    // ===============================

    const esc8 = getOdd("oddEsc8");

    let pressaoAlta = false;

    if (esc8 && esc8 < 1.75) {
        pressaoAlta = true;
        clareza += 5;
    }

    // ===============================
    // CARTÕES
    // ===============================

    const card3 = getOdd("oddCard3");

    let jogoTenso = false;

    if (card3 && card3 < 1.70) {
        jogoTenso = true;
        clareza -= 10;
    }

    // ===============================
    // DIAGNÓSTICO
    // ===============================

    if (contradicao) {
        diagnostico = "Mercado apresenta inconsistência real. Evitar entrada.";
    } else {

        if (favorito) {
            diagnostico += `Favoritismo consistente do ${favorito}. `;
        }

        if (equilibrio) {
            diagnostico += `Jogo equilibrado. `;
        }

        if (jogoAberto) {
            diagnostico += `Expectativa de pelo menos 2 gols. `;
        }

        if (jogoControlado) {
            diagnostico += `Dificuldade para ultrapassar 3 gols. `;
        }

        if (pressaoAlta) {
            diagnostico += `Pressão ofensiva sustentada. `;
        }

        if (jogoTenso) {
            diagnostico += `Possível tensão competitiva. `;
        }

        if (diagnostico === "") {
            diagnostico = "Mercado neutro.";
        }
    }

    // ===============================
    // SUGESTÕES CONSERVADORAS
    // ===============================

    if (!contradicao && clareza >= 60) {

        if (favorito && jogoControlado && !jogoTenso) {
            addSuggestion(sugestoes, `${favorito} & Under 3.5`, 86);
        }

        if (favorito && jogoAberto && !jogoTenso) {
            addSuggestion(sugestoes, `${favorito} & Over 1.5`, 84);
        }

        if (equilibrio && jogoControlado && !jogoTenso) {
            addSuggestion(sugestoes, "Under 2.5", 80);
        }
    }

    sugestoes.sort((a, b) => b.score - a.score);

    // ===============================
    // OUTPUT
    // ===============================

    document.getElementById("diagnostico").innerText = diagnostico;

    const ranking = document.getElementById("ranking");
    ranking.innerHTML = "";

    if (clareza < 60) {
        ranking.innerHTML = "<li>❌ Mercado sem clareza suficiente para entrada segura.</li>";
    } else if (sugestoes.length === 0) {
        ranking.innerHTML = "<li>⚠ Nenhuma aposta atende critérios conservadores.</li>";
    } else {
        sugestoes.slice(0, 3).forEach((s, i) => {
            const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉";
            const li = document.createElement("li");
            li.innerText = `${medal} ${s.name} — Confiança ${s.score}%`;
            ranking.appendChild(li);
        });
    }

    clareza = Math.max(0, Math.min(100, clareza));
    document.getElementById("indiceMercado").innerText = `${clareza}/100`;
}

