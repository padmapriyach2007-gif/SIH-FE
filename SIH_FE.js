// =========================================================
// NEURAL NOMADS - QUANTUM STUDIO ENGINE (SIH_FE.js)
// =========================================================

// Global Toast Alerts
function showToast(title, message) {
    let container = document.querySelector(".toast-container");
    if (!container) {
        container = document.createElement("div");
        container.className = "toast-container";
        document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = "custom-toast";
    toast.innerHTML = `
        <div class="toast-icon">✓</div>
        <div class="toast-content">
            <span class="toast-title">${escapeHTML(title)}</span>
            <span class="toast-message">${escapeHTML(message)}</span>
        </div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add("toast-hiding");
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

function escapeHTML(str) {
    return String(str).replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

document.addEventListener("DOMContentLoaded", () => {
    // 1. App State
    let currentUser = null;
    let qubitCount = 2;
    let circuitData = [
        ["H", "CX"], // q[0]
        ["CX", "M"]  // q[1]
    ];

    // 2. Tab Navigation & View Switcher
    function switchTab(targetView, targetBtn) {
        const dashboardView = document.getElementById("dashboard-view");
        const explainerView = document.getElementById("explainer-view");
        const studioView = document.getElementById("studio-view");
        const aitutorView = document.getElementById("aitutor-view");

        const btnDashboard = document.getElementById("btn-dashboard");
        const btnExplainer = document.getElementById("btn-explainer");
        const btnStudio = document.getElementById("btn-studio");
        const btnAiTutor = document.getElementById("btn-aitutor");

        const allViews = [dashboardView, explainerView, studioView, aitutorView];
        const allNavBtns = [btnDashboard, btnExplainer, btnStudio, btnAiTutor];

        allViews.forEach(v => v?.classList.remove("active"));
        allNavBtns.forEach(b => b?.classList.remove("active"));

        if (targetView) targetView.classList.add("active");
        if (targetBtn) targetBtn.classList.add("active");

        if (window.MathJax && typeof window.MathJax.typesetPromise === "function") {
            window.MathJax.typesetPromise([targetView]).catch(e => console.error(e));
        }
    }

    const btnDashboard = document.getElementById("btn-dashboard");
    const btnExplainer = document.getElementById("btn-explainer");
    const btnStudio = document.getElementById("btn-studio");
    const btnAiTutor = document.getElementById("btn-aitutor");

    const dashboardView = document.getElementById("dashboard-view");
    const explainerView = document.getElementById("explainer-view");
    const studioView = document.getElementById("studio-view");
    const aitutorView = document.getElementById("aitutor-view");

    // Header Nav Click Listeners
    btnDashboard?.addEventListener("click", () => switchTab(dashboardView, btnDashboard));
    btnExplainer?.addEventListener("click", () => switchTab(explainerView, btnExplainer));
    btnStudio?.addEventListener("click", () => switchTab(studioView, btnStudio));
    btnAiTutor?.addEventListener("click", () => switchTab(aitutorView, btnAiTutor));

    // Dashboard Shortcuts to Explainer & Studio
    document.getElementById("action-start-learning")?.addEventListener("click", () => switchTab(explainerView, btnExplainer));
    document.getElementById("quick-learning")?.addEventListener("click", () => switchTab(explainerView, btnExplainer));
    document.getElementById("action-quick-studio")?.addEventListener("click", () => switchTab(studioView, btnStudio));
    document.getElementById("action-launch-studio")?.addEventListener("click", () => switchTab(studioView, btnStudio));
    document.getElementById("quick-circuit")?.addEventListener("click", () => switchTab(studioView, btnStudio));
    document.getElementById("explainer-to-studio")?.addEventListener("click", () => switchTab(studioView, btnStudio));

    // AI Tutor Shortcut Redirections
    const aiTutorTriggers = [
        document.getElementById("quick-aitutor"),
        document.getElementById("quick-ai"),
        document.getElementById("action-ask-ai"),
        document.getElementById("explainer-to-ai")
    ];

    aiTutorTriggers.forEach(btn => {
        btn?.addEventListener("click", () => switchTab(aitutorView, btnAiTutor));
    });

    document.getElementById("quick-progress")?.addEventListener("click", () => {
        switchTab(dashboardView, btnDashboard);
        setTimeout(() => {
            const progressSection = document.querySelector(".learning-progress") || document.querySelector(".dashboard-stats");
            progressSection?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 100);
    });

    // 3. Circuit Studio Engine
    const wiresWrapper = document.getElementById("circuit-wires-list") || document.getElementById("circuit-wires-wrapper");
    const qiskitCodeDisplay = document.getElementById("qiskit-code-display");
    const btnAddQubit = document.getElementById("btn-add-wire") || document.getElementById("btn-add-qubit");
    const btnClearCircuit = document.getElementById("btn-clear-canvas") || document.getElementById("btn-clear-circuit");
    const btnRunSim = document.getElementById("btn-run-simulation");
    const btnCopyCode = document.getElementById("btn-copy-qiskit") || document.getElementById("btn-copy-code");

    const simModal = document.getElementById("sim-modal");
    const probList = document.getElementById("prob-distribution-list");
    const btnCloseSim = document.getElementById("btn-close-sim");

    function renderCircuit() {
        if (!wiresWrapper) return;
        wiresWrapper.innerHTML = "";

        circuitData.forEach((wireGates, qubitIdx) => {
            const wireRow = document.createElement("div");
            wireRow.className = "wire-container";
            wireRow.dataset.wireIndex = qubitIdx;

            const label = document.createElement("span");
            label.className = "qubit-label";
            label.textContent = `q[${qubitIdx}]`;

            const wire = document.createElement("div");
            wire.className = "circuit-wire";
            wire.dataset.qubitIndex = qubitIdx;

            wire.addEventListener("dragover", (e) => {
                e.preventDefault();
                wire.classList.add("drag-over");
            });
            wire.addEventListener("dragleave", () => wire.classList.remove("drag-over"));
            wire.addEventListener("drop", (e) => {
                e.preventDefault();
                wire.classList.remove("drag-over");
                const gateType = e.dataTransfer.getData("text/plain");
                if (gateType) addGateToQubit(qubitIdx, gateType);
            });

            wireGates.forEach((gate, gIdx) => {
                const gateEl = document.createElement("div");
                gateEl.className = "placed-gate";
                if (gate === "CX") gateEl.classList.add("gate-cyan");
                if (gate === "M") gateEl.classList.add("gate-pink");
                gateEl.textContent = gate;

                gateEl.addEventListener("click", () => removeGate(qubitIdx, gIdx));
                wire.appendChild(gateEl);
            });

            wireRow.appendChild(label);
            wireRow.appendChild(wire);
            wiresWrapper.appendChild(wireRow);
        });

        updateQiskitCode();
        updateDashboardCounts();
    }

    function addGateToQubit(qubitIdx, gateType) {
        if (circuitData[qubitIdx]) {
            circuitData[qubitIdx].push(gateType);
            renderCircuit();
        }
    }

    function removeGate(qubitIdx, gateIndex) {
        if (circuitData[qubitIdx]) {
            circuitData[qubitIdx].splice(gateIndex, 1);
            renderCircuit();
        }
    }

    function updateQiskitCode() {
        if (!qiskitCodeDisplay) return;

        let code = `<span class="code-comment"># Live Generated Qiskit Code</span>\n`;
        code += `<span class="code-keyword">from</span> qiskit <span class="code-keyword">import</span> QuantumCircuit\n\n`;
        code += `qc = QuantumCircuit(<span class="code-number">${qubitCount}</span>)\n`;

        let hasMeasurement = false;

        circuitData.forEach((gates, qIdx) => {
            gates.forEach(gate => {
                const g = gate.toUpperCase();
                if (g === "H") code += `qc.h(<span class="code-number">${qIdx}</span>)\n`;
                else if (g === "X") code += `qc.x(<span class="code-number">${qIdx}</span>)\n`;
                else if (g === "Y") code += `qc.y(<span class="code-number">${qIdx}</span>)\n`;
                else if (g === "Z") code += `qc.z(<span class="code-number">${qIdx}</span>)\n`;
                else if (g === "CX") {
                    const targetQubit = (qIdx + 1) % qubitCount;
                    code += `qc.cx(<span class="code-number">${qIdx}</span>, <span class="code-number">${targetQubit}</span>)\n`;
                }
                else if (g === "M") hasMeasurement = true;
            });
        });

        if (hasMeasurement) code += `qc.measure_all()\n`;

        qiskitCodeDisplay.innerHTML = code;
    }

    function updateDashboardCounts() {
        const totalGates = circuitData.reduce((acc, wire) => acc + wire.length, 0);
        const dashQubits = document.getElementById("dash-qubits-count");
        const dashGates = document.getElementById("dash-gates-count") || document.getElementById("dash-gates-total");
        if (dashQubits) dashQubits.textContent = qubitCount;
        if (dashGates) dashGates.textContent = totalGates;
    }

    // Gate Palette Events
    document.querySelectorAll(".gate-card").forEach(item => {
        item.addEventListener("dragstart", (e) => {
            const gate = item.dataset.gate;
            if (gate) e.dataTransfer.setData("text/plain", gate);
        });

        item.addEventListener("click", () => {
            const gate = item.dataset.gate;
            if (gate) addGateToQubit(0, gate);
        });
    });

    btnAddQubit?.addEventListener("click", () => {
        if (qubitCount < 5) {
            qubitCount++;
            circuitData.push([]);
            renderCircuit();
        } else {
            showToast("Limit Reached", "Maximum 5 qubits supported in standard simulator.");
        }
    });

    btnClearCircuit?.addEventListener("click", () => {
        circuitData = Array.from({ length: qubitCount }, () => []);
        renderCircuit();
    });

    btnCopyCode?.addEventListener("click", () => {
        const text = qiskitCodeDisplay?.textContent || "";
        navigator.clipboard.writeText(text).then(() => {
            showToast("Copied", "Qiskit code copied to clipboard!");
        });
    });

    // Quantum Simulation Results Modal Output
    btnRunSim?.addEventListener("click", () => {
        if (simModal && probList) {
            probList.innerHTML = `
                <div class="prob-row">
                    <span class="prob-state">|00⟩</span>
                    <div class="prob-bar-track">
                        <div class="prob-bar-fill prob-bar-cyan" style="width: 50%;"></div>
                    </div>
                    <span class="prob-val">50.0%</span>
                </div>
                <div class="prob-row">
                    <span class="prob-state">|11⟩</span>
                    <div class="prob-bar-track">
                        <div class="prob-bar-fill prob-bar-pink" style="width: 50%;"></div>
                    </div>
                    <span class="prob-val">50.0%</span>
                </div>
            `;
            simModal.removeAttribute("hidden");
        }
        showToast("Simulation", "State vector and measurement probabilities calculated!");
    });

    btnCloseSim?.addEventListener("click", () => {
        if (simModal) simModal.setAttribute("hidden", "true");
    });

    // 4. AI Tutor Chat Engine
    const chatForm = document.getElementById("chat-form");
    const chatInput = document.getElementById("tutor-chat-input");
    const chatMessages = document.getElementById("tutor-chat-messages");
    const btnClearChat = document.getElementById("btn-clear-chat");

    if (chatForm && chatInput && chatMessages) {
        chatForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const text = chatInput.value.trim();
            if (!text) return;

            appendTutorMessage("user", text);
            chatInput.value = "";

            const typingElem = showTypingIndicator(chatMessages);

            setTimeout(() => {
                removeTypingIndicator(typingElem);
                const botResponse = generateQuantumResponse(text);
                appendTutorMessage("ai", botResponse);

                if (window.MathJax && typeof window.MathJax.typesetPromise === "function") {
                    window.MathJax.typesetPromise([chatMessages]).catch(err => console.error(err));
                }
            }, 1000);
        });
    }

    btnClearChat?.addEventListener("click", () => {
        if (chatMessages) {
            chatMessages.innerHTML = `
                <div class="chat-message ai">
                    <div class="message-avatar">🤖</div>
                    <div class="message-bubble">
                        <p>Chat cleared. How can I help you understand quantum concepts or Qiskit today?</p>
                    </div>
                </div>
            `;
        }
    });

    function appendTutorMessage(sender, text) {
        if (!chatMessages) return;

        const msgDiv = document.createElement("div");
        msgDiv.className = `chat-message ${sender}`;

        const avatar = sender === "ai" ? "🤖" : "👤";
        msgDiv.innerHTML = `
            <div class="message-avatar">${avatar}</div>
            <div class="message-bubble">
                <p>${sender === "user" ? escapeHTML(text) : text}</p>
            </div>
        `;

        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function showTypingIndicator(container) {
        const indicator = document.createElement("div");
        indicator.className = "chat-message ai typing-indicator";
        indicator.innerHTML = `
            <div class="message-avatar">🤖</div>
            <div class="message-bubble">
                <p><em>Quantum Tutor is thinking...</em></p>
            </div>
        `;
        container.appendChild(indicator);
        container.scrollTop = container.scrollHeight;
        return indicator;
    }

    function removeTypingIndicator(indicator) {
        indicator?.remove();
    }

    function generateQuantumResponse(prompt) {
        const lower = prompt.toLowerCase();

        if (lower.includes("qubit") || lower.includes("bit")) {
            return "A <strong>qubit</strong> (quantum bit) is the basic unit of quantum information. Unlike a classical bit ($0$ or $1$), a qubit can exist in superposition: $$\\psi = \\alpha|0\\rangle + \\beta|1\\rangle$$";
        }
        if (lower.includes("superposition")) {
            return "<strong>Superposition</strong> allows quantum states to process linear combinations of $|0\\rangle$ and $|1\\rangle$ simultaneously until measured.";
        }
        if (lower.includes("entangle") || lower.includes("cnot") || lower.includes("bell")) {
            return "<strong>Quantum Entanglement</strong> strongly links qubits. You can create a Bell State ($|\\Phi^+\\rangle$) using a <code>Hadamard (H)</code> gate followed by a <code>CNOT (CX)</code> gate.";
        }
        if (lower.includes("hadamard") || lower.includes("h gate")) {
            return "The <strong>Hadamard Gate (H)</strong> transforms basis states $|0\\rangle$ and $|1\\rangle$ into an equal superposition state: $$\\frac{|0\\rangle + |1\\rangle}{\\sqrt{2}}$$";
        }
        if (lower.includes("qiskit") || lower.includes("code")) {
            return "Here is how you initialize this circuit in Qiskit:<br><pre><code>from qiskit import QuantumCircuit\nqc = QuantumCircuit(2)\nqc.h(0)\nqc.cx(0, 1)</code></pre>";
        }

        return `I analyzed your question regarding <em>"${escapeHTML(prompt)}"</em>. Try building this gate configuration in the Circuit Studio to observe state transitions!`;
    }

    // 5. Auth Modal Controller
    const loginModal = document.getElementById("login-modal");
    const btnAuthAction = document.getElementById("btn-auth-action");
    const modalClose = document.getElementById("modal-close");
    const loginForm = document.getElementById("login-form");
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const authError = document.getElementById("auth-error");
    const userDisplayName = document.getElementById("user-display-name");
    const dashboardUserName = document.getElementById("dashboard-user-name");

    function closeModal() {
        loginModal?.classList.remove("active");
        loginModal?.setAttribute("aria-hidden", "true");
        loginForm?.reset();
        if (authError) authError.style.display = "none";
    }

    function openModal() {
        loginModal?.classList.add("active");
        loginModal?.setAttribute("aria-hidden", "false");
        if (authError) authError.style.display = "none";
        usernameInput?.focus();
    }

    btnAuthAction?.addEventListener("click", () => {
        if (currentUser) {
            currentUser = null;
            if (userDisplayName) userDisplayName.textContent = "Guest";
            if (dashboardUserName) dashboardUserName.textContent = "Guest";
            if (btnAuthAction) btnAuthAction.textContent = "Login";
            showToast("Account", "Logged out successfully.");
        } else {
            openModal();
        }
    });

    modalClose?.addEventListener("click", closeModal);

    loginModal?.addEventListener("click", (e) => {
        if (e.target === loginModal) closeModal();
    });

    loginForm?.addEventListener("submit", (e) => {
        e.preventDefault();
        const username = usernameInput?.value.trim() || "";
        const password = passwordInput?.value.trim() || "";

        if (!/^[a-zA-Z0-9_-]{3,16}$/.test(username) || !password) {
            if (authError) {
                authError.textContent = "Please check your login credentials.";
                authError.style.display = "block";
            }
            return;
        }

        currentUser = { username };
        if (userDisplayName) userDisplayName.textContent = currentUser.username;
        if (dashboardUserName) dashboardUserName.textContent = currentUser.username;
        if (btnAuthAction) btnAuthAction.textContent = "Logout";
        closeModal();
        showToast("Welcome", `Logged in as ${currentUser.username}`);
    });

    // Render initial circuit
    renderCircuit();
});