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

function normalizePair(p1, p2) {
    const total = p1 + p2;
    if (total === 0) return [0, 0];
    return [p1 / total, p2 / total];
}

function normalizeTriple(p1, p2, p3) {
    const total = p1 + p2 + p3;
    if (total === 0) return [0, 0, 0];
    return [p1 / total, p2 / total, p3 / total];
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

    // ===============================
    // 1X2
    // ===============================

    const oddCasa = getOdd("oddCasa");
    const oddEmpate = getOdd("oddEmpate");
    const oddVisitante = getOdd("oddVisitante");

    let probCasaReal = null;
    let probVisitanteReal = null;

    if (oddCasa && oddEmpate && oddVisitante) {

        const pCasa = prob(oddCasa);
        const pEmpate = prob(oddEmpate);
        const pVisitante = prob(oddVisitante);

        const normalizadas = normalizeTriple(pCasa, pEmpate, pVisitante);

        probCasaReal = normalizadas[0];
        probVisitanteReal = normalizadas[2];
    }

    // ===============================
    // OVER 2.5 (PRECISA TER UNDER 2.5)
    // ===============================

    const oddOver25 = getOdd("oddOver25");
    const oddUnder25 = getOdd("oddUnder25");

    let probOverReal = null;

    if (oddOver25 && oddUnder25) {

        const pOver = prob(oddOver25);
        const pUnder = prob(oddUnder25);

        const normalizadas = normalizePair(pOver, pUnder);

        probOverReal = normalizadas[0];
    }

    // ===============================
    // BTTS
    // ===============================

    const oddBttsSim = getOdd("oddBttsSim");
    const oddBttsNao = getOdd("oddBttsNao");

    let probBttsReal = null;

    if (oddBttsSim && oddBttsNao) {

        const pSim = prob(oddBttsSim);
        const pNao = prob(oddBttsNao);

        const normalizadas = normalizePair(pSim, pNao);

        probBttsReal = normalizadas[0];
    }

    // ===============================
    // SAÍDA FINAL LIMPA
    // ===============================

    const resultado = `
📊 Probabilidades Reais do Mercado

Vitória Casa: ${probCasaReal ? (probCasaReal * 100).toFixed(1) + "%" : "—"}
Vitória Visitante: ${probVisitanteReal ? (probVisitanteReal * 100).toFixed(1) + "%" : "—"}

Over 2.5: ${probOverReal ? (probOverReal * 100).toFixed(1) + "%" : "—"}

BTTS: ${probBttsReal ? (probBttsReal * 100).toFixed(1) + "%" : "—"}
`;

    document.getElementById("diagnostico").innerText = resultado;
}



