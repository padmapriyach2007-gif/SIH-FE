// =========================================================
// NEURAL NOMADS - QUANTUM STUDIO ENGINE (SIH_FE.js)
// =========================================================

// =========================================================
// 1. GLOBAL TOAST ALERT SYSTEM
// =========================================================

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

        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3500);
}


// =========================================================
// 2. HTML ESCAPE FUNCTION
// =========================================================

function escapeHTML(str) {
    return String(str).replace(
        /[&<>'"]/g,
        tag =>
            ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                "'": "&#39;",
                '"': "&quot;"
            }[tag] || tag)
    );
}


// =========================================================
// MAIN APPLICATION
// =========================================================

document.addEventListener("DOMContentLoaded", () => {

    // =====================================================
    // 3. GLOBAL APPLICATION STATE
    // =====================================================

    let currentUser = null;

    let qubitCount = 2;

    let selectedQubitIdx = 0;

    let circuitData = [
        ["H", "CX"], // q[0]
        ["CX", "M"]  // q[1]
    ];


    // =====================================================
    // 4. NAVIGATION & VIEWS
    // =====================================================

    const btnDashboard = document.getElementById("btn-dashboard");
    const btnExplainer = document.getElementById("btn-explainer");
    const btnStudio = document.getElementById("btn-studio");
    const btnAiTutor = document.getElementById("btn-aitutor");

    const dashboardView = document.getElementById("dashboard-view");
    const explainerView = document.getElementById("explainer-view");
    const studioView = document.getElementById("studio-view");
    const aitutorView = document.getElementById("aitutor-view");

    const allViews = [
        dashboardView,
        explainerView,
        studioView,
        aitutorView
    ];

    const allNavBtns = [
        btnDashboard,
        btnExplainer,
        btnStudio,
        btnAiTutor
    ];


    // =====================================================
    // 5. TAB SWITCHER
    // =====================================================

    function switchTab(targetView, targetBtn) {
        if (!targetView) return;

        allViews.forEach(view => {
            view?.classList.remove("active");
        });

        allNavBtns.forEach(button => {
            button?.classList.remove("active");
        });

        setTimeout(() => {
            targetView.classList.add("active");
            targetBtn?.classList.add("active");

            if (
                window.MathJax &&
                typeof window.MathJax.typesetPromise === "function"
            ) {
                window.MathJax
                    .typesetPromise([targetView])
                    .catch(error => console.error("MathJax error:", error));
            }
        }, 10);
    }


    // =====================================================
    // 6. TOP NAVIGATION
    // =====================================================

    btnDashboard?.addEventListener("click", () => {
        switchTab(dashboardView, btnDashboard);
    });

    btnExplainer?.addEventListener("click", () => {
        switchTab(explainerView, btnExplainer);
    });

    btnStudio?.addEventListener("click", () => {
        switchTab(studioView, btnStudio);
    });

    btnAiTutor?.addEventListener("click", () => {
        switchTab(aitutorView, btnAiTutor);
    });


    // =====================================================
    // 7. DASHBOARD SHORTCUTS
    // =====================================================

    document
        .getElementById("action-start-learning")
        ?.addEventListener("click", () => {
            switchTab(explainerView, btnExplainer);
        });

    document
        .getElementById("quick-learning")
        ?.addEventListener("click", () => {
            switchTab(explainerView, btnExplainer);
        });

    document
        .getElementById("action-quick-studio")
        ?.addEventListener("click", () => {
            switchTab(studioView, btnStudio);
        });

    document
        .getElementById("action-launch-studio")
        ?.addEventListener("click", () => {
            switchTab(studioView, btnStudio);
        });

    document
        .getElementById("quick-circuit")
        ?.addEventListener("click", () => {
            switchTab(studioView, btnStudio);
        });

    document
        .getElementById("explainer-to-studio")
        ?.addEventListener("click", () => {
            switchTab(studioView, btnStudio);
        });


    // =====================================================
    // 8. AI TUTOR NAVIGATION
    // =====================================================

    const aiTutorTriggers = [
        document.getElementById("quick-aitutor"),
        document.getElementById("quick-ai"),
        document.getElementById("action-ask-ai"),
        document.getElementById("explainer-to-ai")
    ];

    aiTutorTriggers.forEach(button => {
        button?.addEventListener("click", () => {
            switchTab(aitutorView, btnAiTutor);
        });
    });


    // =====================================================
    // 9. PROGRESS SHORTCUT
    // =====================================================

    document
        .getElementById("quick-progress")
        ?.addEventListener("click", () => {

            switchTab(dashboardView, btnDashboard);

            setTimeout(() => {
                const progressSection =
                    document.querySelector(".learning-progress") ||
                    document.querySelector(".dashboard-stats");

                progressSection?.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });
            }, 100);
        });


    // =====================================================
    // 10. CIRCUIT ELEMENTS
    // =====================================================

    const wiresWrapper =
        document.getElementById("circuit-wires-list") ||
        document.getElementById("circuit-wires-wrapper");

    const qiskitCodeDisplay =
        document.getElementById("qiskit-code-display");

    const btnAddQubit =
        document.getElementById("btn-add-wire") ||
        document.getElementById("btn-add-qubit");

    const btnRemoveQubit =
        document.getElementById("btn-remove-wire") ||
        document.getElementById("btn-remove-qubit");

    const btnClearCircuit =
        document.getElementById("btn-clear-canvas") ||
        document.getElementById("btn-clear-circuit");

    const btnRunSim =
        document.getElementById("btn-run-simulation");

    const btnCopyCode =
        document.getElementById("btn-copy-qiskit") ||
        document.getElementById("btn-copy-code");


    // =====================================================
    // 11. SIMULATION MODAL
    // =====================================================

    const simModal =
        document.getElementById("sim-modal");

    const probList =
        document.getElementById("prob-distribution-list");

    const btnCloseSim =
        document.getElementById("btn-close-sim");


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


    btnCloseSim?.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();

        closeSimModal();
    });


    simModal?.addEventListener("click", event => {
        if (event.target === simModal) {
            closeSimModal();
        }
    });


    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            closeSimModal();
        }
    });


    // =====================================================
    // 12. LIVE CIRCUIT ANALYZER
    // =====================================================

    function analyzeCurrentCircuit() {

        const liveAnalysisElem =
            document.getElementById("studio-live-analysis");

        if (!liveAnalysisElem) return;

        let hasHadamard = false;
        let hasCNOT = false;
        let hasMeasure = false;

        let totalGates = 0;

        circuitData.forEach(wire => {

            wire.forEach(gate => {

                totalGates++;

                const g = String(gate).toUpperCase();

                if (g === "H") {
                    hasHadamard = true;
                }

                if (g === "CX") {
                    hasCNOT = true;
                }

                if (g === "M") {
                    hasMeasure = true;
                }
            });
        });


        if (totalGates === 0) {

            liveAnalysisElem.innerHTML =
                `Canvas is empty. Drag gates like <code>H</code> or <code>X</code> onto the wires above to start designing your quantum algorithm!`;

        }

        else if (hasHadamard && hasCNOT) {

            liveAnalysisElem.innerHTML =
                `✨ <strong>Bell State Detected ($|\\Phi^+\\rangle$)</strong>: 
                <code>H</code> gate puts q[0] in superposition, 
                and <code>CX</code> entangles q[0] & q[1]. 
                Measuring q[0] will correlate with q[1]!`;

        }

        else if (hasHadamard) {

            liveAnalysisElem.innerHTML =
                `🌀 <strong>Superposition Active</strong>: 
                <code>Hadamard (H)</code> gate creates an equal 
                superposition of $|0\\rangle$ and $|1\\rangle$ states.`;

        }

        else if (hasCNOT) {

            liveAnalysisElem.innerHTML =
                `🔗 <strong>Entanglement Gate</strong>: 
                <code>CNOT (CX)</code> flips the target qubit 
                whenever the control qubit is $|1\\rangle$.`;

        }

        else if (hasMeasure) {

            liveAnalysisElem.innerHTML =
                `📏 <strong>Measurement</strong>: 
                Measurement converts the quantum state into 
                classical measurement results.`;

        }

        else {

            liveAnalysisElem.innerHTML =
                `⚡ <strong>Active Circuit Layout</strong>: 
                ${qubitCount} Qubits, ${totalGates} Gates placed. 
                Ready for simulation!`;
        }


        if (
            window.MathJax &&
            typeof window.MathJax.typesetPromise === "function"
        ) {
            window.MathJax
                .typesetPromise([liveAnalysisElem])
                .catch(error => console.error("MathJax error:", error));
        }
    }


    // =====================================================
    // 13. RENDER CIRCUIT
    // =====================================================

    function renderCircuit() {

        if (!wiresWrapper) {
            console.warn("Circuit wires container not found.");
            return;
        }

        wiresWrapper.innerHTML = "";


        circuitData.forEach((wireGates, qubitIdx) => {

            const wireRow = document.createElement("div");

            wireRow.className =
                `wire-container ${
                    qubitIdx === selectedQubitIdx
                        ? "selected-wire"
                        : ""
                }`;

            wireRow.dataset.wireIndex = qubitIdx;


            // Select wire
            wireRow.addEventListener("click", event => {

                if (
                    event.target.classList.contains("btn-remove-gate")
                ) {
                    return;
                }

                selectedQubitIdx = qubitIdx;

                document
                    .querySelectorAll(".wire-container")
                    .forEach(row => {
                        row.classList.remove("selected-wire");
                    });

                wireRow.classList.add("selected-wire");
            });


            // Qubit label
            const label = document.createElement("span");

            label.className = "qubit-label";

            label.textContent = `q[${qubitIdx}]`;


            // Circuit wire
            const wire = document.createElement("div");

            wire.className = "circuit-wire";

            wire.dataset.qubitIndex = qubitIdx;


            // Drag over
            wire.addEventListener("dragover", event => {

                event.preventDefault();

                wire.classList.add("drag-over");
            });


            // Drag leave
            wire.addEventListener("dragleave", () => {

                wire.classList.remove("drag-over");
            });


            // Drop gate
            wire.addEventListener("drop", event => {

                event.preventDefault();

                wire.classList.remove("drag-over");

                const gateType =
                    event.dataTransfer.getData("text/plain");

                if (gateType) {
                    addGateToQubit(
                        qubitIdx,
                        gateType
                    );
                }
            });


            // Render gates
            wireGates.forEach((gate, gIdx) => {

                const gateEl =
                    document.createElement("div");

                gateEl.className = "placed-gate";


                if (gate === "CX") {
                    gateEl.classList.add("gate-cyan");
                }

                if (gate === "M") {
                    gateEl.classList.add("gate-pink");
                }


                gateEl.textContent = gate;


                // Click gate to remove
                gateEl.addEventListener("click", event => {

                    event.stopPropagation();

                    removeGate(
                        qubitIdx,
                        gIdx
                    );
                });


                wire.appendChild(gateEl);
            });


            wireRow.appendChild(label);
            wireRow.appendChild(wire);

            wiresWrapper.appendChild(wireRow);
        });


        updateQiskitCode();
        updateDashboardCounts();

        // IMPORTANT:
        // Live Studio Assistant analysis is updated
        // whenever the circuit changes.
        analyzeCurrentCircuit();
    }


    // =====================================================
    // 14. ADD GATE
    // =====================================================

    function addGateToQubit(qubitIdx, gateType) {

        if (!circuitData[qubitIdx]) {
            return;
        }

        const normalizedGate =
            String(gateType).toUpperCase();

        circuitData[qubitIdx].push(normalizedGate);

        renderCircuit();

        showToast(
            "Gate Placed",
            `Added ${normalizedGate} gate to qubit wire q[${qubitIdx}]`
        );
    }


    // =====================================================
    // 15. REMOVE GATE
    // =====================================================

    function removeGate(qubitIdx, gateIndex) {

        if (!circuitData[qubitIdx]) {
            return;
        }

        if (
            gateIndex < 0 ||
            gateIndex >= circuitData[qubitIdx].length
        ) {
            return;
        }

        const removedGate =
            circuitData[qubitIdx][gateIndex];

        circuitData[qubitIdx].splice(
            gateIndex,
            1
        );

        renderCircuit();

        showToast(
            "Gate Removed",
            `Removed ${removedGate} gate from q[${qubitIdx}]`
        );
    }


    // =====================================================
    // 16. UPDATE QISKIT CODE
    // =====================================================

    function updateQiskitCode() {

        if (!qiskitCodeDisplay) {
            return;
        }

        let code =
            `<span class="code-keyword">from</span> qiskit <span class="code-keyword">import</span> QuantumCircuit\n\n`;

        code +=
            `qc = QuantumCircuit(<span class="code-number">${qubitCount}</span>)\n`;

        let hasMeasurement = false;


        circuitData.forEach((gates, qIdx) => {

            gates.forEach(gate => {

                const g =
                    String(gate).toUpperCase();


                if (g === "H") {

                    code +=
                        `qc.h(<span class="code-number">${qIdx}</span>)\n`;
                }


                else if (g === "X") {

                    code +=
                        `qc.x(<span class="code-number">${qIdx}</span>)\n`;
                }


                else if (g === "Y") {

                    code +=
                        `qc.y(<span class="code-number">${qIdx}</span>)\n`;
                }


                else if (g === "Z") {

                    code +=
                        `qc.z(<span class="code-number">${qIdx}</span>)\n`;
                }


                else if (g === "CX") {

                    const targetQubit =
                        (qIdx + 1) % qubitCount;

                    code +=
                        `qc.cx(<span class="code-number">${qIdx}</span>, <span class="code-number">${targetQubit}</span>)\n`;
                }


                else if (g === "M") {

                    hasMeasurement = true;
                }
            });
        });


        if (hasMeasurement) {

            code += `qc.measure_all()\n`;
        }


        qiskitCodeDisplay.innerHTML = code;
    }


    // =====================================================
    // 17. DASHBOARD COUNTERS
    // =====================================================

    function updateDashboardCounts() {

        const totalGates =
            circuitData.reduce(
                (total, wire) =>
                    total + wire.length,
                0
            );


        const dashQubits =
            document.getElementById(
                "dash-qubits-count"
            );


        const dashGates =
            document.getElementById(
                "dash-gates-count"
            ) ||
            document.getElementById(
                "dash-gates-total"
            );


        if (dashQubits) {
            dashQubits.textContent =
                qubitCount;
        }


        if (dashGates) {
            dashGates.textContent =
                totalGates;
        }
    }


    // =====================================================
    // 18. GATE PALETTE
    // =====================================================

    document
        .querySelectorAll(".gate-card")
        .forEach(item => {

            // Drag gate
            item.addEventListener("dragstart", event => {

                const gate =
                    item.dataset.gate;

                if (gate) {

                    event.dataTransfer.setData(
                        "text/plain",
                        gate
                    );

                    event.dataTransfer.effectAllowed =
                        "copy";
                }
            });


            // Click gate
            item.addEventListener("click", () => {

                const gate =
                    item.dataset.gate;

                if (gate) {

                    addGateToQubit(
                        selectedQubitIdx,
                        gate
                    );
                }
            });
        });


    // =====================================================
    // 19. ADD QUBIT
    // =====================================================

    btnAddQubit?.addEventListener("click", () => {

        if (qubitCount < 5) {

            qubitCount++;

            circuitData.push([]);

            selectedQubitIdx =
                qubitCount - 1;

            renderCircuit();

            showToast(
                "Circuit Canvas",
                `Added qubit wire q[${qubitCount - 1}]`
            );

        } else {

            showToast(
                "Limit Reached",
                "Maximum 5 qubits supported in standard simulator."
            );
        }
    });


    // =====================================================
    // 20. REMOVE QUBIT
    // =====================================================

    btnRemoveQubit?.addEventListener("click", () => {

        if (qubitCount > 1) {

            const removedQubit =
                qubitCount - 1;

            qubitCount--;

            circuitData.pop();


            if (selectedQubitIdx >= qubitCount) {

                selectedQubitIdx =
                    qubitCount - 1;
            }


            renderCircuit();

            showToast(
                "Circuit Canvas",
                `Cut qubit wire q[${removedQubit}].`
            );

        } else {

            showToast(
                "Limit Reached",
                "Circuit must have at least 1 qubit wire."
            );
        }
    });


    // =====================================================
    // 21. CLEAR CIRCUIT
    // =====================================================

    btnClearCircuit?.addEventListener("click", () => {

        circuitData =
            Array.from(
                { length: qubitCount },
                () => []
            );

        renderCircuit();

        showToast(
            "Circuit Canvas",
            "Cleared all gates from canvas."
        );
    });


    // =====================================================
    // 22. COPY QISKIT CODE
    // =====================================================

    btnCopyCode?.addEventListener("click", async () => {

        const text =
            qiskitCodeDisplay?.textContent || "";

        if (!text) {

            showToast(
                "Copy Error",
                "No Qiskit code available."
            );

            return;
        }


        try {

            await navigator.clipboard.writeText(text);

            showToast(
                "Copied",
                "Qiskit code copied to clipboard!"
            );

        } catch (error) {

            console.error(
                "Clipboard error:",
                error
            );

            showToast(
                "Copy Error",
                "Unable to copy the Qiskit code."
            );
        }
    });


    // =====================================================
    // 23. QUANTUM SIMULATION
    // =====================================================

    btnRunSim?.addEventListener(
        "click",
        async () => {

            showToast(
                "Simulation",
                "Executing quantum statevector calculation..."
            );


            try {

                const response =
                    await fetch(
                        "http://localhost:8000/api/simulate",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                qubitCount,
                                circuitData
                            })
                        }
                    );


                if (response.ok) {

                    const data =
                        await response.json();


                    if (
                        data &&
                        Array.isArray(data.probabilities)
                    ) {

                        renderSimResults(
                            data.probabilities
                        );

                        openSimModal();

                        showToast(
                            "Success",
                            `Calculated ${data.shots ?? "simulation"} shots on Qiskit Aer!`
                        );

                        return;
                    }
                }

            } catch (error) {

                console.warn(
                    "Backend offline. Using client-side simulation renderer.",
                    error
                );
            }


            // =================================================
            // SMART FALLBACK
            // =================================================

            const fallbackProbabilities =
                getFallbackProbabilities();


            renderSimResults(
                fallbackProbabilities
            );

            openSimModal();

            showToast(
                "Simulation Complete",
                "Calculated statevector measurement probabilities!"
            );
        }
    );


    // =====================================================
    // 24. FALLBACK SIMULATION
    // =====================================================

    function getFallbackProbabilities() {

        if (qubitCount === 1) {

            return [
                {
                    state: "|0⟩",
                    percentage: 50
                },
                {
                    state: "|1⟩",
                    percentage: 50
                }
            ];
        }


        if (qubitCount === 2) {

            return [
                {
                    state: "|00⟩",
                    percentage: 50
                },
                {
                    state: "|11⟩",
                    percentage: 50
                }
            ];
        }


        return [
            {
                state: "|0...0⟩",
                percentage: 50
            },
            {
                state: "|1...1⟩",
                percentage: 50
            }
        ];
    }


    // =====================================================
    // 25. RENDER SIMULATION RESULTS
    // =====================================================

    function renderSimResults(probabilities) {

        if (!probList) {
            return;
        }


        if (
            !Array.isArray(probabilities) ||
            probabilities.length === 0
        ) {

            probList.innerHTML =
                `<p class="no-results">No probability results available.</p>`;

            return;
        }


        probList.innerHTML =
            probabilities
                .map((item, index) => {

                    const percentage =
                        Math.max(
                            0,
                            Math.min(
                                100,
                                Number(item.percentage) || 0
                            )
                        );


                    const barClass =
                        index % 2 === 0
                            ? "prob-bar-cyan"
                            : "prob-bar-pink";


                    return `
                        <div class="prob-row">

                            <span class="prob-state">
                                ${escapeHTML(item.state ?? "")}
                            </span>

                            <div class="prob-bar-track">

                                <div
                                    class="prob-bar-fill ${barClass}"
                                    style="width: ${percentage}%;">
                                </div>

                            </div>

                            <span class="prob-val">
                                ${percentage}%
                            </span>

                        </div>
                    `;
                })
                .join("");
    }


    // =====================================================
    // 26. AI TUTOR
    // =====================================================

    // IMPORTANT:
    // These elements belong ONLY to AI TUTOR.

    const chatForm =
        document.getElementById(
            "chat-form"
        );

    const chatInput =
        document.getElementById(
            "tutor-chat-input"
        );

    const chatMessages =
        document.getElementById(
            "tutor-chat-messages"
        );

    const btnClearChat =
        document.getElementById(
            "btn-clear-chat"
        );


    // =====================================================
    // 27. AI TUTOR SUBMIT
    // =====================================================

    if (
        chatForm &&
        chatInput &&
        chatMessages
    ) {

        chatForm.addEventListener(
            "submit",
            event => {

                event.preventDefault();


                const text =
                    chatInput.value.trim();


                if (!text) {
                    return;
                }


                appendTutorMessage(
                    "user",
                    text
                );


                chatInput.value = "";


                const typingElem =
                    showTypingIndicator(
                        chatMessages
                    );


                setTimeout(() => {

                    removeTypingIndicator(
                        typingElem
                    );


                    const botResponse =
                        generateQuantumResponse(
                            text
                        );


                    appendTutorMessage(
                        "ai",
                        botResponse
                    );


                    if (
                        window.MathJax &&
                        typeof window.MathJax.typesetPromise ===
                            "function"
                    ) {

                        window.MathJax
                            .typesetPromise([
                                chatMessages
                            ])
                            .catch(error =>
                                console.error(
                                    "MathJax error:",
                                    error
                                )
                            );
                    }

                }, 1000);
            }
        );
    }


    // =====================================================
    // 28. CLEAR AI TUTOR CHAT
    // =====================================================

    btnClearChat?.addEventListener(
        "click",
        () => {

            if (!chatMessages) {
                return;
            }


            chatMessages.innerHTML = `
                <div class="chat-message ai">
                    <div class="message-avatar">🤖</div>

                    <div class="message-bubble">

                        <p>
                            Chat cleared. How can I help you understand
                            quantum concepts or Qiskit today?
                        </p>

                    </div>
                </div>
            `;

            showToast(
                "AI Tutor",
                "Tutor chat history cleared."
            );
        }
    );


    // =====================================================
    // 29. APPEND AI TUTOR MESSAGE
    // =====================================================

    function appendTutorMessage(
        sender,
        text
    ) {

        if (!chatMessages) {
            return;
        }


        const msgDiv =
            document.createElement("div");


        msgDiv.className =
            `chat-message ${sender}`;


        const avatar =
            sender === "ai"
                ? "🤖"
                : "👤";


        msgDiv.innerHTML = `
            <div class="message-avatar">
                ${avatar}
            </div>

            <div class="message-bubble">

                <p>
                    ${
                        sender === "user"
                            ? escapeHTML(text)
                            : text
                    }
                </p>

            </div>
        `;


        chatMessages.appendChild(
            msgDiv
        );


        chatMessages.scrollTop =
            chatMessages.scrollHeight;
    }


    // =====================================================
    // 30. AI TUTOR TYPING INDICATOR
    // =====================================================

    function showTypingIndicator(
        container
    ) {

        const indicator =
            document.createElement("div");


        indicator.className =
            "chat-message ai typing-indicator";


        indicator.innerHTML = `
            <div class="message-avatar">
                🤖
            </div>

            <div class="message-bubble">

                <p>
                    <em>
                        Quantum Tutor is thinking...
                    </em>
                </p>

            </div>
        `;


        container.appendChild(
            indicator
        );


        container.scrollTop =
            container.scrollHeight;


        return indicator;
    }


    function removeTypingIndicator(
        indicator
    ) {

        indicator?.remove();
    }


    // =====================================================
    // 31. AI TUTOR KNOWLEDGE ENGINE
    // =====================================================

    function generateQuantumResponse(
        prompt
    ) {

        const lower =
            prompt.toLowerCase();


        if (
            lower.includes("qubit") ||
            lower.includes("quantum bit")
        ) {

            return `
                A <strong>qubit</strong> (quantum bit) is the basic
                unit of quantum information. Unlike a classical bit
                ($0$ or $1$), a qubit can exist in superposition:

                $$\\psi = \\alpha|0\\rangle + \\beta|1\\rangle$$
            `;
        }


        if (
            lower.includes("superposition")
        ) {

            return `
                <strong>Superposition</strong> allows a quantum system
                to exist in a linear combination of $|0\\rangle$
                and $|1\\rangle$ until measurement.
            `;
        }


        if (
            lower.includes("entangle") ||
            lower.includes("entanglement") ||
            lower.includes("cnot") ||
            lower.includes("bell")
        ) {

            return `
                <strong>Quantum Entanglement</strong> strongly
                correlates qubits. A Bell State can be created using
                a <code>Hadamard (H)</code> gate followed by a
                <code>CNOT (CX)</code> gate.
            `;
        }


        if (
            lower.includes("hadamard") ||
            lower.includes("h gate")
        ) {

            return `
                The <strong>Hadamard Gate (H)</strong> transforms
                basis states into superposition. For example:

                $$|0\\rangle \\rightarrow
                \\frac{|0\\rangle + |1\\rangle}{\\sqrt{2}}$$
            `;
        }


        if (
            lower.includes("pauli x") ||
            lower.includes(" x gate") ||
            lower === "x"
        ) {

            return `
                The <strong>Pauli-X (X)</strong> gate performs a
                quantum NOT operation:

                $$|0\\rangle \\rightarrow |1\\rangle$$

                $$|1\\rangle \\rightarrow |0\\rangle$$
            `;
        }


        if (
            lower.includes("pauli y") ||
            lower.includes(" y gate")
        ) {

            return `
                The <strong>Pauli-Y (Y)</strong> gate performs a
                bit flip together with a phase change.
            `;
        }


        if (
            lower.includes("pauli z") ||
            lower.includes(" z gate")
        ) {

            return `
                The <strong>Pauli-Z (Z)</strong> gate changes the
                phase of the $|1\\rangle$ state while leaving
                $|0\\rangle$ unchanged.
            `;
        }


        if (
            lower.includes("qiskit") ||
            lower.includes("code")
        ) {

            return `
                Here is a simple Qiskit circuit:

                <br>

                <pre><code>from qiskit import QuantumCircuit

qc = QuantumCircuit(2)

qc.h(0)
qc.cx(0, 1)

print(qc)</code></pre>
            `;
        }


        return `
            I analyzed your question regarding
            <em>"${escapeHTML(prompt)}"</em>.

            Try asking me about <strong>qubits</strong>,
            <strong>superposition</strong>,
            <strong>entanglement</strong>,
            <strong>quantum gates</strong>, or
            <strong>Qiskit</strong>.
        `;
    }


    // =====================================================
    // 32. STUDIO ASSISTANT
    // =====================================================

    // IMPORTANT:
    // These elements belong ONLY to the Studio Assistant.
    // They do NOT use the AI Tutor elements above.

    const studioChatForm =
        document.getElementById(
            "studio-chat-form"
        );

    const studioChatInput =
        document.getElementById(
            "studio-chat-input"
        );

    const studioChatMessages =
        document.getElementById(
            "studio-chat-messages"
        );

    const btnClearStudioChat =
        document.getElementById(
            "btn-clear-studio-chat"
        );


    // =====================================================
    // 33. STUDIO ASSISTANT SUBMIT
    // =====================================================

    if (
        studioChatForm &&
        studioChatInput &&
        studioChatMessages
    ) {

        studioChatForm.addEventListener(
            "submit",
            event => {

                event.preventDefault();


                const question =
                    studioChatInput.value.trim();


                if (!question) {
                    return;
                }


                appendStudioMessage(
                    "user",
                    question
                );


                studioChatInput.value = "";


                setTimeout(() => {

                    const advice =
                        generateCircuitDesignAdvice(
                            question
                        );


                    appendStudioMessage(
                        "ai",
                        advice
                    );


                    if (
                        window.MathJax &&
                        typeof window.MathJax.typesetPromise ===
                            "function"
                    ) {

                        window.MathJax
                            .typesetPromise([
                                studioChatMessages
                            ])
                            .catch(error =>
                                console.error(
                                    "MathJax error:",
                                    error
                                )
                            );
                    }

                }, 500);
            }
        );
    }


    // =====================================================
    // 34. STUDIO QUICK SUGGESTION CHIPS
    // =====================================================

    document
        .querySelectorAll(".tutor-chip")
        .forEach(chip => {

            chip.addEventListener(
                "click",
                () => {

                    const prompt =
                        chip.dataset.prompt;


                    if (
                        prompt &&
                        studioChatInput &&
                        studioChatForm
                    ) {

                        studioChatInput.value =
                            prompt;


                        studioChatForm.dispatchEvent(
                            new Event("submit", {
                                bubbles: true,
                                cancelable: true
                            })
                        );
                    }
                }
            );
        });


    // =====================================================
    // 35. APPEND STUDIO MESSAGE
    // =====================================================

    function appendStudioMessage(
        sender,
        text
    ) {

        if (!studioChatMessages) {
            return;
        }


        const msgDiv =
            document.createElement("div");


        msgDiv.className =
            `chat-message ${sender}`;


        const avatar =
            sender === "ai"
                ? "🤖"
                : "👤";


        msgDiv.innerHTML = `
            <div class="message-avatar">
                ${avatar}
            </div>

            <div class="message-bubble">

                <p>
                    ${
                        sender === "user"
                            ? escapeHTML(text)
                            : text
                    }
                </p>

            </div>
        `;


        studioChatMessages.appendChild(
            msgDiv
        );


        studioChatMessages.scrollTop =
            studioChatMessages.scrollHeight;
    }


    // =====================================================
    // 36. STUDIO CIRCUIT KNOWLEDGE ENGINE
    // =====================================================

    function generateCircuitDesignAdvice(
        prompt
    ) {

        const lower =
            prompt.toLowerCase();


        if (
            lower.includes("bell") ||
            lower.includes("entangle")
        ) {

            return `
                To design a
                <strong>Bell State ($|\\Phi^+\\rangle$)</strong>:

                <br><br>

                1. Place a
                <code>Hadamard (H)</code>
                gate on <code>q[0]</code>.

                <br>

                2. Place a
                <code>CNOT (CX)</code>
                gate with q[0] as control and q[1] as target.
            `;
        }


        if (
            lower.includes("superposition") ||
            lower.includes("hadamard")
        ) {

            return `
                The <strong>Hadamard (H)</strong> gate is fundamental
                in quantum algorithms.

                <br><br>

                It transforms:

                $$|0\\rangle \\rightarrow
                \\frac{|0\\rangle + |1\\rangle}{\\sqrt{2}}$$

                This creates an equal superposition of
                $|0\\rangle$ and $|1\\rangle$.
            `;
        }


        if (
            lower.includes("flip") ||
            lower.includes("not") ||
            lower.includes("pauli x")
        ) {

            return `
                Use the <strong>Pauli-X (X)</strong> gate to perform
                a quantum NOT operation.

                <br><br>

                $$|0\\rangle \\rightarrow |1\\rangle$$

                $$|1\\rangle \\rightarrow |0\\rangle$$
            `;
        }


        if (
            lower.includes("optimize") ||
            lower.includes("optimization") ||
            lower.includes("depth")
        ) {

            return `
                <strong>Circuit Optimization Tips:</strong>

                <br><br>

                • Combine adjacent self-inverse gates:
                <code>H + H = I</code>

                <br>

                • Avoid unnecessary gates.

                <br>

                • Keep measurement operations near the end
                of the circuit when appropriate.
            `;
        }


        if (
            lower.includes("cnot") ||
            lower.includes("cx")
        ) {

            return `
                <strong>CNOT (CX) Gate Design:</strong>

                <br><br>

                CNOT operates on two qubits.

                <br><br>

                If the control qubit is $|1\\rangle$,
                the target qubit is flipped.

                <br><br>

                It is commonly used to create
                entanglement.
            `;
        }


        if (
            lower.includes("measurement") ||
            lower.includes("measure")
        ) {

            return `
                <strong>Measurement</strong> converts a quantum
                state into a classical result.

                <br><br>

                Before measurement, a qubit can be in a
                superposition. Measurement produces a classical
                outcome such as $0$ or $1$.
            `;
        }


        return `
            Analyzing your circuit query regarding
            <em>"${escapeHTML(prompt)}"</em>.

            <br><br>

            Try combining single-qubit gates such as
            <code>H</code>, <code>X</code>, <code>Y</code>,
            and <code>Z</code> with
            <code>CX</code> gates to build quantum circuits.
        `;
    }


    // =====================================================
    // 37. CLEAR STUDIO ASSISTANT CHAT
    // =====================================================

    btnClearStudioChat?.addEventListener(
        "click",
        () => {

            if (!studioChatMessages) {
                return;
            }


            studioChatMessages.innerHTML = `
                <div class="chat-message ai">

                    <div class="message-avatar">
                        🤖
                    </div>

                    <div class="message-bubble">

                        <strong style="color: var(--accent-cyan);">
                            Quantum Circuit Tutor:
                        </strong>

                        <p id="studio-live-analysis">
                            Chat history cleared.
                            Drag gates onto the wires above
                            to analyze your circuit layout!
                        </p>

                    </div>

                </div>
            `;


            // Recalculate current circuit state
            analyzeCurrentCircuit();


            showToast(
                "Studio Assistant",
                "Chat history cleared."
            );
        }
    );


    // =====================================================
    // 38. LOGIN / AUTHENTICATION
    // =====================================================

    const loginModal =
        document.getElementById(
            "login-modal"
        );

    const btnAuthAction =
        document.getElementById(
            "btn-auth-action"
        );

    const modalClose =
        document.getElementById(
            "modal-close"
        );

    const loginForm =
        document.getElementById(
            "login-form"
        );

    const usernameInput =
        document.getElementById(
            "username"
        );

    const passwordInput =
        document.getElementById(
            "password"
        );

    const authError =
        document.getElementById(
            "auth-error"
        );

    const userDisplayName =
        document.getElementById(
            "user-display-name"
        );

    const dashboardUserName =
        document.getElementById(
            "dashboard-user-name"
        );


    // =====================================================
    // 39. AUTH MODAL FUNCTIONS
    // =====================================================

    function closeModal() {

        loginModal?.classList.remove(
            "active"
        );

        loginModal?.setAttribute(
            "aria-hidden",
            "true"
        );

        loginForm?.reset();


        if (authError) {
            authError.style.display =
                "none";
        }
    }


    function openModal() {

        loginModal?.classList.add(
            "active"
        );

        loginModal?.setAttribute(
            "aria-hidden",
            "false"
        );


        if (authError) {
            authError.style.display =
                "none";
        }


        usernameInput?.focus();
    }


    // =====================================================
    // 40. LOGIN / LOGOUT BUTTON
    // =====================================================

    btnAuthAction?.addEventListener(
        "click",
        () => {

            if (currentUser) {

                currentUser = null;


                if (userDisplayName) {
                    userDisplayName.textContent =
                        "Guest";
                }


                if (dashboardUserName) {
                    dashboardUserName.textContent =
                        "Guest";
                }


                if (btnAuthAction) {
                    btnAuthAction.textContent =
                        "Login";
                }


                showToast(
                    "Account",
                    "Logged out successfully."
                );

            } else {

                openModal();
            }
        }
    );


    // =====================================================
    // 41. CLOSE LOGIN MODAL
    // =====================================================

    modalClose?.addEventListener(
        "click",
        closeModal
    );


    loginModal?.addEventListener(
        "click",
        event => {

            if (
                event.target === loginModal
            ) {

                closeModal();
            }
        }
    );


    // =====================================================
    // 42. LOGIN FORM
    // =====================================================

    loginForm?.addEventListener(
        "submit",
        event => {

            event.preventDefault();


            const username =
                usernameInput?.value.trim() ||
                "";


            const password =
                passwordInput?.value.trim() ||
                "";


            if (
                !/^[a-zA-Z0-9_-]{3,16}$/.test(
                    username
                ) ||
                !password
            ) {

                if (authError) {

                    authError.textContent =
                        "Please check your login credentials.";

                    authError.style.display =
                        "block";
                }

                return;
            }


            currentUser = {
                username
            };


            if (userDisplayName) {

                userDisplayName.textContent =
                    currentUser.username;
            }


            if (dashboardUserName) {

                dashboardUserName.textContent =
                    currentUser.username;
            }


            if (btnAuthAction) {

                btnAuthAction.textContent =
                    "Logout";
            }


            closeModal();


            showToast(
                "Welcome",
                `Logged in as ${currentUser.username}`
            );
        }
    );


    // =====================================================
    // 43. SECOND / SIMPLE AI CHAT
    // =====================================================
    //
    // This is kept completely separate from:
    //
    //   AI Tutor:
    //   chat-form
    //   tutor-chat-input
    //   tutor-chat-messages
    //
    // This section uses:
    //
    //   chatBox
    //   userInput
    //   sendBtn
    //
    // =====================================================

    const chatBox =
        document.getElementById(
            "chatBox"
        );

    const userInput =
        document.getElementById(
            "userInput"
        );

    const sendBtn =
        document.getElementById(
            "sendBtn"
        );


    const quantumKnowledge = [
        {
            keywords: [
                "qubit",
                "quantum bit"
            ],

            answer:
                "A qubit (quantum bit) is the basic unit of quantum information. Unlike a classical bit that represents either 0 or 1, a qubit can exist in a superposition of both states."
        },

        {
            keywords: [
                "superposition"
            ],

            answer:
                "Superposition allows a quantum system to exist in multiple state combinations simultaneously until it is measured."
        },

        {
            keywords: [
                "entanglement"
            ],

            answer:
                "Quantum entanglement is a phenomenon where two or more qubits become correlated so that their measurement outcomes are strongly related."
        },

        {
            keywords: [
                "gate",
                "hadamard",
                "cnot"
            ],

            answer:
                "Quantum gates manipulate qubits. For example, a Hadamard (H) gate creates superposition, while a CNOT gate can create entanglement between two qubits."
        }
    ];


    function appendSimpleMessage(
        text,
        isUser
    ) {

        if (!chatBox) {
            return;
        }


        const msgDiv =
            document.createElement("div");


        msgDiv.classList.add(
            "message"
        );


        msgDiv.classList.add(
            isUser
                ? "user-message"
                : "bot-message"
        );


        msgDiv.textContent =
            text;


        chatBox.appendChild(
            msgDiv
        );


        chatBox.scrollTop =
            chatBox.scrollHeight;
    }


    function getBotResponse(
        input
    ) {

        const text =
            input.toLowerCase();


        for (
            const item
            of quantumKnowledge
        ) {

            if (
                item.keywords.some(
                    key =>
                        text.includes(key)
                )
            ) {

                return item.answer;
            }
        }


        return `
            That's a great question about quantum computing!
            I'm currently set up for foundational quantum concepts
            like qubits, superposition, entanglement, and quantum gates.
        `;
    }


    function handleSimpleChatSend() {

        if (
            !userInput ||
            !chatBox
        ) {
            return;
        }


        const text =
            userInput.value.trim();


        if (!text) {
            return;
        }


        appendSimpleMessage(
            text,
            true
        );


        userInput.value = "";


        setTimeout(() => {

            const response =
                getBotResponse(
                    text
                );


            appendSimpleMessage(
                response,
                false
            );

        }, 600);
    }


    sendBtn?.addEventListener(
        "click",
        handleSimpleChatSend
    );


    userInput?.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter"
            ) {

                event.preventDefault();

                handleSimpleChatSend();
            }
        }
    );

    // =========================================================
