const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const pdfParse = require('pdf-parse');
const OpenAI = require('openai');

const app = express();
const PORT = process.env.PORT || 5000;

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', endpoints: ['/upload', '/chat'] }));

// Set up storage for uploaded files
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed!'), false);
        }
    }
});

// Upload and Summarize endpoint
app.post('/upload', upload.single('file'), async (req, res) => {
    if (!req.file) {
        console.log('--- Upload Attempt: No file provided ---');
        return res.status(400).json({ error: 'No file uploaded or invalid file type.' });
    }

    console.log(`\n[${new Date().toLocaleTimeString()}] Processing: ${req.file.originalname} (${req.file.size} bytes)`);

    try {
        const { summaryLevel, outputStyle } = req.body;

        // 1. Parse PDF
        console.log('Step 1: Parsing PDF...');
        const dataBuffer = fs.readFileSync(req.file.path);
        const pdfData = await pdfParse(dataBuffer);

        // 1.1 Check Page Limit
        if (pdfData.numpages > 50) {
            console.log(`Step 1.1: Page limit exceeded (${pdfData.numpages} pages)`);
            return res.status(400).json({
                error: `PDF exceeds the 50-page limit. This file has ${pdfData.numpages} pages.`
            });
        }

        const pdfText = pdfData.text;
        console.log('PDF Parsed. Character count:', pdfText.length);

        // Optional: truncate text if it's too massive for OpenAI tokens (just a basic safeguard)
        const truncatedText = pdfText.substring(0, 15000);
        console.log('Truncated for AI:', truncatedText.length, 'chars');

        // 2. Determine prompt based on level/style/language
        const targetLanguage = req.body.targetLanguage || 'English';
        const levelInstructions = {
            'Brief': 'Create a concise, high-level summary. Focus only on the most essential points.',
            'Detailed': 'Create a comprehensive and detailed summary. Cover all major points, supporting details, and nuances.',
            'ELI5': 'Explain the document like I am five years old. Use very simple language, short sentences, and relatable analogies. Avoid technical jargon.'
        };

        const styleInstructions = {
            'Paragraph': 'The overview and topic descriptions should be written in flowing paragraph form.',
            'Bullets': 'The overview and topic descriptions should be written as clear, concise bullet points.',
            'Structured': 'The output should be highly structured with clear sections and nested details.'
        };

        const levelDesc = levelInstructions[summaryLevel] || levelInstructions['Detailed'];
        const styleDesc = styleInstructions[outputStyle] || styleInstructions['Paragraph'];

        let systemPrompt = `You are a premium AI document analyst. Respond in valid JSON format ONLY. 
        Your goal is to provide a world-class summary and deep data extraction in ${targetLanguage}.

        Instructions:
        - Summary Level: ${levelDesc}
        - Output Style: ${styleDesc}
        - Language: ${targetLanguage}
        - Citations: For every key topic and insight, include a "citation" field indicating the approximate page number or section.
        - Fact Sheet: Extract key financial figures, critical dates, and important entities.
        - Visual Data: Extract any numeric trends or comparisons that can be visualized in a chart (e.g., [ { "label": "2023", "value": 100 } ]).
        - Narrative Map: Extract a simplified graph of the document's structure:
            - nodes: [ { "id": "Topic A", "group": 1 } ]
            - links: [ { "source": "Topic A", "target": "Topic B", "value": 1 } ]

        You MUST follow this exact schema:
        {
          "title": "...",
          "overview": "...",
          "keyTopics": [
            { "topicName": "...", "topicDescription": "...", "citation": "Page X" }
          ],
          "actionableInsights": [
            { "text": "...", "citation": "Page X" }
          ],
          "factSheet": {
            "financials": ["..."],
            "dates": ["..."],
            "peopleCompanies": ["..."]
          },
          "visualData": [
            { "label": "...", "value": 0 }
          ],
          "narrativeMap": {
            "nodes": [],
            "links": []
          }
        }
        `;

        let userPrompt = `Document Text:\n${truncatedText}`;

        if (!process.env.OPENAI_API_KEY) {
            return res.json({
                message: 'Summari PRO (Simulated)',
                summary: {
                    title: "Advanced Analysis (SIMULATED)",
                    overview: "The backend is ready for advanced extraction. Please provide an API key to enable real processing.",
                    keyTopics: [{ topicName: "Data Extraction", topicDescription: "Ready to pull financials and dates.", citation: "Page 1" }],
                    actionableInsights: [{ text: "Enable OpenAI API for real insights.", citation: "Page 1" }],
                    factSheet: { financials: ["$1.2M (Demo)"], dates: ["2026-03-12"], peopleCompanies: ["Summari Inc."] }
                }
            });
        }

        console.log('Step 2: Calling OpenAI (gpt-4o)...');
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            response_format: { type: "json_object" }
        });

        console.log('Step 3: OpenAI response received.');
        const summaryJSON = JSON.parse(completion.choices[0].message.content);

        fs.unlinkSync(req.file.path);
        res.json({
            message: 'Advanced analysis complete',
            summary: summaryJSON,
            documentText: truncatedText,
            pageCount: pdfData.numpages
        });

    } catch (error) {
        console.error('Extraction Error:', error.message);
        res.status(500).json({ error: 'Failed to extract advanced data.' });
    }
});

