// =====================================================================================
// CONFIG
// =====================================================================================
const API_URL = "http://localhost:3000/api/feedbacks";

// Token salvo no login
function getToken() {
    return localStorage.getItem("token");
}

// =====================================================================================
// ESTADO GLOBAL
// =====================================================================================
let feedbacksAtuais = [];
let filtroAtual = "todos";

// =====================================================================================
// CARREGAR FEEDBACKS DA API
// =====================================================================================
async function carregarFeedbacks() {
    console.log("📡 Buscando feedbacks via API...");

    const token = getToken();
    if (!token) {
        alert("Token não encontrado! Faça login novamente.");
        window.location.href = "index.html";
        return;
    }

    try {
        const res = await fetch(API_URL, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!res.ok) {
            console.error(`❌ Erro API: ${res.status}`);
            return;
        }

        feedbacksAtuais = await res.json();
        console.log("📦 Feedbacks recebidos:", feedbacksAtuais.length);

        atualizarEstatisticas();
        exibirFeedbacks();

    } catch (error) {
        console.error("❌ Erro ao carregar feedbacks:", error);
    }
}

// =====================================================================================
// EXIBIR FEEDBACKS
// =====================================================================================
function exibirFeedbacks() {
    const container = document.getElementById("feedbacksContainer");
    const empty = document.getElementById("emptyState");

    let lista = feedbacksAtuais;

    if (filtroAtual === "novos") lista = lista.filter(f => f.status === "novo");
    if (filtroAtual === "lidos") lista = lista.filter(f => f.status === "lido");

    if (lista.length === 0) {
        empty.style.display = "block";
        container.innerHTML = "";
        return;
    }

    empty.style.display = "none";

    container.innerHTML = lista.map(f => {
        return `
        <div class="feedback-card ${f.status}">
            <div class="feedback-header">
                <h3>${f.userName || "Anônimo"}</h3>
                <span>${f.userEmail}</span>
                <span class="badge">${f.status === "novo" ? "🔵 Novo" : "✅ Lido"}</span>
            </div>

            <p class="feedback-msg">${f.mensagem}</p>

            <div class="feedback-footer">
                <small>${new Date(f.timestamp).toLocaleString("pt-BR")}</small>

                <div class="actions">
                    ${f.status === "novo" 
                        ? `<button onclick="marcarComoLido('${f.id}')">✓ Marcar como lido</button>`
                        : `<button onclick="marcarComoNovo('${f.id}')">↻ Marcar como novo</button>`
                    }
                </div>
            </div>
        </div>`;
    }).join("");
}

// =====================================================================================
// ATUALIZAR STATUS (NOVO / LIDO)
// =====================================================================================
async function atualizarStatus(id, status) {
    const token = getToken();

    try {
        const res = await fetch(`${API_URL}/${id}/status`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ status })
        });

        if (res.ok) {
            const fb = feedbacksAtuais.find(f => f.id === id);
            fb.status = status;
            exibirFeedbacks();
            atualizarEstatisticas();
        }
    } catch (err) {
        console.error("Erro ao atualizar status:", err);
    }
}

window.marcarComoLido = id => atualizarStatus(id, "lido");
window.marcarComoNovo = id => atualizarStatus(id, "novo");

// =====================================================================================
// ESTATÍSTICAS
// =====================================================================================
function atualizarEstatisticas() {
    document.getElementById("totalFeedbacks").textContent = feedbacksAtuais.length;
    document.getElementById("novosFeedbacks").textContent = feedbacksAtuais.filter(f => f.status === "novo").length;
    document.getElementById("lidosFeedbacks").textContent = feedbacksAtuais.filter(f => f.status === "lido").length;
}

// =====================================================================================
// FILTROS
// =====================================================================================
document.querySelectorAll("[data-filtro]").forEach(btn => {
    btn.addEventListener("click", () => {
        filtroAtual = btn.dataset.filtro;
        exibirFeedbacks();
    });
});

// =====================================================================================
// BOTÃO VOLTAR
// =====================================================================================
document.getElementById("btnVoltar").addEventListener("click", () => {
    window.location.href = "pag_adm.html";
});

// =====================================================================================
// BOTÃO ATUALIZAR
// =====================================================================================
document.getElementById("btnAtualizar").addEventListener("click", carregarFeedbacks);

// =====================================================================================
// INICIALIZAÇÃO
// =====================================================================================
document.addEventListener("DOMContentLoaded", carregarFeedbacks);
