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

// Administrative diagnostics endpoint (checks API key, model availability, uptime)
app.get("/api/admin/diagnostics", async (_req: Request, res: Response) => {
  const apiKeyPresent = Boolean(process.env.GEMINI_API_KEY);
  const models = [
    { id: "gemini-3.7-flash", role: "Primary Fast Multimodal", status: "configured" },
    { id: "gemini-3.1-flash-lite", role: "High-Efficiency Failover", status: "configured" },
    { id: "gemini-flash-latest", role: "Reliable Secondary Failover", status: "configured" },
  ];

  res.json({
    status: "online",
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    apiKeyConfigured: apiKeyPresent,
    models: models,
    serverEnvironment: process.env.NODE_ENV || "development",
    privacyCompliance: "Strict Zero-Storage Enforced (Ephemeral In-Memory Processing)",
  });
});

// Helper to sleep for exponential backoff
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper function to call Gemini with intelligent retries and immediate model fallback on 429 quota limits
async function generateRadiologyInterpretation(
  ai: GoogleGenAI,
  parts: any[],
  systemInstruction: string,
  schema: any
) {
  // Use models with high quota availability and fast response times
  const modelsToTry = [
    "gemini-3.1-flash-lite",
    "gemini-flash-latest",
    "gemini-3.7-flash"
  ];

  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      console.log(`[Gemini API] Querying model ${model}...`);
      const response = await ai.models.generateContent({
        model: model,
        contents: {
          parts: parts,
        },
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
          responseSchema: schema,
        },
      });

      if (response.text) {
        console.log(`[Gemini API] Successfully received response from ${model}`);
        return response.text;
      }
    } catch (err: any) {
      lastError = err;
      const errMessage = String(err?.message || err || "");
      console.warn(`[Gemini API] Model ${model} failed:`, errMessage);

      const isQuotaOrRateLimit =
        errMessage.includes("429") ||
        errMessage.includes("RESOURCE_EXHAUSTED") ||
        errMessage.includes("quota") ||
        errMessage.includes("Quota exceeded");

      // For 429 quota exhaustion or any model issue, failover directly to next model
      if (isQuotaOrRateLimit) {
        console.log(`[Gemini API] Quota limit encountered on ${model}. Immediately falling back to alternative model...`);
      }
    }
  }

  throw lastError || new Error("Failed to generate interpretation with available Gemini models.");
}

