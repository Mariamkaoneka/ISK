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
  },
  {
    id: 'mri-lumbar',
    title_en: 'Lumbar Spine MRI Report - Back Pain',
    title_sw: 'Ripoti ya MRI ya Mgongo wa Chini - Maumivu ya Kiuno',
    category: 'MRI Report',
    description_en: 'Sample written report document evaluating lumbar vertebrae and disc findings.',
    description_sw: 'Mfano wa ripoti ya maandishi ya daktari inayoelezea matokeo ya MRI ya mgongo.',
    text: `EXAMINATION: MRI OF LUMBAR SPINE (WITHOUT CONTRAST)
CLINICAL HISTORY: 52-year-old with chronic lower back pain radiating down the posterior left thigh and calf.

FINDINGS:
- Alignment of lumbar spine is preserved with mild loss of physiological lumbar lordosis.
- Vertebral body heights and marrow signals are preserved.
- L1-L2, L2-L3, L3-L4: Normal intervertebral disc heights and signals. No significant disc bulge or canal stenosis.
- L4-L5: Moderate disc desiccation with mild broad-based posterior disc bulge causing mild bilateral neural foraminal narrowing without substantial central canal stenosis.
- L5-S1: Marked disc height loss and T2 disc signal reduction. Posterior left paracentral disc protrusion measuring approx 4.5 mm compressing the traversing left S1 nerve root.
- Conus medullaris terminates normally at L1 level with normal signal intensity.

IMPRESSION:
1. L5-S1 left paracentral disc herniation with impingement on the left S1 nerve root.
2. Mild degenerative disc disease at L4-L5.`
  },
  {
    id: 'knee-xray',
    title_en: 'Knee Radiograph Report - Joint Stiffness',
    title_sw: 'Ripoti ya X-Ray ya Goti - Maumivu na Kukaza',
    category: 'X-Ray Report',
    description_en: 'Sample written report document evaluating joint space and cartilage.',
    description_sw: 'Mfano wa ripoti ya maandishi ya daktari kuhusu uchakavu wa viungo.',
    text: `EXAMINATION: RIGHT KNEE AP AND LATERAL RADIOGRAPHS (WEIGHT-BEARING)
INDICATION: 61-year-old with progressive right knee pain on walking and morning stiffness.

FINDINGS:
- Mild to moderate asymmetric joint space narrowing in the medial femorotibial compartment.
- Subchondral sclerosis and marginal osteophyte formation along the medial tibial plateau and medial femoral condyle.
- Lateral compartment and patellofemoral joint spaces are relatively well preserved.
- No evidence of acute fracture, dislocation, or joint effusion.
- Surrounding periarticular soft tissues are intact.

IMPRESSION:
Moderate medial compartment osteoarthritis of the right knee. No acute osseous injury.`
  }
];
