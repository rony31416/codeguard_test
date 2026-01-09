import React, { useState } from "react";
import CodeEditor from "./components/CodeEditor";
import PromptInput from "./components/PromptInput";
import ResultsDashboard from "./components/ResultsDashboard";
import { analyzeCode, submitFeedback } from "./services/api";
import { AnalysisResponse } from "./types";

function App() {
  const [prompt, setPrompt] = useState("");
  const [code, setCode] = useState("");
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // const handleAnalyze = async () => {
  //   if (!code.trim()) {
  //     setError('Please enter code to analyze');
  //     return;
  //   }

  //   setLoading(true);
  //   setError(null);

  //   try {
  //     const response = await analyzeCode({ prompt, code });
  //     setResult(response);
  //   } catch (err: any) {
  //     setError(err.response?.data?.detail || 'Analysis failed. Please try again.');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleAnalyze = async () => {
    if (!code.trim()) {
      setError("Please enter code to analyze");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("Analyzing code...", { prompt, code });
      const response = await analyzeCode({ prompt, code });
      console.log("Analysis complete:", response);
      setResult(response);
    } catch (err: any) {
      console.error("Analysis error:", err);
      const errorMessage =
        err.response?.data?.detail ||
        err.message ||
        "Analysis failed. Please try again.";
      setError(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (feedback: string) => {
    if (!result) return;

    try {
      await submitFeedback(result.id, feedback);
      alert("Thank you for your feedback!");
    } catch (err) {
      alert("Failed to submit feedback");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-primary text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">🛡️ CodeGuard</h1>
          <p className="text-blue-100 mt-1">
            LLM Bug Taxonomy Classifier & Analyzer
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Input */}
          <div>
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Input</h2>

              <PromptInput value={prompt} onChange={setPrompt} />

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  LLM-Generated Code
                </label>
                <CodeEditor
                  value={code}
                  onChange={(value) => setCode(value || "")}
                />
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-800 rounded-lg">
                  {error}
                </div>
              )}

              <button
                onClick={handleAnalyze}
                disabled={loading}
                className="w-full bg-primary text-white py-3 px-6 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin h-5 w-5 mr-3"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Analyzing...
                  </span>
                ) : (
                  "🔍 Analyze Code"
                )}
              </button>
            </div>

            {/* Info Card */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">
                How it works:
              </h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>✓ Stage 1: Static analysis checks code structure</li>
                <li>✓ Stage 2: Dynamic execution detects runtime errors</li>
                <li>✓ Classifies bugs into 10 AI-specific patterns</li>
                <li>✓ Provides fix suggestions and explanations</li>
              </ul>
            </div>
          </div>

          {/* Right Column - Results */}
          <div>
            <ResultsDashboard result={result} onFeedback={handleFeedback} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-300 mt-12">
        <div className="container mx-auto px-4 py-6 text-center">
          <p>CodeGuard - Academic Project | Static & Dynamic Analysis</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
