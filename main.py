from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from qiskit import QuantumCircuit
from qiskit_aer import AerSimulator

app = FastAPI(title="Neural Nomads Quantum Backend")

# Enable CORS so your frontend can communicate with the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows requests from your frontend URL / localhost
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------------------
# 1. Real Qiskit Circuit Simulation Endpoint
# -------------------------------------------------------------
class CircuitRequest(BaseModel):
    qubitCount: int
    circuitData: List[List[str]]  # e.g., [["H", "CX"], ["CX", "M"]]

@app.post("/api/simulate")
def simulate_circuit(req: CircuitRequest):
    try:
        num_qubits = req.qubitCount
        qc = QuantumCircuit(num_qubits)
        has_measurement = False

        # Build Qiskit Circuit dynamically from frontend canvas data
        for q_idx, gates in enumerate(req.circuitData):
            for gate in gates:
                g = gate.upper()
                if g == "H":
                    qc.h(q_idx)
                elif g == "X":
                    qc.x(q_idx)
                elif g == "Y":
                    qc.y(q_idx)
                elif g == "Z":
                    qc.z(q_idx)
                elif g == "CX":
                    target = (q_idx + 1) % num_qubits
                    qc.cx(q_idx, target)
                elif g == "M":
                    has_measurement = True

        if has_measurement:
            qc.measure_all()

        # Run circuit on Qiskit Aer Simulator
        simulator = AerSimulator()
        result = simulator.run(qc, shots=1024).result()
        counts = result.get_counts(qc)

        # Calculate measurement probabilities
        total_shots = sum(counts.values())
        probabilities = []
        for state, count in counts.items():
            prob = round((count / total_shots) * 100, 1)
            probabilities.append({"state": f"|{state}⟩", "percentage": prob})

        return {
            "status": "success",
            "shots": total_shots,
            "probabilities": probabilities
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# -------------------------------------------------------------
# 2. AI Tutor Chat Endpoint
# -------------------------------------------------------------
class ChatRequest(BaseModel):
    message: str

@app.post("/api/tutor/chat")
def tutor_chat(req: ChatRequest):
    prompt = req.message.strip()
    
    # You can connect your Gemini/OpenAI API or RAG vector pipeline here
    # Example response:
    reply = f"Analyzed query: '{prompt}'. In quantum computing, state transitions follow unitary transformations."
    return {"reply": reply}

# -------------------------------------------------------------
# 3. User Authentication Endpoint
# -------------------------------------------------------------
class LoginRequest(BaseModel):
    username: str
    password: str

@app.post("/api/auth/login")
def login(req: LoginRequest):
    if req.username and req.password:
        return {
            "status": "success",
            "token": "sample_jwt_token_12345",
            "user": {"username": req.username}
        }
    raise HTTPException(status_code=401, detail="Invalid username or password")

# Run using: uvicorn main:app --reload