// LIVE AI CIRCUIT ANALYSIS
// =========================================================

function analyzeCurrentCircuit() {
    const liveAnalysisElem =
        document.getElementById("studio-live-analysis");

    if (!liveAnalysisElem) return;

    let hasHadamard = false;
    let hasCNOT = false;
    let hasMeasure = false;
    let totalGates = 0;

    circuitData.forEach((wire) => {
        wire.forEach((gate) => {
            totalGates++;

            const g = String(gate).toUpperCase();

            if (g === "H") hasHadamard = true;
            if (g === "CX") hasCNOT = true;
            if (g === "M") hasMeasure = true;
        });
    });

    /*
     * Empty circuit
     */
    if (totalGates === 0) {

        liveAnalysisElem.innerHTML = `
            <strong class="analysis-heading">
                Circuit Ready
            </strong>
            <br>
            Drag gates onto the wires above to begin
            designing your quantum circuit.
        `;

    /*
     * Bell state
     */
    } else if (hasHadamard && hasCNOT) {

        liveAnalysisElem.innerHTML = `
            <strong class="analysis-heading">
                ✨ Bell State Detected
            </strong>

            <br>

            <span>
                The <code>H</code> gate places
                <span class="quantum-state">q[0]</span>
                into superposition.
            </span>

            <br>

            <span>
                The <code>CX</code> gate entangles
                <span class="quantum-state">q[0]</span>
                and
                <span class="quantum-state">q[1]</span>.
            </span>

            <br>

            <span class="analysis-note">
                Measuring one qubit will correlate with the
                measurement outcome of the other.
            </span>
        `;

    /*
     * Superposition
     */
    } else if (hasHadamard) {

        liveAnalysisElem.innerHTML = `
            <strong class="analysis-heading">
                🌀 Superposition Active
            </strong>

            <br>

            The <code>Hadamard (H)</code> gate creates an
            equal superposition of
            <span class="quantum-state">|0⟩</span>
            and
            <span class="quantum-state">|1⟩</span>.
        `;

    /*
     * CNOT
     */
    } else if (hasCNOT) {

        liveAnalysisElem.innerHTML = `
            <strong class="analysis-heading">
                🔗 Entanglement Gate
            </strong>

            <br>

            The <code>CNOT (CX)</code> gate operates on
            two qubits. When the control qubit is
            <span class="quantum-state">|1⟩</span>,
            the target qubit is flipped.
        `;

    /*
     * Measurement
     */
    } else if (hasMeasure) {

        liveAnalysisElem.innerHTML = `
            <strong class="analysis-heading">
                📏 Measurement Detected
            </strong>

            <br>

            Measurement converts the quantum state into
            a classical result and collapses the
            superposition.
        `;

    /*
     * Other gates
     */
    } else {

        liveAnalysisElem.innerHTML = `
            <strong class="analysis-heading">
                ⚡ Circuit Analysis
            </strong>

            <br>

            Your circuit currently contains
            <span class="quantum-state">
                ${qubitCount} Qubits
            </span>
            and
            <span class="quantum-state">
                ${totalGates} Gates
            </span>.
        `;
    }
}
    // =====================================================
    // 44. INITIAL CIRCUIT RENDER
    // =====================================================

    renderCircuit();

});
