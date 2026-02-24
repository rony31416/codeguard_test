# CodeGuard — LLM Bug Taxonomy Classifier & Analyzer

> **Version:** 0.0.7 &nbsp;|&nbsp; **Backend:** FastAPI on Render &nbsp;|&nbsp; **Extension:** VS Code Marketplace &nbsp;|&nbsp; **Date:** February 2026

---

## 📄 Abstract

Large Language Models (LLMs) such as GitHub Copilot and ChatGPT have become primary sources of code in modern software development. While these tools accelerate development, they introduce a class of bugs that existing static analysis tools are fundamentally unprepared to detect — bugs rooted not in syntax errors but in **semantic misalignment between the developer's intent (the prompt) and the generated code**. CodeGuard is a three-stage hybrid static-dynamic-linguistic bug detection system designed specifically to identify LLM-generated bug patterns. It defines a novel taxonomy of 10 LLM-specific bug patterns, runs a three-stage analysis pipeline (AST-based static analysis, Docker-sandboxed dynamic execution, and intent-aware linguistic analysis), and delivers results directly inside VS Code via a sidebar panel. Evaluated across 160 test cases, CodeGuard achieves **73.12% accuracy**, **87.50% recall**, and an **F1 score of 76.50%**, demonstrating that runtime + linguistic signals together capture bugs that static analysis alone misses.

---

## 📑 Table of Contents

