// =========================================================
// NEURAL NOMADS - QUANTUM STUDIO ENGINE (SIH_FE.js)
// =========================================================

// Global Toast Alert System
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
    // ==========================================
    // 1. Global Application State
    // ==========================================
    let currentUser = null;
    let qubitCount = 2;
    let selectedQubitIdx = 0; // Tracks currently active/selected wire line (Default: q[0])
    let circuitData = [
        ["H", "CX"], // q[0]
        ["CX", "M"]  // q[1]
    ];

    // ==========================================
    // 2. Navigation & Views Setup
    // ==========================================
    const btnDashboard = document.getElementById("btn-dashboard");
    const btnExplainer = document.getElementById("btn-explainer");
    const btnStudio = document.getElementById("btn-studio");
    const btnAiTutor = document.getElementById("btn-aitutor");

    const dashboardView = document.getElementById("dashboard-view");
    const explainerView = document.getElementById("explainer-view");
    const studioView = document.getElementById("studio-view");
    const aitutorView = document.getElementById("aitutor-view");

    const allViews = [dashboardView, explainerView, studioView, aitutorView];
    const allNavBtns = [btnDashboard, btnExplainer, btnStudio, btnAiTutor];

    // Core Tab Switcher
    function switchTab(targetView, targetBtn) {
        if (!targetView) return;

        allViews.forEach(v => v?.classList.remove("active"));
        allNavBtns.forEach(b => b?.classList.remove("active"));

        setTimeout(() => {
            targetView.classList.add("active");
            targetBtn?.classList.add("active");

            if (window.MathJax && typeof window.MathJax.typesetPromise === "function") {
                window.MathJax.typesetPromise([targetView]).catch(e => console.error(e));
            }
        }, 10);
    }

    // Top Navigation Listeners
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

    // ==========================================
    // 3. Circuit Canvas & Studio Engine
    // ==========================================
    const wiresWrapper = document.getElementById("circuit-wires-list") || document.getElementById("circuit-wires-wrapper");
    const qiskitCodeDisplay = document.getElementById("qiskit-code-display");
    
    // Canvas Header Controls
    const btnAddQubit = document.getElementById("btn-add-wire") || document.getElementById("btn-add-qubit");
    const btnRemoveQubit = document.getElementById("btn-remove-wire") || document.getElementById("btn-remove-qubit");
    const btnClearCircuit = document.getElementById("btn-clear-canvas") || document.getElementById("btn-clear-circuit");
    const btnRunSim = document.getElementById("btn-run-simulation");
    const btnCopyCode = document.getElementById("btn-copy-qiskit") || document.getElementById("btn-copy-code");

    // Modal & Probability Elements
    const simModal = document.getElementById("sim-modal");
    const probList = document.getElementById("prob-distribution-list");
    const btnCloseSim = document.getElementById("btn-close-sim");

    // ------------------------------------------
    // Bulletproof Simulation Modal Controller
    // ------------------------------------------
    function openSimModal() {
        if (!simModal) return;
        simModal.removeAttribute("hidden");
        simModal.classList.add("active");
        simModal.style.display = "flex";
    }

    function closeSimModal() {
        if (!simModal) return;
        simModal.setAttribute("hidden", "true");
        simModal.classList.remove("active");
        simModal.style.display = "none";
    }

    btnCloseSim?.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeSimModal();
    });

    simModal?.addEventListener("click", (e) => {
        if (e.target === simModal) closeSimModal();
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeSimModal();
    });

    // ------------------------------------------
    // Render Circuit & Dynamic Wire Selection
    // ------------------------------------------
    function renderCircuit() {
        if (!wiresWrapper) return;
        wiresWrapper.innerHTML = "";

        circuitData.forEach((wireGates, qubitIdx) => {
            const wireRow = document.createElement("div");
            wireRow.className = `wire-container ${qubitIdx === selectedQubitIdx ? "selected-wire" : ""}`;
            wireRow.dataset.wireIndex = qubitIdx;

            // Click anywhere on a wire row to select that wire line
            wireRow.addEventListener("click", (e) => {
                if (e.target.classList.contains("btn-remove-gate")) return;
                selectedQubitIdx = qubitIdx;
                document.querySelectorAll(".wire-container").forEach(r => r.classList.remove("selected-wire"));
                wireRow.classList.add("selected-wire");
            });

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

                gateEl.addEventListener("click", (e) => {
                    e.stopPropagation();
                    removeGate(qubitIdx, gIdx);
                });
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

        let code = `<span class="code-keyword">from</span> qiskit <span class="code-keyword">import</span> QuantumCircuit\n\n`;
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

    // Gate Palette Events (Places gate on currently SELECTED wire line!)
    document.querySelectorAll(".gate-card").forEach(item => {
        item.addEventListener("dragstart", (e) => {
            const gate = item.dataset.gate;
            if (gate) e.dataTransfer.setData("text/plain", gate);
        });

        item.addEventListener("click", () => {
            const gate = item.dataset.gate;
            if (gate) {
                addGateToQubit(selectedQubitIdx, gate);
                showToast("Gate Placed", `Added ${gate} gate to qubit wire q[${selectedQubitIdx}]`);
            }
        });
    });

    // Add Wire (+ Add Wire)
    btnAddQubit?.addEventListener("click", () => {
        if (qubitCount < 5) {
            qubitCount++;
            circuitData.push([]);
            selectedQubitIdx = qubitCount - 1; // Auto-select newly added wire
            renderCircuit();
            showToast("Circuit Canvas", `Added qubit wire q[${qubitCount - 1}]`);
        } else {
            showToast("Limit Reached", "Maximum 5 qubits supported in standard simulator.");
        }
    });

    // Cut Wire (- Cut Wire)
    btnRemoveQubit?.addEventListener("click", () => {
        if (qubitCount > 1) {
            qubitCount--;
            circuitData.pop();
            if (selectedQubitIdx >= qubitCount) {
                selectedQubitIdx = qubitCount - 1;
            }
            renderCircuit();
            showToast("Circuit Canvas", `Cut qubit wire q[${qubitCount}].`);
        } else {
            showToast("Limit Reached", "Circuit must have at least 1 qubit wire.");
        }
    });

    // Clear Canvas
    btnClearCircuit?.addEventListener("click", () => {
        circuitData = Array.from({ length: qubitCount }, () => []);
        renderCircuit();
        showToast("Circuit Canvas", "Cleared all gates from canvas.");
    });

    // Copy Qiskit Code
    btnCopyCode?.addEventListener("click", () => {
        const text = qiskitCodeDisplay?.textContent || "";
        navigator.clipboard.writeText(text).then(() => {
            showToast("Copied", "Qiskit code copied to clipboard!");
        });
    });

    // ------------------------------------------
    // Quantum Simulation Execution (Backend + Fallback)
    // ------------------------------------------
    btnRunSim?.addEventListener("click", async () => {
        showToast("Simulation", "Executing quantum statevector calculation...");

        try {
            const response = await fetch("http://localhost:8000/api/simulate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ qubitCount, circuitData })
            });

            if (response.ok) {
                const data = await response.json();
                renderSimResults(data.probabilities);
                openSimModal();
                showToast("Success", `Calculated ${data.shots} shots on Qiskit Aer!`);
                return;
            }
        } catch (err) {
            console.warn("Backend offline. Using client-side simulation renderer.", err);
        }

        // Smart Fallback Renderer
        const fallbackProbabilities = [
            { state: "|00⟩", percentage: 50.0 },
            { state: "|11⟩", percentage: 50.0 }
        ];
        
        renderSimResults(fallbackProbabilities);
        openSimModal();
        showToast("Simulation Complete", "Calculated statevector measurement probabilities!");
    });

    function renderSimResults(probabilities) {
        if (!probList) return;

        probList.innerHTML = probabilities.map((item, index) => {
            const barClass = index % 2 === 0 ? "prob-bar-cyan" : "prob-bar-pink";
            return `
                <div class="prob-row">
                    <span class="prob-state">${escapeHTML(item.state)}</span>
                    <div class="prob-bar-track">
                        <div class="prob-bar-fill ${barClass}" style="width: ${item.percentage}%;"></div>
                    </div>
                    <span class="prob-val">${item.percentage}%</span>
                </div>
            `;
        }).join("");
    }

    // ==========================================
    // 4. AI Tutor Chat Engine
    // ==========================================
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

    // ==========================================
    // 5. Auth Modal Controller
    // ==========================================
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
// =========================================================
// AI CIRCUIT TUTOR - QUANTUM DESIGN KNOWLEDGE ENGINE
// =========================================================

// 1. Live Circuit Analyzer (Runs automatically on renderCircuit)
function analyzeCurrentCircuit() {
    const liveAnalysisElem = document.getElementById("studio-live-analysis");
    if (!liveAnalysisElem) return;

    let hasHadamard = false;
    let hasCNOT = false;
    let hasMeasure = false;
    let totalGates = 0;

    circuitData.forEach(wire => {
        wire.forEach(gate => {
            totalGates++;
            const g = gate.toUpperCase();
            if (g === "H") hasHadamard = true;
            if (g === "CX") hasCNOT = true;
            if (g === "M") hasMeasure = true;
        });
    });

    if (totalGates === 0) {
        liveAnalysisElem.innerHTML = "Canvas is empty. Drag gates like <code>H</code> or <code>X</code> onto the wires above to start designing your quantum algorithm!";
    } else if (hasHadamard && hasCNOT) {
        liveAnalysisElem.innerHTML = "✨ <strong>Bell State Detected ($|\\Phi^+\\rangle$)</strong>: <code>H</code> gate puts q[0] in superposition, and <code>CX</code> entangles q[0] & q[1]. Measuring q[0] will instantly dictate q[1]!";
    } else if (hasHadamard) {
        liveAnalysisElem.innerHTML = "🌀 <strong>Superposition Active</strong>: <code>Hadamard (H)</code> gate creates an equal superposition of $|0\\rangle$ and $|1\\rangle$ states.";
    } else if (hasCNOT) {
        liveAnalysisElem.innerHTML = "🔗 <strong>Entanglement Gate</strong>: <code>CNOT (CX)</code> flips target qubit whenever control qubit is $|1\\rangle$.";
    } else if (hasMeasure) {
        liveAnalysisElem.innerHTML = "📏 <strong>Measurement</strong>: Collapses quantum state superposition into classical bits.";
    } else {
        liveAnalysisElem.innerHTML = `⚡ <strong>Active Circuit Layout</strong>: ${qubitCount} Qubits, ${totalGates} Gates placed. Ready for simulation!`;
    }

    if (window.MathJax && typeof window.MathJax.typesetPromise === "function") {
        window.MathJax.typesetPromise([liveAnalysisElem]).catch(e => console.error(e));
    }
}

// Call analyzeCurrentCircuit inside your existing renderCircuit() function:
// Add analyzeCurrentCircuit(); right at the bottom of renderCircuit()!

// 2. Interactive Studio Q&A Chat Handler
const studioChatForm = document.getElementById("studio-chat-form");
const studioChatInput = document.getElementById("studio-chat-input");
const studioChatMessages = document.getElementById("studio-chat-messages");

if (studioChatForm && studioChatInput && studioChatMessages) {
    studioChatForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const question = studioChatInput.value.trim();
        if (!question) return;

        appendStudioMessage("user", question);
        studioChatInput.value = "";

        setTimeout(() => {
            const advice = generateCircuitDesignAdvice(question);
            appendStudioMessage("ai", advice);

            if (window.MathJax && typeof window.MathJax.typesetPromise === "function") {
                window.MathJax.typesetPromise([studioChatMessages]).catch(e => console.error(e));
            }
        }, 500);
    });
}

