// Módulo gerado a partir do index.html original do TECMEC (CMM PMESP).
// Extraído automaticamente preservando o código original função por função.

export function showToast(msg, type = "info") {
            const t = document.getElementById("toastMsg");
            if (!t) return;
            t.textContent = msg;
            t.className = `toast show ${type}`;
            setTimeout(() => { t.className = "toast"; }, 4000);
        }
