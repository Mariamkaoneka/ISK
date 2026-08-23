import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Set body size limits to accommodate high-resolution scans and photos
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Lazy initializer for Google GenAI client
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!genAIClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not set. Requests will fail if API key is absent.");
    }
    genAIClient = new GoogleGenAI({
      apiKey: apiKey || "",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return genAIClient;
}

// Health check endpoint
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", service: "Tanzania Radiology Interpreter API" });
});

// Main Radiology Interpretation Endpoint
app.post("/api/interpret", async (req: Request, res: Response): Promise<void> => {
  try {
    const { text, imageBase64, mimeType } = req.body;

    if (!text && !imageBase64) {
      res.status(400).json({
        error: "Tafadhali toa maandishi au picha ya ripoti ya eksirei/ultrasound / Please provide report text or an image.",
      });
      return;
    }

    const ai = getGenAI();

    const systemInstruction = `You are a medical radiology communication specialist dedicated to helping patients and their families in Tanzania understand their radiology reports (X-rays, Ultrasound, CT Scans, MRI, Mammograms, etc.).

Your core objectives:
1. Translate difficult radiological and medical jargon into plain, compassionate, simple, and accurate language.
2. Provide interpretations in BOTH standard plain English and natural, polite, everyday Swahili (Kiswahili cha kawaida kinachoeleweka nchini Tanzania).
3. STRICT ETHICAL AND SAFETY RULE: NEVER PROVIDE A PROGNOSIS.
   - Do NOT predict disease trajectory, survival, lifespan, or outcome certainty.
   - Do NOT prescribe medications or make definitive treatment mandates.
   - ONLY explain what the radiologist observed in the scan (anatomical structures, findings, and technical terms).
4. Strictly respect patient privacy. Acknowledge that this data is processed ephemerally and NOT stored.
5. Provide a helpful glossary of medical terms found in the report, translated into plain English and plain Swahili.
6. Suggest 3-4 sensible, constructive questions the patient can bring to their doctor during their next visit.
7. Return strictly valid JSON adhering to the specified schema.`;

    const promptText = `Analyze the following radiology report (from the provided text or image).
${text ? `REPORT TEXT:\n${text}` : "Please read the text from the attached radiology report image, transcribe it, and provide the plain-language interpretation."}

Remember:
- Explain what body parts were examined.
- Explain each finding in simple, everyday English and simple everyday Swahili.
- For each finding, classify status as: 'normal' (kawaida), 'attention' (inahitaji mazungumzo na daktari), or 'inconclusive' (haijabainika vizuri).
- Identify and define all confusing medical terms.
- STRICTLY NO PROGNOSIS.
- Always include the clear disclaimers that this is an AI tool for understanding terms, NOT a doctor consultation.`;

    const contents: any[] = [];

    if (imageBase64) {
      // Clean base64 data if data URL prefix exists
      let cleanedBase64 = imageBase64;
      let effectiveMime = mimeType || "image/jpeg";
      if (imageBase64.includes(",")) {
        const parts = imageBase64.split(",");
        const match = parts[0].match(/:(.*?);/);
        if (match) {
          effectiveMime = match[1];
        }
        cleanedBase64 = parts[1];
      }

      contents.push({
        inlineData: {
          mimeType: effectiveMime,
          data: cleanedBase64,
        },
      });
    }

    contents.push({
      text: promptText,
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            modality: {
              type: Type.STRING,
              description: "Type of scan in English (e.g. Chest X-Ray, Abdominal Ultrasound, Lumbar MRI)",
            },
            modality_sw: {
              type: Type.STRING,
              description: "Type of scan in Swahili (e.g. Eksirei ya Kifua, Ultrasound ya Tumbo, MRI ya Mgongo)",
            },
            bodyRegion: {
              type: Type.STRING,
              description: "Body part or system examined in English (e.g. Lungs & Chest, Upper Abdomen, Spine)",
            },
            bodyRegion_sw: {
              type: Type.STRING,
              description: "Body part or system examined in Swahili (e.g. Kifua na Mapafu, Sehemu ya Juu ya Tumbo, Uti wa Mgongo)",
            },
            overallSummary_en: {
              type: Type.STRING,
              description: "A gentle 2-3 sentence plain English summary of what the scan found, easy for any patient to understand.",
            },
            overallSummary_sw: {
              type: Type.STRING,
              description: "Muhtasari mpole wa sentensi 2-3 kwa Kiswahili rahisi kuhusu kile picha ilichoonyesha.",
            },
            keyFindings: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title_en: { type: Type.STRING, description: "Short English title for finding" },
                  title_sw: { type: Type.STRING, description: "Kichwa kifupi cha Kiswahili cha matokeo" },
                  explanation_en: { type: Type.STRING, description: "Simple plain English explanation" },
                  explanation_sw: { type: Type.STRING, description: "Ufafanuzi rahisi kwa lugha ya Kiswahili" },
                  status: {
                    type: Type.STRING,
                    enum: ["normal", "attention", "inconclusive"],
                    description: "Whether finding is normal, needs clinical attention/discussion, or inconclusive",
                  },
                },
                required: ["title_en", "title_sw", "explanation_en", "explanation_sw", "status"],
              },
            },
            medicalTermsGlossary: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  term: { type: Type.STRING, description: "Medical term as written on report" },
                  meaning_en: { type: Type.STRING, description: "Plain English definition" },
                  meaning_sw: { type: Type.STRING, description: "Ufafanuzi kwa Kiswahili rahisi" },
                },
                required: ["term", "meaning_en", "meaning_sw"],
              },
            },
            questionsForDoctor_en: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3-4 suggested questions in English for the patient to ask their doctor",
            },
            questionsForDoctor_sw: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Maswali 3-4 ya Kiswahili ya kumuuliza daktari",
            },
            disclaimer_en: {
              type: Type.STRING,
              description: "English disclaimer stating this is AI assistance and not a doctor consultation and gives no prognosis",
            },
            disclaimer_sw: {
              type: Type.STRING,
              description: "Swahili disclaimer: Ufafanuzi huu si mbadala wa daktari na hautoi prognosis",
            },
            detectedOriginalLanguage: {
              type: Type.STRING,
              description: "Original language of report (English, Swahili, Mixed)",
            },
            reportRawText: {
              type: Type.STRING,
              description: "Transcribed or cleaned text from the report",
            },
          },
          required: [
            "modality",
            "modality_sw",
            "bodyRegion",
            "bodyRegion_sw",
            "overallSummary_en",
            "overallSummary_sw",
            "keyFindings",
            "medicalTermsGlossary",
            "questionsForDoctor_en",
            "questionsForDoctor_sw",
            "disclaimer_en",
            "disclaimer_sw",
          ],
        },
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("No response received from interpretation model.");
    }

    const parsedData = JSON.parse(responseText);
    res.json(parsedData);
  } catch (error: any) {
    console.error("Error during radiology interpretation:", error);
    res.status(500).json({
      error: error.message || "Failed to process report interpretation",
      details: "Samahani, kulikuwa na hitilafu katika kufafanua ripoti hii. Tafadhali jaribu tena au weka maandishi yaliyo wazi zaidi.",
    });
  }
});

// Vite / Static file handling
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Tanzania Radiology Interpreter Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