// New Endpoint: Text-to-Speech (Audio Brief)
app.post('/audio', async (req, res) => {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'No text provided for audio.' });

    try {
        console.log(`[${new Date().toLocaleTimeString()}] Generating Audio Brief...`);
        const mp3 = await openai.audio.speech.create({
            model: "tts-1",
            voice: "alloy",
            input: text,
        });

        const buffer = Buffer.from(await mp3.arrayBuffer());
        res.set({
            'Content-Type': 'audio/mpeg',
            'Content-Length': buffer.length
        });
        res.send(buffer);
    } catch (error) {
        console.error('TTS Error:', error.message);
        res.status(500).json({ error: 'Audio generation failed.' });
    }
});

// New Endpoint: Document Comparison
app.post('/compare', upload.array('files', 2), async (req, res) => {
    if (!req.files || req.files.length !== 2) {
        return res.status(400).json({ error: 'Two files are required for comparison.' });
    }

    try {
        console.log(`[${new Date().toLocaleTimeString()}] Comparing: ${req.files[0].originalname} and ${req.files[1].originalname}`);

        const texts = await Promise.all(req.files.map(async (file) => {
            const buffer = fs.readFileSync(file.path);
            const data = await pdfParse(buffer);
            fs.unlinkSync(file.path);
            return { name: file.originalname, text: data.text.substring(0, 8000) };
        }));

        const systemPrompt = `You are a document comparison expert. Analyze the two provided document texts and highlight the key differences, contradictions, or updates. Respond in JSON.
        Format: { "title": "Comparison Report", "overview": "...", "deltas": [{ "property": "...", "doc1": "...", "doc2": "...", "significance": "..." }] }`;

        const userPrompt = `Doc 1 (${texts[0].name}):\n${texts[0].text}\n\nDoc 2 (${texts[1].name}):\n${texts[1].text}`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            response_format: { type: "json_object" }
        });

        res.json(JSON.parse(completion.choices[0].message.content));
    } catch (error) {
        console.error('Comparison Error:', error.message);
        res.status(500).json({ error: 'Comparison failed.' });
    }
});

// Chat endpoint for contextual Q&A
app.post('/chat', async (req, res) => {
    const { documentText, messages } = req.body;

    if (!documentText) {
        return res.status(400).json({ error: 'No document context provided.' });
    }

    if (!messages || !messages.length) {
        return res.status(400).json({ error: 'No chat history provided.' });
    }

    try {
        console.log(`[${new Date().toLocaleTimeString()}] AI Chat Request | Context: ${documentText?.length} chars | History: ${messages?.length} msgs`);

        if (!process.env.OPENAI_API_KEY) {
            return res.json({ reply: "(Simulated) I'm in dev mode without an API key. Your document seems interesting! (Check .env to enable real AI)" });
        }

        const systemMessage = {
            role: "system",
            content: `You are an AI assistant specialized in answering questions about a specific document. 
            Base your answers ONLY on the provided document text. If the answer is not in the text, politely say you don't know based on the document.
            Keep your responses professional, concise and formatted in markdown if necessary.
            
            Document Content:
            ${documentText.substring(0, 15000)}`
        };

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [systemMessage, ...messages],
        });

        const reply = completion.choices[0].message.content;
        res.json({ reply });

    } catch (error) {
        console.error('Chat Error:', error.message);
        res.status(500).json({ error: 'Failed to get AI response.' });
    }
});

// New Endpoint: Quiz Generation
app.post('/quiz', async (req, res) => {
    const { documentText, difficultyLevel, numQuestions } = req.body;

    if (!documentText) {
        return res.status(400).json({ error: 'No document text provided.' });
    }

    try {
        const qCount = Math.min(parseInt(numQuestions) || 5, 10);
        const difficulty = difficultyLevel || 'Medium';
        console.log(`[${new Date().toLocaleTimeString()}] Generating ${qCount} ${difficulty} Quiz Questions...`);

        if (!process.env.OPENAI_API_KEY) {
            // Simulated response
            const fakeQuestions = Array.from({ length: qCount }).map((_, i) => ({
                question: `Simulated Question ${i + 1} (${difficulty})?`,
                options: ["Option A", "Option B", "Option C", "Option D"],
                correctIndex: 0,
                explanation: "This is a simulated explanation because the API key is not set."
            }));
            return res.json({ questions: fakeQuestions });
        }

        const systemPrompt = `You are an expert quiz generator. Generate a multiple-choice quiz based ONLY on the provided document text.
        
        Requirements:
        - Generate EXACTLY ${qCount} questions.
        - Difficulty level: ${difficulty}.
        - Each question must have EXACTLY 4 options.
        - Provide the 0-based index of the correct option (0, 1, 2, or 3).
        - Provide a short explanation of why the answer is correct based on the text.
        
        You MUST respond in valid JSON using this exact schema:
        {
            "questions": [
                {
                    "question": "...",
                    "options": ["...", "...", "...", "..."],
                    "correctIndex": 0,
                    "explanation": "..."
                }
            ]
        }`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Document Text:\n${documentText.substring(0, 15000)}` }
            ],
            response_format: { type: "json_object" }
        });

        const quizData = JSON.parse(completion.choices[0].message.content);
        res.json(quizData);

    } catch (error) {
        console.error('Quiz Generation Error:', error.message);
        res.status(500).json({ error: 'Failed to generate quiz.' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
