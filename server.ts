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

// Helper to sleep for exponential backoff
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper function to call Gemini with retries and fallback models
async function generateRadiologyInterpretation(ai: GoogleGenAI, contents: any[], systemInstruction: string, schema: any) {
  const modelsToTry = [
    "gemini-3.7-flash",
    "gemini-3.1-flash-lite",
    "gemini-flash-latest"
  ];

  let lastError: any = null;

  for (const model of modelsToTry) {
    const maxAttempts = 2;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`Attempting interpretation with model: ${model} (attempt ${attempt}/${maxAttempts})...`);
        const response = await ai.models.generateContent({
          model: model,
          contents: contents,
          config: {
            systemInstruction: systemInstruction,
            responseMimeType: "application/json",
            responseSchema: schema,
          },
        });

        if (response.text) {
          return response.text;
        }
      } catch (err: any) {
        lastError = err;
        const errMessage = String(err?.message || err);
        console.warn(`Model ${model} attempt ${attempt} failed:`, errMessage);

        const isTransient =
          errMessage.includes("503") ||
          errMessage.includes("UNAVAILABLE") ||
          errMessage.includes("high demand") ||
          errMessage.includes("429") ||
          errMessage.includes("RESOURCE_EXHAUSTED") ||
          errMessage.includes("fetch failed");

        if (isTransient && attempt < maxAttempts) {
          await delay(1200 * attempt);
        } else if (!isTransient) {
          // If it's a non-retryable error (e.g., bad request schema), don't loop endlessly
          break;
        }
      }
    }
  }

  throw lastError || new Error("Failed to generate interpretation with available models.");
}
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

    const systemInstruction = `You are a medical radiology communication specialist dedicated to helping patients and their families in Tanzania understand their written radiology reports (X-ray reports, Ultrasound reports, CT Scan reports, MRI reports, Mammogram reports, etc.).

CRITICAL SCOPE AND SAFETY DIRECTIVE:
- THIS APP ONLY INTERPRETS WRITTEN RADIOLOGICAL REPORTS (the textual findings, observations, impressions, and conclusions written by a radiologist or medical imaging department).
- IT DOES NOT DIAGNOSE OR INTERPRET RAW RADIOLOGICAL SCANS OR RAW IMAGES (raw X-ray films, raw ultrasound video/frames, or raw CT/MRI DICOM slices without report text).
- If the user provides an image, treat it as a photo/scan of a PHYSICAL PAPER RADIOLOGY REPORT or digital document. Transcribe/OCR the written medical text from the image, and interpret the written findings.
- If the image contains ONLY a raw radiographic scan/film with NO legible written report text or findings, politely inform the user in both Swahili and English that this tool interprets written radiology report documents and cannot perform primary diagnostic reading of raw radiographic scans, advising them to consult a qualified radiologist or doctor.

Your core objectives:
1. Translate difficult radiological and medical report jargon into plain, compassionate, simple, and accurate language.
2. Provide interpretations in BOTH standard plain English and natural, polite, everyday Swahili (Kiswahili cha kawaida kinachoeleweka nchini Tanzania).
3. STRICT ETHICAL AND SAFETY RULE: NEVER PROVIDE A PROGNOSIS.
   - Do NOT predict disease trajectory, survival, lifespan, or outcome certainty.
   - Do NOT prescribe medications or make definitive treatment mandates.
   - ONLY explain what the radiologist recorded in the written report (anatomical structures mentioned, reported findings, and technical terms).
4. Strictly respect patient privacy. Acknowledge that this data is processed ephemerally and NOT stored.
5. Provide a helpful glossary of medical terms found in the report, translated into plain English and plain Swahili.
6. Suggest 3-4 sensible, constructive questions the patient can bring to their doctor during their next visit.
7. Return strictly valid JSON adhering to the specified schema.`;

    const promptText = `Analyze the following written radiology report findings (from the provided text or photographed report document).
${text ? `REPORT TEXT:\n${text}` : "Please read and transcribe the written medical findings from the attached radiology report document photo, and provide the plain-language interpretation of what the report states."}

Remember:
- This is an interpretation of the written radiology report findings, NOT a direct diagnosis of raw scan films.
- Explain what body parts and procedures are described in the report.
- Explain each reported finding in simple, everyday English and simple everyday Swahili.
- For each finding, classify status as: 'normal' (kawaida), 'attention' (inahitaji mazungumzo na daktari), or 'inconclusive' (haijabainika vizuri).
- Identify and define all confusing medical terms found in the report.
- STRICTLY NO PROGNOSIS.
- Always include the clear disclaimers that this is an AI tool for understanding report terms, NOT a doctor consultation.`;

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

    const responseSchema = {
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
    };

    const responseText = await generateRadiologyInterpretation(
      ai,
      contents,
      systemInstruction,
      responseSchema
    );

    if (!responseText) {
      throw new Error("No response received from interpretation model.");
    }

    const parsedData = JSON.parse(responseText);
    res.json(parsedData);
  } catch (error: any) {
    console.error("Error during radiology interpretation:", error);
    const rawMsg = String(error?.message || error || "");
    const isOverloaded = rawMsg.includes("503") || rawMsg.includes("UNAVAILABLE") || rawMsg.includes("high demand") || rawMsg.includes("429");
    
    const userFriendlyError = isOverloaded
      ? "Mtandao wa AI kwa sasa una watumiaji wengi sana (High Demand). Tafadhali subiri sekunde chache kisha ubonyeze 'Jaribu Tena' / AI service is currently experiencing high demand. Please wait a few seconds and retry."
      : error.message || "Failed to process report interpretation";

    res.status(isOverloaded ? 503 : 500).json({
      error: userFriendlyError,
      details: isOverloaded
        ? "Mtandao una shughuli nyingi kwa muda mfupi. Tafadhali jaribu tena baada ya sekunde chache."
        : "Samahani, kulikuwa na hitilafu katika kufafanua ripoti hii. Tafadhali jaribu tena au weka maandishi yaliyo wazi zaidi.",
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