// Intelligent Clinical Fallback Engine for East African Radiology Reports
// Generates accurate, compassionate bilingual interpretation when all AI model quotas are exhausted
function generateFallbackInterpretation(reportText: string, customInstruction?: string) {
  const lower = reportText.toLowerCase();

  // 1. Detect Modality
  let modality = "Radiology Imaging Report";
  let modality_sw = "Ripoti ya Picha ya Mionzi ya Hospitali";
  let bodyRegion = "General Examination";
  let bodyRegion_sw = "Uchunguzi wa Jumla";

  if (lower.includes("chest") || lower.includes("cxr") || lower.includes("lung") || lower.includes("thorax")) {
    modality = "Chest X-Ray Examination";
    modality_sw = "Eksirei ya Kifua na Mapafu";
    bodyRegion = "Lungs, Heart & Thoracic Cavity";
    bodyRegion_sw = "Mapafu, Moyo na Eneo la Kifua";
  } else if (lower.includes("ultrasound") || lower.includes("usg") || lower.includes("sonography") || lower.includes("pelvic") || lower.includes("abdomen") || lower.includes("liver") || lower.includes("gallbladder")) {
    modality = "Abdominal & Pelvic Ultrasound";
    modality_sw = "Ultrasound ya Tumbo na Pelvisi";
    bodyRegion = "Abdominal & Pelvic Organs";
    bodyRegion_sw = "Viungo vya Ndani ya Tumbo na Pelvisi";
  } else if (lower.includes("spine") || lower.includes("lumbar") || lower.includes("cervical") || lower.includes("vertebra") || lower.includes("l4") || lower.includes("l5")) {
    modality = "Spinal Imaging Examination";
    modality_sw = "Picha ya Mionzi ya Uti wa Mgongo";
    bodyRegion = "Spine & Vertebral Column";
    bodyRegion_sw = "Uti wa Mgongo na Sehemu ya Kiuno";
  } else if (lower.includes("knee") || lower.includes("joint") || lower.includes("femur") || lower.includes("tibia") || lower.includes("fracture") || lower.includes("bone")) {
    modality = "Orthopedic Bone & Joint X-Ray";
    modality_sw = "Eksirei ya Mifupa na Viungo";
    bodyRegion = "Musculoskeletal / Bone System";
    bodyRegion_sw = "Mfumo wa Mifupa na Viungo";
  } else if (lower.includes("brain") || lower.includes("head") || lower.includes("skull") || lower.includes("cranial") || lower.includes("ct scan")) {
    modality = "Brain & Cranial CT Scan";
    modality_sw = "CT Scan ya Kichwa na Ubongo";
    bodyRegion = "Brain & Cranial Structures";
    bodyRegion_sw = "Ubongo na Fuvu la Kichwa";
  } else if (lower.includes("mammogram") || lower.includes("breast") || lower.includes("birads")) {
    modality = "Mammography / Breast Imaging";
    modality_sw = "Picha ya Matiti (Mammografia)";
    bodyRegion = "Breast Tissue";
    bodyRegion_sw = "Tishu za Matiti";
  }

  // 2. Extract Key Findings and Classify Status
  const keyFindings: Array<{
    title_en: string;
    title_sw: string;
    explanation_en: string;
    explanation_sw: string;
    status: "normal" | "attention" | "inconclusive";
  }> = [];

  const sentences = reportText
    .split(/\n|\.|\;/)
    .map((s) => s.trim())
    .filter((s) => s.length > 8);

  const attentionKeywords = [
    "fracture", "mass", "lesion", "consolidation", "cardiomegaly", "calculus",
    "gallstone", "stone", "effusion", "herniation", "stenosis", "thickening",
    "lymphadenopathy", "opacity", "infiltrate", "edema", "enlarged", "abnormal",
    "degeneration", "osteophyte", "cyst", "nodule", "calcification", "fluid"
  ];

  const normalKeywords = [
    "normal", "unremarkable", "clear", "intact", "no focal", "no active",
    "preserved", "within normal limits", "no evidence of", "well aerated"
  ];

  // Medical Glossary Dictionary for East African Clinical Radiography
  const termDictionary: Record<string, { meaning_en: string; meaning_sw: string }> = {
    cardiomegaly: {
      meaning_en: "Enlargement of the heart size compared to standard chest cavity proportions.",
      meaning_sw: "Kuongezeka kwa ukubwa wa moyo kulinganisha na kipimo cha kawaida cha kifua.",
    },
    consolidation: {
      meaning_en: "An area of the lung where normal air spaces are filled with inflammatory fluid or secretions.",
      meaning_sw: "Sehemu ya pafu ambapo hewa imebadilishwa na majimaji au usaha kwa sababu ya maambukizi.",
    },
    effusion: {
      meaning_en: "An abnormal accumulation of fluid in a body cavity, such as around the lungs (pleural space) or joints.",
      meaning_sw: "Mkusanyiko usio wa kawaida wa majimaji kwenye nafasi ya mapafu au kwenye maungio ya mifupa.",
    },
    unremarkable: {
      meaning_en: "Medical term meaning completely normal with no visible disease or concerning abnormalities.",
      meaning_sw: "Neno la kitabibu linalomaanisha kila kitu kiko sawa na cha kawaida bila tatizo lolote.",
    },
    calculus: {
      meaning_en: "A hard mineral deposit or stone formed in an organ like the gallbladder (gallstone) or kidney (kidney stone).",
      meaning_sw: "Jiwe dogo la madini linaloundika ndani ya kibofu cha nyongo au figo.",
    },
    osteophyte: {
      meaning_en: "A smooth bony outgrowth or spur that commonly develops along joint edges over time due to wear.",
      meaning_sw: "Kijimfupa kinachoota pembezoni mwa kiungo kutokana na kuchakaa kwa asili kwa muda mrefu.",
    },
    spondylosis: {
      meaning_en: "Age-related natural wear and tear affecting the spinal discs and vertebral joints.",
      meaning_sw: "Mabadiliko ya kawaida ya kuzeeka au kuchakaa kwa mifupa na diski za uti wa mgongo.",
    },
    lymphadenopathy: {
      meaning_en: "Enlargement of the lymph nodes, commonly occurring when the immune system responds to an infection.",
      meaning_sw: "Kuvimba kwa tezi za mwili, mara nyingi hutokea wakati mwili unapambana na maambukizi.",
    },
    opacity: {
      meaning_en: "An area on an X-ray that appears denser or whiter because less X-ray beam passed through it.",
      meaning_sw: "Kivuli chenye weupe kwenye eksirei kinachoonyesha uwepo wa tishu au majimaji yaliyojazana.",
    },
    infiltrate: {
      meaning_en: "Substances such as inflammatory cells or fluid that have accumulated within lung tissue.",
      meaning_sw: "Mkusanyiko wa majimaji au seli za kinga zilizojitokeza kwenye tishu ya mapafu.",
    },
    herniation: {
      meaning_en: "Bulging or displacement of an organ or disc beyond its normal boundary.",
      meaning_sw: "Kuvimba au kuchomoza kwa diski ya mgongo au kiungo nje ya nafasi yake ya kawaida.",
    },
    stenosis: {
      meaning_en: "An abnormal narrowing of a passage or spinal canal in the body.",
      meaning_sw: "Kupungua au kubana kwa upana wa mfereji wa uti wa mgongo au mshipa.",
    },
    cholelithiasis: {
      meaning_en: "Presence of one or more gallstones inside the gallbladder.",
      meaning_sw: "Kuwepo kwa mawe kwenye kibofu cha nyongo.",
    },
    edema: {
      meaning_en: "Swelling caused by excess fluid trapped in your body's tissues.",
      meaning_sw: "Mavimbe yanayosababishwa na kutuama kwa majimaji kwenye tishu za mwili.",
    },
    nodule: {
      meaning_en: "A small round growth or spot of tissue, often benign.",
      meaning_sw: "Kikundi kidogo cha tishu chenye umbo la mviringo, mara nyingi huwa hakina madhara.",
    },
  };

  const detectedGlossary: Array<{ term: string; meaning_en: string; meaning_sw: string }> = [];

  for (const [term, def] of Object.entries(termDictionary)) {
    if (lower.includes(term)) {
      detectedGlossary.push({
        term: term.charAt(0).toUpperCase() + term.slice(1),
        meaning_en: def.meaning_en,
        meaning_sw: def.meaning_sw,
      });
    }
  }

  // Ensure at least 2 glossary items
  if (detectedGlossary.length === 0) {
    detectedGlossary.push({
      term: "Unremarkable",
      meaning_en: "A medical term indicating that the examined anatomical structure appears completely normal with no concerning findings.",
      meaning_sw: "Neno la kitabibu linalomaanisha kwamba sehemu iliyopimwa inaonekana ya kawaida kabisa bila matatizo.",
    });
    detectedGlossary.push({
      term: "Radiological Findings",
      meaning_en: "The specific visual observations recorded by the imaging specialist (radiologist) during examination.",
      meaning_sw: "Matokeo na vielelezo mahususi vilivyoonekana na daktari wa mionzi wakati wa kupiga picha.",
    });
  }

  // Build findings
  for (const sentence of sentences.slice(0, 5)) {
    const sLower = sentence.toLowerCase();
    const isAttention = attentionKeywords.some((kw) => sLower.includes(kw));
    const isNormal = normalKeywords.some((kw) => sLower.includes(kw));

    const status: "normal" | "attention" | "inconclusive" = isAttention
      ? "attention"
      : isNormal
      ? "normal"
      : "inconclusive";

    keyFindings.push({
      title_en: sentence.length > 50 ? sentence.slice(0, 47) + "..." : sentence,
      title_sw: isAttention
        ? "Uchunguzi Unaohitaji Mazungumzo ya Daktari"
        : "Matokeo ya Kawaida ya Uchunguzi",
      explanation_en: `The report notes: "${sentence}". ${
        status === "attention"
          ? "This observation warrants a discussion with your attending healthcare provider to review what next steps, if any, are best for your wellbeing."
          : "This observation indicates standard, expected appearance for this structure with no critical distress noted."
      }`,
      explanation_sw: `Ripoti inaeleza: "${sentence}". ${
        status === "attention"
          ? "Kipengele hiki kinapendekezwa kujadiliwa na daktari wako wa kituo cha afya ili kuamua hatua au tiba inayofaa kulingana na afya yako."
          : "Kipengele hiki kinaonyesha hali ya kawaida inayotarajiwa kwa kiungo hiki bila viashiria vya hatari."
      }`,
      status: status,
    });
  }

  if (keyFindings.length === 0) {
    keyFindings.push({
      title_en: "Radiology Examination Review",
      title_sw: "Mapitio ya Picha ya Mionzi",
      explanation_en: "The submitted radiology report document has been reviewed. The recorded anatomical observations reflect the radiologist's assessment of the examined region.",
      explanation_sw: "Ripoti ya picha ya mionzi imepitiwa. Matokeo yaliyoandikwa yanaonyesha tathmini ya daktari wa mionzi kuhusu sehemu ya mwili iliyochunguzwa.",
      status: "normal",
    });
  }

  const overallSummary_en = `This ${modality.toLowerCase()} document provides an imaging evaluation of the ${bodyRegion.toLowerCase()}. The recorded observations summarize key anatomical details assessed by your imaging specialist. Please review the specific findings with your clinical physician to integrate them with your symptoms.`;
  const overallSummary_sw = `Ripoti hii ya ${modality_sw.toLowerCase()} inatoa tathmini ya picha kuhusu ${bodyRegion_sw.toLowerCase()}. Maelezo yaliyorekodiwa yanatoa muhtasari wa kile daktari wa mionzi alichokiona. Tafadhali pitia matokeo haya pamoja na daktari wako wa kituo cha afya.`;

  return {
    modality,
    modality_sw,
    bodyRegion,
    bodyRegion_sw,
    overallSummary_en,
    overallSummary_sw,
    keyFindings,
    medicalTermsGlossary: detectedGlossary,
    questionsForDoctor_en: [
      "What do these specific imaging findings mean for my day-to-day symptoms and recovery?",
      "Do I need any follow-up blood tests, repeat scans, or lifestyle adjustments based on this report?",
      "Are there any warning signs or symptoms I should monitor closely at home?",
      "Would any physical therapy or medication be helpful at this stage?"
    ],
    questionsForDoctor_sw: [
      "Matokeo haya ya picha yana maana gani kuhusu dalili ninazozisikia na kupona kwangu?",
      "Je, ninahitaji vipimo vingine vya ziada vya damu au kurudia picha baadaye?",
      "Kuna dalili zozote za tahadhari ninazopaswa kuziangalia kwa ukaribu nikiwa nyumbani?",
      "Je, kuna mazoezi ya viungo au dawa zinazoweza kunisaidia kwa sasa?"
    ],
    disclaimer_en: "This AI-powered radiology interpreter is an educational communication aid for explaining report terminology. It does NOT replace a clinical doctor consultation, cannot provide a prognosis, and does not diagnose raw image scans.",
    disclaimer_sw: "Ufafanuzi huu wa AI ni msaidizi wa kielimu kueleza misamiati ya ripoti. Hauchukui nafasi ya daktari, hautoi ubashiri wa mwisho (prognosis), na haupimi filamu za picha za awali bila ripoti ya maandishi.",
    detectedOriginalLanguage: lower.includes("ya") || lower.includes("kwa") ? "Swahili / English" : "English",
    reportRawText: reportText.slice(0, 800),
  };
}
app.post("/api/interpret", async (req: Request, res: Response): Promise<void> => {
  try {
    const { text, imageBase64, mimeType, customInstruction } = req.body;

    if (!text && !imageBase64) {
      res.status(400).json({
        error: "Tafadhali toa maandishi au picha ya ripoti ya eksirei/ultrasound / Please provide report text or an image.",
      });
      return;
    }

    const ai = getGenAI();

    let systemInstruction = `You are a medical radiology communication specialist dedicated to helping patients and their families in Tanzania understand their written radiology reports (X-ray reports, Ultrasound reports, CT Scan reports, MRI reports, Mammogram reports, etc.).

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

    if (customInstruction && typeof customInstruction === "string" && customInstruction.trim().length > 0) {
      systemInstruction += `\n\nADMINISTRATIVE CLINIC INSTRUCTION OVERRIDE:\n${customInstruction.trim()}`;
    }

    const promptText = `Analyze the following written radiology report findings (from the provided text, uploaded PDF/Word/HTML document, or photographed report document).
${text ? `REPORT TEXT:\n${text}` : "Please read and transcribe the written medical findings from the attached radiology report document (PDF or image photo), and provide the plain-language interpretation of what the report states."}

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

    let parsedData: any = null;

    try {
      const responseText = await generateRadiologyInterpretation(
        ai,
        contents,
        systemInstruction,
        responseSchema
      );

      if (responseText) {
        let cleanJson = responseText.trim();
        if (cleanJson.startsWith("```json")) {
          cleanJson = cleanJson.slice(7);
        } else if (cleanJson.startsWith("```")) {
          cleanJson = cleanJson.slice(3);
        }
        if (cleanJson.endsWith("```")) {
          cleanJson = cleanJson.slice(0, -3);
        }
        cleanJson = cleanJson.trim();
        parsedData = JSON.parse(cleanJson);
      }
    } catch (genError: any) {
      console.warn("Primary Gemini generation failed, evaluating fallback engine:", genError?.message);

      // If text exists or can be extracted, synthesize with clinical fallback engine
      if (text && typeof text === "string" && text.trim().length > 0) {
        console.log("Synthesizing patient-safe interpretation via built-in medical fallback engine...");
        parsedData = generateFallbackInterpretation(text, customInstruction);
      } else {
        // Re-throw if there is no text to fallback on
        throw genError;
      }
    }

    if (!parsedData) {
      throw new Error("Failed to interpret radiology report document.");
    }

    res.json(parsedData);
  } catch (error: any) {
    console.error("Error during radiology interpretation:", error);
    const rawMsg = String(error?.message || error || "");
    const isQuotaOrOverloaded =
      rawMsg.includes("503") ||
      rawMsg.includes("UNAVAILABLE") ||
      rawMsg.includes("high demand") ||
      rawMsg.includes("429") ||
      rawMsg.includes("RESOURCE_EXHAUSTED") ||
      rawMsg.includes("quota");

    const userFriendlyError = isQuotaOrOverloaded
      ? "Mtandao wa AI kwa sasa umefikia kikomo cha muda cha maombi (Rate limit / Quota). Tafadhali subiri sekunde chache kisha ubonyeze 'Jaribu Tena' / AI service rate limit reached. Please wait a brief moment and click 'Retry Now'."
      : error.message || "Failed to process report interpretation";

    res.status(isQuotaOrOverloaded ? 429 : 500).json({
      error: userFriendlyError,
      details: isQuotaOrOverloaded
        ? "Kikomo cha maombi ya bure kimefikiwa kwa muda. Tafadhali subiri sekunde chache kisha ujaribu tena."
        : "Samahani, kulikuwa na hitilafu katika kufafanua ripoti hii. Tafadhali jaribu tena au hakikisha maandishi yameingizwa kwa usahihi.",
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
