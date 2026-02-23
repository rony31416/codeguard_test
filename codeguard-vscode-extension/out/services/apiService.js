"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeCode = analyzeCode;
exports.submitFeedback = submitFeedback;
const axios_1 = __importDefault(require("axios"));
const vscode = __importStar(require("vscode"));
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
/**
 * Poll GET /api/analysis/{id} every 15 s until the backend marks the
 * analysis as complete (linguistic background task finished).
 * Gives up after ~5 minutes and returns whatever is in the DB at that point.
 */
async function pollForCompletion(analysisId, apiUrl, onProgress) {
    const MAX_ATTEMPTS = 20; // 20 × 15 s = 5 min
    const INTERVAL_MS = 15000;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        await sleep(INTERVAL_MS);
        if (onProgress) {
            onProgress(attempt);
        }
        try {
            const resp = await axios_1.default.get(`${apiUrl}/api/analysis/${analysisId}`, { timeout: 30000 });
            if (resp.data.status !== 'processing') {
                return resp.data;
            }
        }
        catch {
            // transient error — keep polling
        }
    }
    // Last attempt — return whatever we have
    const final = await axios_1.default.get(`${apiUrl}/api/analysis/${analysisId}`, { timeout: 30000 });
    return final.data;
}
async function analyzeCode(request) {
    const config = vscode.workspace.getConfiguration('codeguard');
    const useLocal = config.get('useLocalBackend', false);
    // Production backend on Render.com
    const defaultUrl = 'https://codeguard-backend-g7ka.onrender.com';
    const localUrl = 'http://localhost:8000';
    const apiUrl = useLocal ? localUrl : config.get('apiUrl', defaultUrl);
    try {
        const response = await axios_1.default.post(`${apiUrl}/api/analyze`, request, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 60000, // 60 s — backend now returns in <2 s
        });
        // Backend returns immediately with status="processing".
        // Linguistic analysis runs in background; poll for the final result.
        if (response.data.status === 'processing') {
            return await pollForCompletion(response.data.analysis_id, apiUrl);
        }
        return response.data;
    }
    catch (error) {
        if (error.response) {
            throw new Error(`API Error: ${error.response.data.detail || error.message}`);
        }
        else if (error.request) {
            if (error.code === 'ECONNABORTED') {
                throw new Error('Analysis timed out. The server may be starting up — please try again in 30 seconds.');
            }
            if (error.code === 'ECONNRESET' || error.code === 'ECONNREFUSED') {
                throw new Error(`Cannot connect to CodeGuard backend. Make sure it's running on ${apiUrl}`);
            }
            throw new Error(`Cannot connect to CodeGuard backend. Make sure it's running on ${apiUrl}`);
        }
        else {
            throw new Error(error.message);
        }
    }
}
async function submitFeedback(request) {
    const config = vscode.workspace.getConfiguration('codeguard');
    const useLocal = config.get('useLocalBackend', false);
    // Production backend on Render.com
    const defaultUrl = 'https://codeguard-backend-g7ka.onrender.com';
    const localUrl = 'http://localhost:8000';
    const apiUrl = useLocal ? localUrl : config.get('apiUrl', defaultUrl);
    try {
        const response = await axios_1.default.post(`${apiUrl}/api/feedback`, request, {
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: 10000
        });
        return response.data;
    }
    catch (error) {
        if (error.response) {
            throw new Error(`Feedback Error: ${error.response.data.detail || error.message}`);
        }
        else if (error.request) {
            throw new Error('Cannot submit feedback. Backend not reachable.');
        }
        else {
            throw new Error(error.message);
        }
    }
}
//# sourceMappingURL=apiService.js.map