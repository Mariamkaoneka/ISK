import { SampleReport } from '../types';

export const SAMPLE_REPORTS: SampleReport[] = [
  {
    id: 'chest-xray-1',
    title_en: 'Chest X-Ray Report - Cough & Fever',
    title_sw: 'Ripoti ya X-Ray ya Kifua - Kikohozi na Homa',
    category: 'X-Ray Report',
    description_en: 'Sample written report document showing right lower lobe findings.',
    description_sw: 'Mfano wa ripoti ya maandishi ya daktari kuhusu maambukizi madogo ya pafu.',
    text: `EXAMINATION: CHEST RADIOGRAPH (PA VIEW)
PATIENT INDICATION: 34-year-old presenting with 4-day history of productive cough, fever, and right-sided pleuritic chest discomfort.

FINDINGS:
- Trachea is midline. Cardiothoracic ratio is within normal limits (<50%).
- A focal patchy alveolar opacity is identified in the right lower lung zone.
- Left lung field is clear with normal vascular markings.
- Costophrenic and cardiophrenic angles are sharp; no pleural effusion seen.
- Thoracic skeletal framework and soft tissues unremarkable.

IMPRESSION:
Focal consolidation in the right lower lobe, most consistent with community-acquired pneumonia. Recommend clinical correlation with treating physician.`
  },
  {
    id: 'ultrasound-abdo',
    title_en: 'Abdominal Ultrasound Report - RUQ Pain',
    title_sw: 'Ripoti ya Ultrasound ya Tumbo - Maumivu ya Kulia',
    category: 'Ultrasound Report',
    description_en: 'Sample written report document detailing liver and gallbladder findings.',
    description_sw: 'Mfano wa ripoti ya maandishi ya daktari ya vipimo vya ultrasound ya tumbo.',
    text: `EXAMINATION: ABDOMINAL ULTRASONOGRAPHY
CLINICAL NOTES: 46-year-old with recurrent postprandial epigastric and right hypochondriac discomfort.

FINDINGS:
- LIVER: Normal in size (14.2 cm span). Mild diffuse increased parenchymal echogenicity consistent with grade 1 hepatic steatosis (mild fatty liver). No focal hepatic mass or cyst.
- GALLBLADDER: Well distended. Wall thickness normal at 2.4 mm. Two mobile hyperechoic foci measuring 4mm and 6mm with posterior acoustic shadowing noted in the gallbladder lumen. No pericholecystic fluid.
- BILE DUCTS: Common bile duct measures 4.1 mm (normal calibre).
- PANCREAS & SPLEEN: Visualized portions appear normal in size and echotexture.
- KIDNEYS: Both kidneys show normal bipolar lengths (Right: 10.4 cm, Left: 10.8 cm) with preserved corticomedullary differentiation. No hydronephrosis or renal calculi.

IMPRESSION:
1. Cholelithiasis (small gallstones without sonographic signs of acute cholecystitis).
2. Mild diffuse hepatic steatosis.`
  }
];
