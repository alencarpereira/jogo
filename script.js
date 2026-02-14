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

    // Contradição real
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
    // SUGESTÕES DINÂMICAS
    // ===============================

    if (!contradicao && clareza >= 60) {

        const scoreBase = 70 + Math.floor(clareza / 5);

        // Favorito + Gols
        if (favorito && jogoControlado && !jogoTenso) {
            addSuggestion(sugestoes, `${favorito} & Under 3.5`, scoreBase + 5);
        }

        if (favorito && (jogoModerado || jogoExplosivo) && !jogoTenso) {
            addSuggestion(sugestoes, `${favorito} & Over 1.5`, scoreBase + 3);
        }

        // Escanteios entram se houver pressão real
        if (favorito && pressaoAlta && (jogoModerado || jogoExplosivo)) {
            addSuggestion(sugestoes, `Over Escanteios`, scoreBase);
        }

        // Cartões apenas se jogo equilibrado e tenso
        if (equilibrio && jogoTenso) {
            addSuggestion(sugestoes, `Over Cartões`, scoreBase - 5);
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

    clareza = Math.max(0, Math.min(100, clareza));
    document.getElementById("indiceMercado").innerText = `${clareza}/100`;
}


