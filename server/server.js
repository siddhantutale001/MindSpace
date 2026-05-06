require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

// ✅ Use gemini-2.5-flash — gemini-1.5-flash was shut down April 2025
const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

app.post('/chat', async (req, res) => {
    try {
        const url = `${GEMINI_API_BASE}/models/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: req.body.prompt }] }]
            })
        });

        const data = await response.json();

        if (!response.ok) {
            // Surface the exact Google error message for easier debugging
            const googleError = data?.error?.message || JSON.stringify(data);
            console.error(`[Gemini API Error ${response.status}]:`, googleError);
            return res.status(response.status).json({ error: googleError });
        }

        res.json({ text: data.candidates[0].content.parts[0].text });

    } catch (error) {
        console.error('[Server Error]:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// 🔍 Diagnostic endpoint — call GET /models to see what's available to your key
app.get('/models', async (req, res) => {
    try {
        const url = `${GEMINI_API_BASE}/models?key=${process.env.GEMINI_API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) return res.status(response.status).json(data);

        // Return just the model names for readability
        const modelNames = data.models?.map(m => m.name) ?? [];
        res.json({ available_models: modelNames });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(3000, () => console.log('Server running on port 3000'));