1. [Introduction](#1-introduction)
2. [Literature Review](#2-literature-review)
3. [Bug Taxonomy](#3-bug-taxonomy)
4. [System Architecture](#4-system-architecture)
5. [Applied Methodology](#5-applied-methodology)
6. [Tool Demonstration](#6-tool-demonstration)
7. [Test Plan & Results](#7-test-plan--results)
8. [Limitations & Future Work](#8-limitations--future-work)
9. [Conclusion](#9-conclusion)
10. [References](#10-references)
11. [Appendix](#11-appendix)

---

## List of Abbreviations

| Abbreviation | Meaning |
|---|---|
| LLM | Large Language Model |
| NPC | Non-Prompted Consideration |
| AST | Abstract Syntax Tree |
| TP | True Positive |
| TN | True Negative |
| FP | False Positive |
| FN | False Negative |
| F1 | F1 Score (harmonic mean of Precision and Recall) |
| API | Application Programming Interface |
| IDE | Integrated Development Environment |
| TF-IDF | Term Frequency–Inverse Document Frequency |

---

## 1. Introduction

### 1.1 Background & Motivation

The adoption of LLM-based code generation tools has grown exponentially since the release of GitHub Copilot in 2021. Developers routinely accept AI-generated code with minimal review, trusting that tools such as ChatGPT, Copilot, and CodeLlama produce correct, production-ready implementations. Research consistently shows that LLM-generated code contains bugs in 25–40% of cases, yet developer review rates of AI suggestions remain low.

The problem is compounded by the nature of LLM bugs. Unlike traditional programming errors, LLM bugs frequently arise from:
- The model **hallucinating** class names, methods, or modules that do not exist
- The model generating code that is **correct for a related but different task** (prompt misinterpretation)
- The model **over-fitting to examples in the prompt** (prompt-biased code)
- The model correctly implementing the function body but **missing edge cases** the developer expected

These patterns are invisible to traditional linters (Pylint, Flake8) because such tools have no awareness of what the developer intended.

### 1.2 Problem Statement

> *"Existing static analysis tools such as Pylint and Flake8 are designed to detect general programming errors and style violations. They are not designed to detect LLM-specific bug patterns such as Hallucinated Objects, Prompt-Biased Code, or Misinterpretation of developer intent. No systematic taxonomy or detection tool exists for these failure modes."*

### 1.3 Objectives

1. Define a **taxonomy of 10 LLM-generated bug patterns** covering static, dynamic, and linguistic failure modes
2. Build a **three-stage hybrid detection pipeline**: static (AST), dynamic (Docker sandbox), and linguistic (intent analysis)
3. Integrate detection into the **developer workflow** as a VS Code extension with a real-time sidebar panel
4. Evaluate with **Precision, Recall, F1 Score, and Accuracy** across 160 labeled test cases

### 1.4 Scope

- Supports **Python only** (current version)
- Detects **10 specific bug patterns** mapped to a validated taxonomy
- Runs as a **VS Code extension** communicating with a cloud backend (Render.com)
- Linguistic stage uses an external **LLM API** (Ollama / OpenRouter) for semantic verdict

### 1.5 Report Structure

Chapter 2 reviews existing tools and the research gap. Chapter 3 defines the 10-pattern taxonomy. Chapter 4 presents the full system architecture. Chapter 5 details the methodology of each analysis stage. Chapter 6 demonstrates the tool. Chapter 7 presents test results. Chapter 8 discusses limitations. Chapter 9 concludes.

---

## 2. Literature Review

### 2.1 LLM Code Generation — Current State

GPT-4, GitHub Copilot, and CodeLlama represent the state of the art in neural code synthesis. Studies indicate that:
- Copilot suggestions are accepted 26–35% of the time (GitHub, 2023)
- 40% of Copilot-generated security-sensitive code contains vulnerabilities (Pearce et al., 2022)
- LLMs produce syntactically correct but semantically wrong code in approximately 30% of non-trivial tasks (Liu et al., 2023)

The core issue is **intent gap**: the model generates code that satisfies the surface form of the prompt without capturing deep semantic intent.

### 2.2 Existing Bug Detection Tools

| Tool | Type | Primary Use | Key Limitation |
|:--|:--|:--|:--|
| Pylint | Static | General Python linting | No semantic / intent analysis |
| Flake8 | Static | Style and PEP 8 | Style only; no logic errors |
| Bandit | Static | Security scanning | No LLM-specific patterns |
| SonarQube | Static/Dynamic | Enterprise code quality | Not LLM-aware |
| mypy | Static | Type checking | Requires type annotations |
| Semgrep | Static | Pattern matching | Manual rule authoring |

### 2.3 Research Gap

None of the above tools can:
- Detect a **prompt-code semantic mismatch** (the code works but solves the wrong problem)
- Identify **hallucinated references** at the semantic level (not just undefined names)
- Flag **non-prompted considerations** (features the LLM added that the developer did not request)

CodeGuard is the first tool to define and operationalize a taxonomy specifically targeting these LLM-generated failure modes.

---

## 3. Bug Taxonomy

### 3.1 Taxonomy Design Philosophy

The ten patterns were identified through a combination of:
1. Empirical analysis of >500 LLM-generated code samples from ChatGPT and Copilot
2. Classification of runtime error types produced during dynamic execution
3. Semantic gap analysis between prompt text and generated code structure

Each pattern is assigned a detection stage (static / dynamic / linguistic) reflecting the earliest and most reliable detection mechanism.

### 3.2 The 10 Bug Patterns

#### Pattern 1 — Syntax Error
- **Definition:** The generated code cannot be parsed by the Python interpreter.
- **Example:** `if not names` (missing colon) — observed in production Render logs.
- **Why LLMs generate this:** Token-level generation can produce incomplete control flow structures, especially near token limits.
- **Detection Stage:** Static (AST parse)
- **Severity Range:** 8–10

#### Pattern 2 — Hallucinated Object
- **Definition:** The code references a class, module, or function that does not exist in any imported namespace.
- **Example:** `result = calculator.compute(5)` where `calculator` was never defined or imported.
- **Why LLMs generate this:** The model has seen similar APIs in training data and generates plausible-but-fictional API calls.
- **Detection Stage:** Static + Dynamic (NameError confirmation)
- **Severity Range:** 7–9

#### Pattern 3 — Incomplete Generation
- **Definition:** The code contains `TODO`, `pass`, `...`, or truncated assignments indicating the LLM stopped mid-generation.
- **Example:** `def process(data): pass  # TODO: implement`
- **Why LLMs generate this:** Token limits or uncertainty causes the model to emit placeholders instead of implementations.
- **Detection Stage:** Static (pattern matching on AST + text)
- **Severity Range:** 6–8

#### Pattern 4 — Silly Mistake
- **Definition:** Logically incorrect but syntactically valid code — identical if/else branches, reversed operands, off-by-one errors.
- **Example:** `if discount > 0: price = price - discount` vs `else: price = price - discount` (identical branches).
- **Why LLMs generate this:** Copy-paste style generation at the token level does not enforce logical consistency between branches.
- **Detection Stage:** Static (AST branch comparison)
- **Severity Range:** 5–7

#### Pattern 5 — Wrong Attribute
- **Definition:** Accessing an attribute using incorrect syntax for the data type (e.g., dot-access on a dictionary).
- **Example:** `user = {"name": "Alice"}; print(user.name)` — should be `user["name"]`.
- **Why LLMs generate this:** Conflation of object-style and dict-style access, common across languages.
- **Detection Stage:** Dynamic (AttributeError at runtime)
- **Severity Range:** 6–8

#### Pattern 6 — Wrong Input Type
- **Definition:** Passing an argument of the wrong type to a function or operator.
- **Example:** `result = "hello" + 5` — TypeError at runtime.
- **Why LLMs generate this:** Type information is often absent from prompts; the model infers types incorrectly from context.
- **Detection Stage:** Dynamic (TypeError at runtime)
- **Severity Range:** 5–7

#### Pattern 7 — Non-Prompted Consideration (NPC)
- **Definition:** The code implements features, safeguards, or patterns the developer never requested (e.g., `admin` checks, logging, caching).
- **Example:** Prompt asks for a simple sort function; the LLM generates a full CRUD API with authentication.
- **Why LLMs generate this:** Training data associates certain prompts with richer implementations; the model over-generates.
- **Detection Stage:** Linguistic (pattern matching + AST decorator analysis)
- **Severity Range:** 4–6

#### Pattern 8 — Prompt-Biased Code
- **Definition:** The code hardcodes example values from the prompt rather than implementing the general algorithm.
- **Example:** Prompt says "e.g., sort `[3, 1, 2]`"; the LLM hardcodes `return [1, 2, 3]`.
- **Why LLMs generate this:** In-context learning over-fits to prompt examples; the model returns the expected output for the given example instead of implementing the logic.
- **Detection Stage:** Linguistic (regex extraction of quoted values from prompt, cross-checked in code)
- **Severity Range:** 5–7

#### Pattern 9 — Missing Corner Case
- **Definition:** The code handles the happy path but omits critical edge cases (division by zero, empty input, None checks).
- **Example:** `def divide(a, b): return a / b` — no guard for `b == 0`.
- **Why LLMs generate this:** Single-path reasoning; the model generates the primary logic without reasoning about boundary conditions.
- **Detection Stage:** Static (pattern matching) + Dynamic (ZeroDivisionError at runtime)
- **Severity Range:** 4–6

#### Pattern 10 — Misinterpretation
- **Definition:** The code is technically correct but solves a different problem than what the developer intended (semantic mismatch).
- **Example:** Prompt requests a function that "filters and sorts"; the LLM generates a function that only sorts.
- **Why LLMs generate this:** Ambiguous prompts lead to partial implementations; the model anchors to the most prominent keyword.
- **Detection Stage:** Linguistic (TF-IDF cosine similarity between prompt keywords and code features)
- **Severity Range:** 6–9

### Pattern Summary Table

| # | Pattern | Detection Stage | Severity |
|:--|:--|:--|:--|
| 1 | Syntax Error | Static | 8–10 |
| 2 | Hallucinated Object | Static + Dynamic | 7–9 |
| 3 | Incomplete Generation | Static | 6–8 |
| 4 | Silly Mistake | Static | 5–7 |
| 5 | Wrong Attribute | Dynamic | 6–8 |
| 6 | Wrong Input Type | Dynamic | 5–7 |
| 7 | Non-Prompted Consideration (NPC) | Linguistic | 4–6 |
| 8 | Prompt-Biased Code | Linguistic | 5–7 |
| 9 | Missing Corner Case | Static + Dynamic | 4–6 |
| 10 | Misinterpretation | Linguistic | 6–9 |

---

## 4. System Architecture

### 4.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────┐
│              VS Code Extension (TypeScript)          │
│   Sidebar Panel │ Prompt Input │ Bug Highlights      │
└────────────────────┬────────────────────────────────┘
                     │  POST /api/analyze  (axios, 60s timeout)
                     │  GET  /api/analysis/{id} (polling, 15s interval)
                     ▼
┌─────────────────────────────────────────────────────┐
│         FastAPI Backend (Python, Render.com)         │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │              3-Stage Pipeline                 │  │
│  │                                              │  │
│  │  Stage 1          Stage 2         Stage 3   │  │
│  │  StaticAnalyzer   DynamicAnalyzer  ─────────┐│  │
│  │  (AST/astroid)    (Docker /        Linguistic││  │
│  │                    subprocess)     Analyzer  ││  │
│  │                                   [BG Task] ││  │
│  └──────────────────────────────────────────────┘  │
│                     │                               │
│          TaxonomyClassifier + ExplainabilityLayer   │
│                     │                               │
│          BackgroundTasks (linguistic, ~100s)         │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│   PostgreSQL / Supabase Database                    │
│   analyses │ bug_patterns │ execution_logs          │
│   linguistic_analyses │ feedback                    │
└─────────────────────────────────────────────────────┘
```

**Key design decision — Background Task pattern:** The linguistic stage calls an external LLM API (Ollama/OpenRouter) and takes ~100 seconds. To avoid hitting Render's 60-second proxy timeout, the backend returns a preliminary response (`status: "processing"`) within ~2 seconds after completing stages 1 and 2. Stage 3 runs as a FastAPI `BackgroundTask`. The VS Code extension polls `GET /api/analysis/{id}` every 15 seconds until `status` changes to `"complete"`.

### 4.2 Technology Stack

| Layer | Technology | Version |
|:--|:--|:--|
| VS Code Extension | TypeScript, VS Code API, esbuild | 0.0.7 |
| HTTP Client (Extension) | axios (bundled via esbuild) | 1.13.4 |
| Backend Framework | FastAPI + uvicorn | 0.131.0 |
| Static Analysis | Python AST, pyflakes, astroid | astroid 4.0.4 |
| Dynamic Analysis | Docker SDK, `python:3.10-slim` image | docker 7.1.0 |
| Linguistic Analysis | spaCy, scikit-learn, TF-IDF | — |
| LLM API | Ollama Cloud (primary), OpenRouter (fallback) | ollama 0.6.1 |
| Database ORM | SQLAlchemy 2.0 | 2.0.46 |
| Database | PostgreSQL on Supabase | — |
| Rate Limiting | slowapi | 0.1.9 |
| Deployment | Render.com (free tier) | — |
| Python Version | 3.13.4 | — |

### 4.3 Database Schema

**`analyses`** — Primary record for each analysis request
| Column | Type | Description |
|---|---|---|
| `analysis_id` | Integer PK | Auto-increment identifier |
| `prompt` | Text | Developer's original prompt |
| `code` | Text | Code submitted for analysis |
| `language` | String(50) | Default: `'python'` |
| `overall_severity` | Integer | 0–10 composite severity |
| `has_bugs` | Boolean | True if any pattern detected |
| `summary` | Text | Human-readable summary |
| `confidence_score` | Float | 0.0–1.0 detection confidence |
| `created_at` | DateTime | UTC timestamp |

**`bug_patterns`** — One row per detected pattern per analysis
| Column | Type | Description |
|---|---|---|
| `bug_pattern_id` | Integer PK | — |
| `analysis_id` | FK → analyses | Parent analysis |
| `pattern_name` | String(100) | One of the 10 taxonomy patterns |
| `severity` | Integer | 0–10 |
| `confidence` | Float | Detection confidence |
| `description` | Text | Explanation of the bug |
| `location` | String(255) | Line number / code location |
| `fix_suggestion` | Text | Recommended fix |
| `detection_stage` | String(50) | `'static'` / `'dynamic'` / `'linguistic'` |

**`execution_logs`** — Per-stage timing and error logs
| Column | Type | Description |
|---|---|---|
| `log_id` | Integer PK | — |
| `analysis_id` | FK → analyses | — |
| `stage` | String(50) | `'static'` / `'dynamic'` / `'linguistic'` / `'classification'` |
| `success` | Boolean | — |
| `error_message` | Text | If failure |
| `execution_time` | Float | Seconds |

**`linguistic_analyses`** — Stage 3 results
| Column | Type | Description |
|---|---|---|
| `linguistic_id` | Integer PK | — |
| `analysis_id` | FK → analyses | — |
| `intent_match_score` | Float | TF-IDF cosine similarity (0–1) |
| `unprompted_features` | Text | JSON list of NPC features |
| `missing_features` | Text | JSON list of missing keywords |
| `hardcoded_values` | Text | JSON list of prompt-biased values |

**`feedback`** — User ratings (one-to-many with analyses)
| Column | Type | Description |
|---|---|---|
| `id` | Integer PK | — |
| `analysis_id` | FK → analyses | — |
| `rating` | Integer | 1–5 stars |
| `comment` | Text | Optional text comment |
| `is_helpful` | Boolean | — |

---

## 5. Applied Methodology

### 5.1 Workflow Overview

```
Input: { prompt: str, code: str }
       │
       ▼
Stage 1 ─ StaticAnalyzer        (~10ms)
       │    AST parse → 10 checks
       ▼
Stage 2 ─ DynamicAnalyzer       (~200ms–5s)
       │    Docker sandbox / subprocess fallback
       ▼
Stage 3 ─ TaxonomyClassifier    (~5ms)
       │    Maps results to 10-pattern schema
       ▼
Stage 4 ─ ExplainabilityLayer   (~5ms)
       │    Severity label + fix suggestions
       ▼
Response: status="processing"   → DB save (stages 1+2+4)
       │
[BackgroundTask]
       ▼
Stage 3b ─ LinguisticAnalyzer   (~100s)
       │    4 detectors × LLM call
       ▼
DB update: full patterns + status="complete"
```

### 5.2 Stage 1 — Static Analysis

#### 5.2.1 Syntax Error Detection
Uses `ast.parse()` (stdlib) and `astroid.parse()` (migrated detectors). Catches `SyntaxError` and `AstroidSyntaxError`, reports line number and column offset. The partial-parse fallback strips the offending line and continues analysis so other bug patterns can still be detected.

#### 5.2.2 Hallucinated Object Detection
Traverses the AST for `nodes.Name` (reads, not assignments). Cross-references against:
- Python built-ins whitelist (60+ names: `len`, `range`, `print`, `dict`, etc.)
- All names that appear as `nodes.AssignName` in the same scope
- All imported names from `import` and `from ... import` statements

Names that appear in a read context without any corresponding definition or import are flagged. Dynamic execution provides confirmation via `NameError` at runtime.

#### 5.2.3 Incomplete Generation Detection
Checks for:
- `pass` statements in non-abstract function bodies
- `TODO` / `FIXME` / `...` as the sole statement in a function
- Truncated assignments (`x =` with no right-hand side)
- Functions with empty bodies other than a docstring

#### 5.2.4 Silly Mistake Detection
Uses AST comparison to detect:
- Identical `if` and `else` branch bodies (dead branch)
- Reversed operands in financial calculations (`discount - price` instead of `price - discount`)
- Duplicate condition checks (`if x > 0 and x > 0`)

**Confidence score formula:**

$$\text{Confidence} = \frac{\text{Patterns Matched}}{\text{Total Checks}} \times 100$$

### 5.3 Stage 2 — Dynamic Analysis

#### 5.3.1 Docker Sandbox Architecture
When Docker Desktop is available (local development), code is executed inside an isolated container:
- **Base image:** `python:3.10-slim`
- **Memory limit:** 128 MB
- **CPU quota:** 50% of one core
- **Network:** disabled
- **Timeout:** 10 seconds (configurable via `DOCKER_TIMEOUT` env var)
- **Namespace isolation:** user code executes in a `_cg_ns = {}` dictionary namespace via `exec()` to prevent variable collisions with the wrapper harness

#### 5.3.2 Runtime Error Classification

| Runtime Error | Classified As |
|:--|:--|
| `AttributeError` | Wrong Attribute |
| `TypeError` | Wrong Input Type |
| `NameError` | Hallucinated Object (confirmed) |
| `ZeroDivisionError` | Missing Corner Case |
| `IndexError` / `KeyError` / `ValueError` | Other Error |
| Timeout | Execution timeout |

#### 5.3.3 Fallback Mechanism
On Render (no Docker daemon), the analyzer falls back to a subprocess execution with a safety check:
- Scans for dangerous imports (`os`, `subprocess`, `socket`, `threading`, etc.)
- Code containing these imports is skipped entirely
- All other code runs via `subprocess.run()` with a 5-second timeout
- This fallback is logged as a warning in Render logs

### 5.4 Stage 3 — Linguistic Analysis

#### 5.4.0 Overview — How It Works

The linguistic stage answers a question that neither AST parsing nor runtime execution can answer: **does the code actually do what the developer asked for?** It compares the *intent* expressed in the developer's natural-language prompt against the *behaviour* encoded in the generated code.

The stage is organized as four specialized detectors, each covering one semantic failure mode (NPC, Prompt Bias, Missing Features, Misinterpretation). Every detector applies the same **three-layer cascade** internally before producing its verdict:

```
  Input: { prompt, code }
          │
          ▼
  ┌──────────────────────────────────────────────────────────┐
  │  Each Detector (×4)                                      │
  │                                                          │
  │  Layer 1 — Rule Engine         (~10ms)                   │
  │    Fast regex pattern matching                           │
  │    Returns: candidate evidence list                      │
  │          │                                               │
  │          ▼                                               │
  │  Layer 2 — AST Analyzer        (~50ms)                   │
  │    Structural verification using astroid                 │
  │    Returns: confirmed structural findings                │
  │          │                                               │
  │          ▼                                               │
  │  Layer 3 — LLM Reasoner        (~300ms per detector)     │
  │    Receives Layer 1 + Layer 2 evidence as context        │
  │    Makes final semantic verdict + severity score         │
  └──────────────────────────────────────────────────────────┘
          │
          ▼
  Final result per detector: { found, issues, severity, explanation }
```

**Layer 1 — Rule Engine** is pure regex matching, completing in under 10 ms. It scans for catalogued patterns (NPC indicators, hardcoded literals, missing keywords, return-type markers) and assembles a preliminary evidence list. This layer has high recall but low precision — it flags many candidates that are not actual bugs.

**Layer 2 — AST Analyzer** uses astroid to perform structural verification. It confirms or discards the Layer 1 candidates by examining the actual parsed tree (`nodes.FunctionDef`, `nodes.Call`, `nodes.Const`, decorator lists, try-except blocks). astroid's `node.expr.infer()` provides semantic type inference which allows, for example, distinguishing a `dict` attribute access (`user["name"]`) from an object attribute access (`user.name`). Layer 2 provides near-100% structural accuracy at ~50 ms.

**Layer 3 — LLM Reasoner** receives the evidence collected by the first two layers as structured context, then makes the final semantic verdict. The LLM prompt includes the developer's original prompt, the generated code, and the bullet-point findings from Layers 1 and 2. The LLM evaluates whether the evidence constitutes a real intent mismatch and returns a natural-language explanation plus a severity score (0–10). This is the only layer capable of reasoning about *meaning*, not just structure.

---

#### 5.4.0.1 Why an LLM Instead of PyTorch / Transformer Libraries?

A natural question is: "why call an external LLM API instead of running a local model with PyTorch or HuggingFace Transformers?" Several factors make the external-API approach correct for this project:

| Criterion | PyTorch / transformers | External LLM API (Ollama / OpenRouter) |
|:--|:--|:--|
| **Deployment weight** | 500 MB–2 GB model file | Zero local weight; zero RAM |
| **Render free tier RAM** | 512 MB total — model doesn't fit | No RAM consumed |
| **Cold-start time** | 20–60 s to load model into VRAM | <1 s API request |
| **GPU requirement** | NVIDIA GPU for inference speed | Inference runs on provider side |
| **Maintenance** | Re-train / fine-tune for each new pattern | Prompt-engineered; update a string |
| **Code complexity** | 200+ lines of tokenizer + inference pipeline | 10 lines HTTP request |
| **Reasoning quality on novel inputs** | Degrades without fine-tuning | GPT-scale models generalize well |

The semantic questions posed in Stage 3 ("does this code solve the problem described in the prompt?") require **general language understanding**, not domain-specific classification. This task type is exactly what instruction-tuned large models (GPT-class, Gemma 12B) excel at without fine-tuning — making them far more practical than training a 768-dimensional BERT model on a small labeled dataset (which would require thousands of labeled {prompt, code, verdict} examples that do not yet exist).

Additionally, the three-layer architecture deliberately minimizes LLM calls: Layers 1 and 2 filter out obvious non-bugs before the LLM ever sees them. The LLM only verdicts on cases where structural evidence is genuinely ambiguous — exactly the nuanced judgment task LLMs are built for. Rule-based layers handle the easy 80%; the LLM resolves the hard 20%.

**LLM API fallback chain:**
1. **Primary** — Ollama Cloud (`gpt-oss:20b-cloud`), authenticated via `OLLAMA_API_KEY`
2. **Fallback** — OpenRouter (`google/gemma-3-12b-it:free`), authenticated via `OPENROUTER_API_KEY`
3. **Disabled** — If both keys are absent, Layer 3 is skipped; Layers 1 and 2 results are returned directly

---

#### 5.4.1 NPC Detector

Each of the three layers targets NPC evidence specifically:

- **Layer 1 (Rule Engine):** Regex scan for a catalogue of NPC pattern groups — `debug_prints` (`print(`, `breakpoint()`), `logging` (`logger.`, `.debug(`, `.info(`), `validation` (`assert`, `raise`, `if not`), `error_handling` (`try:`, `except`), `auth` (`admin`, `permission`, `role`), `caching` (`@lru_cache`, `cache`, `lock`)
- **Layer 2 (AST Analyzer):** Confirms findings by checking whether matched patterns correspond to AST nodes actually present in the code; extracts decorator lists, try-except node presence, and function call names to eliminate false positives from string matches inside comments or docstrings
- **Layer 3 (LLM Reasoner):** Given the full prompt text, the code, and the Layer 1 + Layer 2 evidence, the LLM judges whether the flagged additions were truly unrequested — or whether they are implied by the prompt's domain context (e.g., a prompt about "production API" reasonably implies logging)

The Layer 3 verdict is what separates NPC detection from a naive keyword search.

#### 5.4.2 Prompt Bias Detector

- **Layer 1 (Rule Engine):** Regex extraction of quoted string literals and numeric constants from the prompt text; also scans for commonly hardcoded example names (`alice`, `bob`, `test@`, `user123`, `[3,1,2]`)
- **Layer 2 (AST Analyzer):** Walks `nodes.Const` nodes in the code and compares their values against the Layer 1 extracted literals; ignores constants inside `if __name__ == "__main__":` blocks (test harness exclusion) by checking the parent node's test condition
- **Layer 3 (LLM Reasoner):** Determines whether the literal matches represent true over-fitting (the code only works for the example values) or merely incidental appearance (a test, a docstring example, or a coincidence)

1. Extracts quoted string literals from the prompt using regex (`r'"([^"]+)"'` and single-quote variant)
2. Parses all `ast.Constant` nodes in the code
3. Flags code where prompt example values appear as hardcoded comparisons or return values
4. Ignores values inside `if __name__ == "__main__":` blocks (test harness exclusion)

#### 5.4.3 Missing Feature Detector

- **Layer 1 (Rule Engine):** Tokenizes the prompt using TF-IDF and builds a keyword set; tokenizes imported module names, function names, and variable identifiers from the code; computes the set difference (prompt keywords absent from code features)
- **Layer 2 (AST Analyzer):** Traverses `nodes.FunctionDef`, `nodes.Import`, `nodes.ImportFrom`, `nodes.Assign` to extract the structural vocabulary of the code; refines the Layer 1 keyword gap by eliminating synonyms and stop-words
- **Layer 3 (LLM Reasoner):** Evaluates whether the gap keywords represent features that *should* have been implemented (missing functionality) or are simply prompt phrasing not reflected in code identifiers (acceptable)

**Intent Match Score (TF-IDF Cosine Similarity):**

$$\text{similarity}(P, C) = \frac{\vec{P} \cdot \vec{C}}{\|\vec{P}\| \|\vec{C}\|}$$

where $\vec{P}$ is the TF-IDF vector of the prompt and $\vec{C}$ is the TF-IDF vector of the code identifiers. A score below ~0.40 indicates a significant semantic gap.

#### 5.4.4 Misinterpretation Detector

- **Layer 1 (Rule Engine):** Regex heuristics for structural mismatch signals — return type keywords in prompt ("list", "all", "every") vs. scalar return statements; intent verbs ("filter", "remove", "exclude") vs. iteration-only code; output intent ("display", "show", "print") vs. `return` statements
- **Layer 2 (AST Analyzer):** Confirms the structural hypothesis — checks `nodes.Return` value types, number of conditional branches, presence or absence of list comprehensions or filter expressions
- **Layer 3 (LLM Reasoner):** Performs the semantic judgment: given what the prompt asked for and what the code structure delivers, does the code solve a fundamentally different problem? The LLM rates the severity of the semantic mismatch.

The three checks below are the Layer 1 signals before LLM confirmation:
- Return type mismatch: prompt uses words like "list", "all", "every" but code returns a scalar
- Print vs return intent: prompt says "display" or "show" but code uses `return` (or vice versa)
- Filtering intent: prompt says "filter" but code only iterates without conditional exclusion

#### 5.4.5 LLM Verdict (Layer 3) — Summary

For each of the four detectors, the LLM Reasoner (`LLMReasoner.final_verdict()`) constructs a structured prompt containing:
1. The developer's original natural-language prompt
2. The generated code
3. Bullet-point evidence from Layer 1 (regex findings)
4. Bullet-point evidence from Layer 2 (AST findings)

The LLM (Ollama `gpt-oss:20b-cloud` or OpenRouter `gemma-3-12b-it:free`) returns a JSON verdict with `found` (boolean), `issues` (list), `severity` (0–10), and a natural-language explanation. This verdict is the final classification output for that detector.

Because the four LLM calls run sequentially (one per detector), and each call takes ~25 seconds at Ollama Cloud latency, the total Stage 3 duration is approximately **98–105 seconds**. This is why Stage 3 runs as a FastAPI `BackgroundTask` and the extension polls for completion.

### 5.5 Stage 4 — Taxonomy Classification

`TaxonomyClassifier` aggregates results from all three stages with the following priority:
1. **Static patterns** are always reported (syntax errors block dynamic/linguistic)
2. **Dynamic patterns** confirm or override static hypotheses (NameError confirms Hallucinated Object)
3. **Linguistic patterns** fill the semantic gap
4. If `len(bug_patterns) > 3`, a composite **Misinterpretation** pattern is added

### 5.6 Stage 5 — Explainability Layer

`ExplainabilityLayer` generates:
- **Severity label:** Critical (8–10) / High (6–7) / Medium (4–5) / Low (1–3)
- **Per-pattern description:** Human-readable explanation of why each pattern was detected
- **Fix suggestions:** Concrete code-level recommendations
- **Overall summary:** Single paragraph summarizing all detected issues

---

## 6. Tool Demonstration

### 6.1 VS Code Extension Interface

The extension contributes a sidebar panel registered under the `codeguard-sidebar` activity bar container. The webview panel (`codeguard.sidePanel`) renders `webview.html` via the `CodeGuardPanel` class implementing `vscode.WebviewViewProvider`.

**Interface elements:**
- **Prompt input** — Textarea for entering the original LLM prompt
- **Analyze button** — Triggers `analyzeCode` API call
- **Loading indicator** — Shown during backend processing
- **Results panel** — Lists detected patterns with severity badges, descriptions, locations, and fix suggestions
- **Feedback panel** — Star rating (1–5) + optional comment
- **Code decorations** — Inline red highlights on bug lines via `vscode.TextEditorDecorationType`

### 6.2 Analysis Workflow

1. Open any Python file in VS Code
2. Click the **CodeGuard** icon in the Activity Bar (left sidebar)
3. In the sidebar, type the prompt that was used to generate the code
4. Click **"Analyze Entire File"**
5. The panel shows a loading spinner — the backend returns stages 1+2 in ~2 seconds
6. After ~100 seconds, the panel automatically updates with full linguistic analysis results
7. Bug lines are highlighted red in the code editor with hover tooltips

### 6.3 API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/` | GET | Health / welcome |
| `/health` | GET | Render health probe |
| `/api/analyze` | POST | Submit code for analysis |
| `/api/analysis/{id}` | GET | Poll for analysis status/result |
| `/api/history` | GET | List recent analyses |
| `/api/stats` | GET | Aggregate statistics |
| `/api/feedback` | POST | Submit user rating |
| `/api/patterns` | GET | List all 10 bug patterns |

### 6.4 End-to-End Code Flow

This section traces every function call from the moment the user clicks "Analyze" to the moment red highlights appear in the editor.

---

#### 6.4.1 Full Flow Diagram

```
USER ACTION
  │  Opens a Python file, clicks CodeGuard icon in Activity Bar,
  │  types prompt in sidebar, clicks "Analyze Entire File"
  │
  ▼
╔══════════════════════════════════════════════════════════════════╗
║  VS Code Extension  (out/extension.js — esbuild bundle)         ║
║                                                                  ║
║  1. webview.html                                                 ║
║     └─ postMessage({ command: "analyzeCode", data: {prompt} })  ║
║          │                                                       ║
║  2. SidePanel.ts  →  handleAnalyzeRequest()                     ║
║     ├─ editor.document.getText()  ← full file content           ║
║     ├─ this.showLoading()  ← spinner to webview                 ║
║     └─ analyzeCode({ prompt, code })  ──────────────────────┐   ║
║                                                             │   ║
║  3. apiService.ts  →  analyzeCode()                         │   ║
║     ├─ reads vscode.workspace.getConfiguration('codeguard') │   ║
║     │    → apiUrl (Render) or localhost:8000                │   ║
║     └─ axios.POST  /api/analyze  { prompt, code }  ─────────┘   ║
║          timeout: 60 000 ms                                      ║
╚══════════════════════════════════════════════════════════════════╝
                    │  HTTP POST  (JSON body)
                    ▼
╔══════════════════════════════════════════════════════════════════╗
║  FastAPI Backend  (Render.com — uvicorn, 1 worker)              ║
║                                                                  ║
║  4. Rate Limiter  (slowapi)                                      ║
║     └─ 30 requests / minute / IP  →  429 if exceeded            ║
║                                                                  ║
║  5. analyze_code()  [main.py:193]                               ║
║     │                                                            ║
║     ├─ STAGE 1  StaticAnalyzer(code).analyze()      ~4–10 ms   ║
║     │   ├─ ast.parse() + astroid.parse()                        ║
║     │   ├─ 10 checks: Syntax, Hallucinated, Incomplete,         ║
║     │   │             Silly Mistake, Missing Corner Case, …     ║
║     │   └─ returns  static_results: Dict                        ║
║     │                                                            ║
║     ├─ STAGE 2  DynamicAnalyzer(code).analyze()    ~200–500 ms  ║
║     │   ├─ Docker available? → run in container                  ║
║     │   │   (python:3.10-slim, 128MB, no network, 10s timeout)  ║
║     │   ├─ Docker absent (Render)? → subprocess fallback        ║
║     │   │   (dangerous-import check first, then subprocess.run) ║
║     │   └─ classifies runtime errors → dynamic_results: Dict    ║
║     │                                                            ║
║     ├─ STAGE 3  linguistic_results = STUB (empty zeros)         ║
║     │   └─ real linguistic analysis deferred to background task ║
║     │                                                            ║
║     ├─ STAGE 4  TaxonomyClassifier(static, dynamic, stub)       ║
║     │   └─ .classify() → preliminary bug_patterns_list          ║
║     │                                                            ║
║     ├─ STAGE 5  ExplainabilityLayer.generate_summary()          ║
║     │   └─ severity label + fix suggestions per pattern         ║
║     │                                                            ║
║     ├─ DB SAVE  (SQLAlchemy → PostgreSQL / Supabase)            ║
║     │   ├─ INSERT analyses           → analysis_id = 523        ║
║     │   ├─ INSERT bug_patterns       (preliminary)              ║
║     │   └─ INSERT execution_logs     (stages 1, 2, 4)           ║
║     │                                                            ║
║     ├─ _processing.add(523)                                      ║
║     ├─ background_tasks.add_task(_run_linguistic_background, …) ║
║     │                                                            ║
║     └─ RETURN  AnalysisResponse(status="processing", id=523)   ║
║          < 2 seconds total >                                     ║
╚══════════════════════════════════════════════════════════════════╝
                    │  HTTP 200  { status: "processing", analysis_id: 523, … }
                    ▼
╔══════════════════════════════════════════════════════════════════╗
║  apiService.ts  (back in extension)                             ║
║                                                                  ║
║  6. response.data.status === "processing"                       ║
║     └─ pollForCompletion(523, apiUrl)                            ║
║          loop: MAX 20 attempts × 15 s = 5 min                   ║
║          each attempt: GET /api/analysis/523                     ║
╚══════════════════════════════════════════════════════════════════╝
        │  (concurrent, after HTTP response sent)
        ▼
╔══════════════════════════════════════════════════════════════════╗
║  _run_linguistic_background()  [main.py:82]  BACKGROUND TASK    ║
║                                                                  ║
║  7. LinguisticAnalyzer(prompt, code).analyze()                  ║
║     │                                                            ║
║     ├─ NPCDetector.detect()                                      ║
║     │   ├─ Layer 1  RuleEngine.detect_npc()          ~10 ms     ║
║     │   ├─ Layer 2  ASTAnalyzer.verify_npc()         ~50 ms     ║
║     │   └─ Layer 3  LLMReasoner.final_verdict()     ~300 ms     ║
║     │                └─ POST https://ollama.com/api/chat        ║
║     │                   (fallback: OpenRouter /completions)     ║
║     │                                                            ║
║     ├─ PromptBiasDetector.detect()    same 3 layers  ~300 ms   ║
║     ├─ MissingFeatureDetector.detect()               ~300 ms   ║
║     └─ MisinterpretationDetector.detect()            ~300 ms   ║
║                                                                  ║
║     ─────────────────────────────────────────────────────────   ║
║     Total: 4 LLM calls × ~25 s each = ~98–105 s                ║
║     ─────────────────────────────────────────────────────────   ║
║                                                                  ║
║  8. Re-classify with full results                                ║
║     └─ TaxonomyClassifier(static, dynamic, linguistic_results)  ║
║          .classify()  →  full bug_patterns_list                  ║
║                                                                  ║
║  9. DB UPDATE                                                    ║
║     ├─ UPDATE analyses SET severity, has_bugs, summary, …       ║
║     ├─ DELETE FROM bug_patterns WHERE analysis_id = 523         ║
║     ├─ INSERT bug_patterns  (full set includes linguistic)       ║
║     └─ INSERT linguistic_analyses  (intent_match_score, …)      ║
║                                                                  ║
║  10. _processing.discard(523)                                    ║
╚══════════════════════════════════════════════════════════════════╝
        │
        │  (poll hits endpoint after background task finishes)
        ▼
╔══════════════════════════════════════════════════════════════════╗
║  GET /api/analysis/523  [main.py:488]                           ║
║                                                                  ║
║  11. status = "processing" if 523 in _processing else "complete"║
║      523 NOT in _processing  →  status = "complete"             ║
║                                                                  ║
║  12. Query DB → full Analysis + BugPattern + LinguisticAnalysis ║
║      Return JSON  { status: "complete", bug_patterns: [...], …} ║
╚══════════════════════════════════════════════════════════════════╝
                    │  HTTP 200  { status: "complete", … }
                    ▼
╔══════════════════════════════════════════════════════════════════╗
║  pollForCompletion()  →  returns final result                   ║
║                                                                  ║
║  13. SidePanel.ts  →  handleAnalyzeRequest() resumes            ║
║     ├─ this.showAnalysis(result)                                 ║
║     │   └─ webview.postMessage({ command: "showAnalysis",       ║
║     │                            data: result })                ║
║     │       → webview.html renders bug cards in sidebar         ║
║     │                                                            ║
║     ├─ this.addBugDecorations(editor, result.bug_patterns)      ║
║     │   ├─ parse location: "Line 2" → lineNumber = 1 (0-index) ║
║     │   ├─ vscode.TextEditorDecorationType                      ║
║     │   │   (red background + red border on bug lines)          ║
║     │   └─ editor.setDecorations(decorationType, ranges)        ║
║     │                                                            ║
║     └─ vscode.window.showWarningMessage(                        ║
║            "Found N bug pattern(s) in filename.py")             ║
╚══════════════════════════════════════════════════════════════════╝
        │  (optional)
        ▼
╔══════════════════════════════════════════════════════════════════╗
║  User submits feedback (star rating + comment)                  ║
║                                                                  ║
║  14. webview.html postMessage({ command: "submitFeedback", … }) ║
║      SidePanel.handleFeedbackSubmission()                        ║
║      └─ apiService.submitFeedback()                             ║
║           └─ axios.POST  /api/feedback                          ║
║                { analysis_id, rating, comment, is_helpful }     ║
║                │                                                 ║
║                ▼ Backend                                        ║
║           INSERT feedback  (analysis_id FK, rating, comment)    ║
╚══════════════════════════════════════════════════════════════════╝
```

---

#### 6.4.2 Step-by-Step Description

| Step | Where | What Happens |
|:--|:--|:--|
| 1 | `webview.html` | User clicks "Analyze" — JS calls `vscode.postMessage({ command: 'analyzeCode', data: { prompt } })` |
| 2 | `SidePanel.ts:handleAnalyzeRequest()` | Reads full file via `editor.document.getText()`, calls `this.showLoading()` to start spinner in webview |
| 3 | `apiService.ts:analyzeCode()` | Reads `codeguard.apiUrl` from VS Code settings; sends `axios.POST /api/analyze` with `{ prompt, code }` and 60 s timeout |
| 4 | `main.py` rate limiter | `slowapi` checks request count ≤ 30/min/IP |
| 5 | `StaticAnalyzer.analyze()` | Parses code with `ast` + `astroid`; runs 10 structural checks; returns `static_results` dict in ~4–10 ms |
| 6 | `DynamicAnalyzer.analyze()` | Executes code in Docker container (or `subprocess` on Render); classifies `AttributeError`, `TypeError`, `NameError`, `ZeroDivisionError`; returns `dynamic_results` in ~200–500 ms |
| 7 | `TaxonomyClassifier.classify()` | Maps static + dynamic results to the 10-pattern taxonomy; `linguistic_results` is a zero-filled stub at this point |
| 8 | `ExplainabilityLayer.generate_summary()` | Produces human-readable description + fix suggestions for each detected pattern |
| 9 | DB save | `INSERT` into `analyses`, `bug_patterns`, `execution_logs` via SQLAlchemy; `db.flush()` to get `analysis_id` before `commit` |
| 10 | Background task scheduled | `_processing.add(analysis_id)`; `background_tasks.add_task(_run_linguistic_background, …)` — fires after HTTP response is sent |
| 11 | HTTP response sent | `AnalysisResponse(status="processing", analysis_id=523, …)` returned in **< 2 seconds** |
| 12 | `apiService.ts:pollForCompletion()` | Detects `status === "processing"`; enters poll loop — `GET /api/analysis/523` every 15 s, up to 20 attempts (5 min) |
| 13 | `_run_linguistic_background()` | Runs in Starlette background thread: `LinguisticAnalyzer(prompt, code).analyze()` — 4 detectors × 3 layers each |
| 14 | Each detector Layer 3 | `LLMReasoner.final_verdict()` constructs a structured prompt from Layer 1 + Layer 2 evidence and sends it to `POST https://ollama.com/api/chat` (primary) or OpenRouter `/completions` (fallback); LLM returns JSON verdict + severity |
| 15 | DB update | Full `bug_patterns` set replaces preliminary rows; `linguistic_analyses` record inserted; `_processing.discard(analysis_id)` called |
| 16 | Poll returns `"complete"` | `GET /api/analysis/523` checks `523 not in _processing` → `status = "complete"`; full result including `linguistic_analysis` field returned |
| 17 | `SidePanel.showAnalysis(result)` | `webview.postMessage({ command: "showAnalysis", data: result })` — sidebar renders bug cards with pattern name, severity, description, and fix suggestions |
| 18 | `addBugDecorations()` | Parses `"Line N"` from each bug's `location` field; applies `vscode.TextEditorDecorationType` (red background + red border) to those lines in the active editor |
| 19 | Notification | `vscode.window.showWarningMessage("Found N bug pattern(s) in file.py")` appears in the bottom-right corner |
| 20 | Feedback (optional) | User submits star rating → `POST /api/feedback` → `INSERT feedback` row linked to `analysis_id` |

---

#### 6.4.3 Timing Summary

```
 0s ──► User clicks "Analyze"
 0–2s ─► Stages 1+2+4+5: Static, Dynamic, Preliminary Classification, DB save
 2s ──► Extension receives { status: "processing" }  ← sidebar shows spinner
 2s ──► Background task starts on server (linguisitc stage)
17s ──► First poll: GET /api/analysis/523  → still "processing"
32s ──► Second poll: still "processing"
...
~102s ► Background task finishes (_processing.discard)
~107s ► Next poll: GET returns { status: "complete", full results }
~107s ► Sidebar renders full bug cards, editor shows red highlights
```

---

## 7. Test Plan & Results

### 7.1 Testing Strategy

- **160 total test cases** across 10 test sets
- Each set: 8 buggy + 8 clean code samples (16 cases per set)
- Ground truth manually labeled
- Tests run as HTTP POST requests to Render production backend
- Binary classification: Bug (`has_bugs=True`) vs. Clean (`has_bugs=False`)

### 7.2 Evaluation Metrics

$$\text{Precision} = \frac{TP}{TP + FP}$$

$$\text{Recall} = \frac{TP}{TP + FN}$$

$$F_1 = 2 \times \frac{\text{Precision} \times \text{Recall}}{\text{Precision} + \text{Recall}}$$

$$\text{Accuracy} = \frac{TP + TN}{TP + TN + FP + FN}$$

### 7.3 Confusion Matrix

|  | Predicted Bug | Predicted Clean |
|:--|:--|:--|
| **Actual Bug** | TP = 70 | FN = 10 |
| **Actual Clean** | FP = 33 | TN = 47 |

### 7.4 Overall Metrics

| Metric | Baseline (stdlib ast) | Post-Fix (astroid + Docker) | Change |
|:--|:--|:--|:--|
| Accuracy | 71.88% | **73.12%** | +1.25% ↑ |
| Precision | 68.42% | 67.96% | -0.46% |
| Recall | 81.25% | **87.50%** | +6.25% ↑ |
| F1 Score | 74.29% | **76.50%** | +2.21% ↑ |
| Specificity | 62.50% | 58.75% | -3.75% |
| False Negative Rate | 18.75% | **12.50%** | -6.25% ↓ |

### 7.5 Per-Test-Set Results

| Test Set | Name | Cases | Correct | Accuracy | Δ vs Baseline |
|:--|:--|:--|:--|:--|:--|
| Set 1 | Basic Bug Patterns | 16 | 15 | 93.75% | +6.25% ↑ |
| Set 2 | Advanced Bug Patterns | 16 | 12 | 75.00% | +6.25% ↑ |
| Set 3 | Real-World Code Scenarios | 16 | 13 | 81.25% | = |
| Set 4 | Data Structures & API Usage | 16 | 12 | 75.00% | +6.25% ↑ |
| Set 5 | Complex & Real-World Scenarios | 16 | 12 | 75.00% | = |
| Set 6 | Mixed Bugs & Complex Logic | 16 | 11 | 68.75% | -6.25% ↓ |
| Set 7 | Security & Edge Cases | 16 | 11 | 68.75% | = |
| Set 8 | OOP & Structural Bugs | 16 | 11 | 68.75% | -6.25% ↓ |
| Set 9 | Regression & Stress Testing | 16 | 10 | 62.50% | = |
| Set 10 | Production-Ready Code Patterns | 16 | 10 | 62.50% | +6.25% ↑ |
| **Total** | — | **160** | **117** | **73.12%** | **+1.25%** |

### 7.6 Per-Test-Set Confusion Matrix

| Set | TP | TN | FP | FN |
|:--|:--|:--|:--|:--|
| Set 1 | 8 | 7 | 1 | 0 |
| Set 2 | 7 | 5 | 3 | 1 |
| Set 3 | 7 | 6 | 2 | 1 |
| Set 4 | 7 | 5 | 3 | 1 |
| Set 5 | 7 | 5 | 3 | 1 |
| Set 6 | 6 | 5 | 3 | 2 |
| Set 7 | 7 | 4 | 4 | 1 |
| Set 8 | 6 | 5 | 3 | 2 |
| Set 9 | 6 | 4 | 4 | 2 |
| Set 10 | 9 | 1 | 7 | 0 |
| **Total** | **70** | **47** | **33** | **10** |

### 7.7 False Positive Analysis

The main sources of false positives are:
1. **OOP patterns** (Sets 6, 8) — `super().__init__()`, property setters, and abstract methods trigger dynamic analysis signals despite being valid Python
2. **Async/await patterns** — The dynamic sandbox sometimes fails on `async def` without an event loop, producing an error signal on clean code
3. **`self.name` attribute access** — Occasionally flagged as Wrong Attribute when the static detector cannot infer the parent class type

**Mitigation applied:** The astroid migration introduced semantic type inference via `node.expr.infer()` which eliminated most dictionary false positives. A severity threshold of ≥4 is recommended to further reduce FPR.

### 7.8 Performance Benchmarks

| Stage | Location | Average Time |
|:--|:--|:--|
| Static Analysis | Render server | ~4–10 ms |
| Dynamic Analysis | Render subprocess | ~200–500 ms |
| Classification + Explainability | Render server | ~5 ms |
| Initial response (stages 1+2+4) | End-to-end | **< 2 seconds** |
| Linguistic Analysis (background) | Ollama API × 4 calls | **~98–105 seconds** |
| Total time to full result | End-to-end | **~100 seconds** |

---

## 8. Limitations & Future Work

### 8.1 Current Limitations

1. **Python Only** — The AST parser, dynamic executor, and pattern detectors are all Python-specific. JavaScript, Java, and TypeScript are not supported.
2. **Docker Unavailable on Render** — The Docker sandbox cannot run on Render's free tier. The subprocess fallback provides reduced isolation and refuses to execute code with system-level imports.
3. **No User Authentication** — The API is publicly accessible with rate limiting only (30 requests/minute/IP). No user accounts or session management.
4. **OOP False Positives** — Complex Python OOP patterns (multiple inheritance, property decorators, abstract base classes) are occasionally misclassified.
5. **Linguistic Analysis Latency** — Four sequential LLM API calls produce a ~100-second wait per analysis. The background task pattern makes this transparent to the user but the final result is still delayed.
6. **Single Render Instance** — Render free tier runs one worker with no persistent memory. The `_processing` set (tracking in-flight background tasks) is lost on restart, potentially causing stale `"processing"` status.

### 8.2 Future Improvements

1. **Parallel Linguistic Detectors** — Run the four linguistic detectors concurrently using `asyncio.gather()` to reduce Stage 3 from ~100s to ~25–30s (single LLM call latency)
2. **Multi-language Support** — Tree-sitter for JavaScript/TypeScript AST, enabling the same taxonomy on JS/TS codebases
3. **Feedback-Driven Learning** — Use the 1–5 star ratings stored in the `feedback` table to fine-tune pattern thresholds and reduce false positives
4. **Authentication** — JWT-based multi-user support with per-user analysis history
5. **IDE Integrations** — JetBrains plugin (IntelliJ IDEA, PyCharm) and Neovim LSP integration
6. **Persistent Background Task State** — Replace the in-memory `_processing` set with a Redis-backed queue to survive server restarts
7. **Severity Calibration** — Raise the bug/clean threshold from `severity > 0` to `severity >= 4` to reduce FPR at marginal recall cost

---

## 9. Conclusion

CodeGuard demonstrates that LLM-generated code requires a dedicated, multi-modal analysis approach. Traditional static linters detect syntax and style violations but are blind to the semantic gap between developer intent and model output. This project makes three concrete contributions:

1. **A 10-pattern taxonomy of LLM-generated bugs**, the first systematic classification of failure modes specific to AI code generation, covering static errors (Syntax, Hallucination, Incomplete, Silly Mistake), runtime errors (Wrong Attribute, Wrong Type, Missing Corner Case), and semantic misalignments (NPC, Prompt Bias, Misinterpretation)

2. **A three-stage hybrid detection pipeline** combining AST-based static analysis (migrated to astroid for semantic type inference), Docker-sandboxed dynamic execution (with subprocess fallback for cloud deployment), and intent-aware linguistic analysis backed by an LLM verdict layer

3. **A production VS Code extension** that integrates this pipeline into the developer workflow with real-time sidebar feedback, inline code highlights, and a background-task architecture that returns preliminary results in under 2 seconds

Evaluated across 160 labeled test cases, the system achieves 73.12% accuracy, 87.50% recall, and an F1 score of 76.50%. The recall improvement from 81.25% to 87.50% after enabling Docker dynamic execution validates the hypothesis that runtime signals are essential for catching LLM-specific bugs that no static analyzer can detect. CodeGuard is a working proof of concept that intent-aware, multi-stage analysis is the correct approach for the LLM code quality problem.

---

## 10. References

1. Pearce, H., Ahmad, B., Tan, B., Dolan-Gavitt, B., & Karri, R. (2022). *Asleep at the Keyboard? Assessing the Security of GitHub Copilot's Code Contributions.* IEEE S&P.
2. Liu, J., Xia, C. S., Wang, Y., & Zhang, L. (2023). *Is Your Code Generated by ChatGPT Really Correct?* arXiv:2305.01210.
3. GitHub. (2023). *GitHub Copilot: The AI pair programmer.* [Usage Statistics Report].
4. Chen, M., et al. (2021). *Evaluating Large Language Models Trained on Code (Codex).* arXiv:2107.03374.
5. Louridas, P. (2006). *Static code analysis.* IEEE Software, 23(4), 58–61.
6. Merkel, D. (2014). *Docker: lightweight Linux containers for consistent development and deployment.* Linux Journal, 239.
7. Salton, G., & Buckley, C. (1988). *Term-weighting approaches in automatic text retrieval.* Information Processing & Management, 24(5), 513–523.
8. Microsoft. (2023). *VS Code Extension API.* https://code.visualstudio.com/api
9. Tiobe Software. (2024). *TIOBE Index for Python.*
10. OpenAI. (2023). *GPT-4 Technical Report.* arXiv:2303.08774.

---

## 11. Appendix

### Appendix A — Installation & Setup Guide

**Prerequisites:** Node.js 18+, Python 3.10+, Docker Desktop (optional)

**1. Install the VS Code Extension**
```
Extensions → ⋯ → Install from VSIX
→ codeguard-llm-bugs-classifier-0.0.7.vsix
```

**2. Configure Backend URL** (VS Code Settings)
```json
"codeguard.apiUrl": "https://codeguard-backend-g7ka.onrender.com"
```

**3. Run the Backend Locally (optional)**
```bash
cd backend
pip install -r requirements-light.txt
uvicorn app.main:app --reload --port 8000
```
Then set `"codeguard.useLocalBackend": true` in VS Code settings.

---

### Appendix B — Sample API Request & Response

**Request:**
```http
POST /api/analyze
Content-Type: application/json

{
  "prompt": "Write a function that divides two numbers",
  "code": "def divide(a, b):\n    return a / b"
}
```

**Response (immediate, ~2s):**
```json
{
  "analysis_id": 523,
  "status": "processing",
  "has_bugs": true,
  "overall_severity": 9,
  "bug_patterns": [
    {
      "pattern_name": "Missing Corner Case",
      "severity": 6,
      "confidence": 0.85,
      "description": "Division without zero-check: b=0 raises ZeroDivisionError",
      "location": "Line 2",
      "fix_suggestion": "Add: if b == 0: raise ValueError('Division by zero')",
      "detection_stage": "static"
    }
  ],
  "summary": "1 bug pattern detected: Missing Corner Case (severity 6/10)"
}
```

**Poll Response (after ~100s):**
```json
{
  "analysis_id": 523,
  "status": "complete",
  "has_bugs": true,
  "overall_severity": 9,
  "bug_patterns": [ ... 6 patterns including linguistic results ... ],
  "linguistic_analysis": {
    "intent_match_score": 0.72,
    "missing_features": ["zero_check", "validation"],
    "unprompted_features": [],
    "hardcoded_values": []
  }
}
```

---

### Appendix C — Environment Variables

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host/db` |
| `OLLAMA_API_KEY` | Ollama Cloud API key | `sk-...` |
| `OPENROUTER_API_KEY` | OpenRouter fallback API key | `sk-or-...` |
| `DOCKER_HOST` | Docker socket path | `unix:///var/run/docker.sock` |
| `DOCKER_TIMEOUT` | Container execution timeout (s) | `10` |
| `DOCKER_MEMORY_LIMIT` | Container memory cap | `128m` |
| `ENVIRONMENT` | `development` enables CORS `*` | `production` |

---

### Appendix D — Project File Structure

```
Codeguard/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app, 3-stage pipeline, background tasks
│   │   ├── models.py            # SQLAlchemy ORM models (5 tables)
│   │   ├── schemas.py           # Pydantic request/response schemas
│   │   ├── database.py          # DB engine, session factory
│   │   └── analyzers/
│   │       ├── static_analyzer.py      # Stage 1: AST-based 10-check analysis
│   │       ├── dynamic_analyzer.py     # Stage 2: Docker + subprocess execution
│   │       ├── linguistic_analyzer.py  # Stage 3: 4-detector intent analysis
│   │       ├── classifier.py           # Taxonomy mapping (all 3 stages → 10 patterns)
│   │       ├── explainer.py            # Human-readable summaries + fix suggestions
│   │       ├── linguistic/
│   │       │   ├── LLM_response.py          # Ollama/OpenRouter dual-API wrapper
│   │       │   ├── npc_detector.py          # Non-Prompted Consideration detector
│   │       │   ├── prompt_bias_detector.py  # Prompt-Biased Code detector
│   │       │   ├── missing_feature_detector.py  # Missing Feature / Intent gap
│   │       │   ├── misinterpretation_detector.py  # Semantic mismatch detector
│   │       │   └── layers/
│   │       │       └── layer3_llm_reasoner.py  # LLM verdict layer
│   │       └── static/
│   │           └── detectors/           # Astroid-based individual detectors
│   ├── requirements-light.txt   # Production dependencies
│   └── render.yaml              # Render deployment config
├── codeguard-vscode-extension/
│   ├── src/
│   │   ├── extension.ts         # VS Code activation + command registration
│   │   ├── services/
│   │   │   └── apiService.ts    # axios POST + polling logic
│   │   └── webview/
│   │       ├── SidePanel.ts     # WebviewViewProvider implementation
│   │       └── webview.html     # Sidebar panel UI (HTML/CSS/JS)
│   ├── esbuild.js               # Bundle script (axios baked in)
│   └── package.json             # Extension manifest + contributes
└── README.md                    # This file
```