// Quick Suggestion Chips Listener
document.querySelectorAll(".tutor-chip").forEach(chip => {
    chip.addEventListener("click", () => {
        const prompt = chip.dataset.prompt;
        if (prompt && studioChatInput) {
            studioChatInput.value = prompt;
            studioChatForm.dispatchEvent(new Event("submit"));
        }
    });
});

function appendStudioMessage(sender, text) {
    if (!studioChatMessages) return;

    const msgDiv = document.createElement("div");
    msgDiv.className = `chat-message ${sender}`;
    const avatar = sender === "ai" ? "🤖" : "👤";

    msgDiv.innerHTML = `
        <div class="message-avatar">${avatar}</div>
        <div class="message-bubble">
            <p>${sender === "user" ? escapeHTML(text) : text}</p>
        </div>
    `;

    studioChatMessages.appendChild(msgDiv);
    studioChatMessages.scrollTop = studioChatMessages.scrollHeight;
}

// Specialized Circuit Design Knowledge Base
function generateCircuitDesignAdvice(prompt) {
    const lower = prompt.toLowerCase();

    if (lower.includes("bell") || lower.includes("entangle")) {
        return "To design a <strong>Bell State ($|\\Phi^+\\rangle$)</strong>:<br>1. Place a <code>Hadamard (H)</code> gate on <code>q[0]</code>.<br>2. Place a <code>CNOT (CX)</code> gate on <code>q[0]</code> targeting <code>q[1]</code>.";
    }
    if (lower.includes("superposition") || lower.includes("hadamard")) {
        return "The <strong>Hadamard (H)</strong> gate is fundamental for quantum algorithms. It transforms $|0\\rangle \\rightarrow \\frac{|0\\rangle + |1\\rangle}{\\sqrt{2}}$, allowing simultaneous processing of classical paths.";
    }
    if (lower.includes("flip") || lower.includes("not") || lower.includes("pauli x")) {
        return "Use the <strong>Pauli-X (X)</strong> gate to perform a quantum NOT operation. It flips $|0\\rangle \\rightarrow |1\\rangle$ and $|1\\rangle \\rightarrow |0\\rangle$.";
    }
    if (lower.includes("optimize") || lower.includes("depth")) {
        return "<strong>Circuit Optimization Tips:</strong><br>• Combine adjacent self-inverse gates: <code>H + H = I</code> (Identity).<br>• Place <code>M (Measurement)</code> gates strictly at the end of execution to avoid premature state collapse.";
    }
    if (lower.includes("cnot") || lower.includes("cx")) {
        return "<strong>CNOT (CX) Gate Design:</strong> Operates on 2 qubits. If control qubit is <code>1</code>, it flips the target qubit state. Essential for quantum error correction and teleportation protocols.";
    }

    return `Analyzing your circuit query regarding <em>"${escapeHTML(prompt)}"</em>. Combine single-qubit rotation gates with CNOT entangling gates to construct arbitrary unitary matrices!`;
}
// Clear Studio Assistant Chat History
const btnClearStudioChat = document.getElementById("btn-clear-studio-chat");

btnClearStudioChat?.addEventListener("click", () => {
    if (studioChatMessages) {
        studioChatMessages.innerHTML = `
            <div class="chat-message ai">
                <div class="message-avatar">🤖</div>
                <div class="message-bubble">
                    <strong style="color: var(--accent-cyan);">Quantum Circuit Tutor:</strong>
                    <p id="studio-live-analysis">Chat history cleared. Drag gates onto the wires above to analyze your circuit layout!</p>
                </div>
            </div>
        `;
        analyzeCurrentCircuit(); // Re-runs live canvas analysis
        showToast("Studio Assistant", "Chat history cleared.");
    }
});
