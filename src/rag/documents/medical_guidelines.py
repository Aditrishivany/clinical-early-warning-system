"""
File: src/rag/documents/medical_guidelines.py
Purpose: Medical knowledge base for RAG system
"""

# These are simplified clinical guidelines
# In production: load real PDF guidelines

MEDICAL_GUIDELINES = [
    {
        "id": "NEWS2-001",
        "title": "NEWS2 Score Guide",
        "category": "Early Warning",
        "content": """
        NEWS2 (National Early Warning Score 2) is the standard 
        clinical scoring system used in hospitals to detect 
        patient deterioration.

        Scoring:
        - Score 0-4: LOW risk. Routine monitoring every 4-6 hours.
        - Score 5-6: MEDIUM risk. Urgent review within 30 minutes.
        - Score 7+:  HIGH risk. Emergency review IMMEDIATELY.

        Parameters scored:
        1. Respiratory Rate
        2. Oxygen Saturation (SpO2)
        3. Systolic Blood Pressure
        4. Heart Rate
        5. Consciousness (AVPU)
        6. Temperature

        A score of 3 in any single parameter triggers urgent review.
        NEWS2 should be calculated at every observation.
        """
    },
    {
        "id": "SEPSIS-001",
        "title": "Sepsis Recognition and Management",
        "category": "Sepsis",
        "content": """
        Sepsis is a life-threatening organ dysfunction caused by 
        a dysregulated host response to infection.

        SIRS Criteria (2 or more = suspect sepsis):
        - Temperature >38.3°C or <36°C
        - Heart Rate >90 bpm
        - Respiratory Rate >20/min
        - White Blood Cell Count >12,000 or <4,000

        Sepsis-3 Definition:
        - Suspected infection + organ dysfunction
        - SOFA score increase of 2 or more

        Septic Shock:
        - Sepsis + vasopressor requirement
        - Lactate >2 mmol/L despite fluid resuscitation

        THE SEPSIS SIX (complete within 1 hour):
        1. Give high flow oxygen
        2. Take blood cultures
        3. Give IV antibiotics
        4. Give IV fluid challenge
        5. Check serial lactates
        6. Monitor urine output (catheterise)

        Mortality increases 7% for every hour antibiotic delay.
        """
    },
    {
        "id": "RESP-001",
        "title": "Respiratory Distress Management",
        "category": "Respiratory",
        "content": """
        Respiratory distress is a medical emergency requiring 
        immediate assessment and intervention.

        Key Parameters:
        - Normal RR: 12-20 breaths/min
        - Normal SpO2: 95-100%
        - Target SpO2: >94% (88-92% for COPD patients)

        Classification:
        - Mild: RR 20-25, SpO2 90-94%
        - Moderate: RR 25-30, SpO2 85-90%
        - Severe: RR >30, SpO2 <85%

        Management Steps:
        1. Sit patient upright
        2. Apply oxygen:
           - Mild: 2-4L via nasal cannula
           - Moderate: 5-10L via face mask
           - Severe: 15L via non-rebreathe mask
        3. Call for senior help if SpO2 <92%
        4. Consider NIV/CPAP if not improving
        5. Prepare for intubation if deteriorating

        Red Flags:
        - SpO2 <85% despite oxygen
        - Exhaustion/silent chest
        - Altered consciousness
        - Cyanosis
        """
    },
    {
        "id": "CARDIAC-001",
        "title": "Cardiac Emergency Protocols",
        "category": "Cardiac",
        "content": """
        Cardiac emergencies require immediate recognition 
        and intervention to prevent death.

        Tachycardia (HR >100):
        - Mild (100-120): Monitor, find cause
        - Moderate (120-150): ECG, consider treatment
        - Severe (>150): Emergency treatment needed

        Bradycardia (HR <60):
        - With symptoms: Atropine 500mcg IV
        - No symptoms: Monitor closely

        Hypotension (SBP <90):
        - IV access x2 large bore
        - Fluid challenge: 250-500ml crystalloid
        - If no response: vasopressors
        - Identify and treat cause

        Shock Index (HR/SBP):
        - Normal: 0.5-0.7
        - Mildly abnormal: 0.7-1.0
        - Abnormal: >1.0 (consider shock)

        Cardiac Arrest:
        - Call arrest team immediately
        - Start CPR: 30 compressions : 2 breaths
        - Attach defibrillator ASAP
        - Follow ALS algorithm
        """
    },
    {
        "id": "FLUID-001",
        "title": "Fluid Management Guidelines",
        "category": "Fluid Management",
        "content": """
        Appropriate fluid management is critical in 
        acutely ill patients.

        Assessment of Fluid Status:
        - Hypovolaemia signs: tachycardia, hypotension, 
          reduced urine output, dry mucous membranes
        - Normal urine output: 0.5ml/kg/hour (>30ml/hour)
        - Oliguria: <0.5ml/kg/hour

        Fluid Resuscitation:
        - Bolus: 250-500ml crystalloid over 15-30 mins
        - Reassess after each bolus
        - Maximum: 30ml/kg in sepsis

        Types of IV Fluids:
        - 0.9% NaCl: First line resuscitation
        - Hartmann's: Maintenance and resuscitation
        - Colloids: Specific indications only
        - Blood: Hb <70-80 g/L or haemorrhage

        Monitoring:
        - Urine output hourly
        - BP every 15-30 mins during resuscitation
        - Reassess fluid balance every 4-6 hours
        """
    },
    {
        "id": "NEURO-001",
        "title": "Neurological Assessment Guidelines",
        "category": "Neurology",
        "content": """
        Neurological assessment is essential in detecting 
        brain dysfunction and altered consciousness.

        AVPU Scale:
        - A (Alert): Fully conscious, normal
        - V (Voice): Responds to voice commands
        - P (Pain): Only responds to pain stimuli
        - U (Unresponsive): No response to any stimulus

        Glasgow Coma Scale (GCS):
        - Eyes: 1-4 points
        - Verbal: 1-5 points
        - Motor: 1-6 points
        - Total: 3-15 (15 = normal, <8 = severe)

        GCS <8: Consider airway protection
        AVPU = P or U: Equivalent to GCS <9

        Causes of Altered Consciousness:
        - Metabolic: hypoglycaemia, electrolytes
        - Structural: stroke, bleed, tumour
        - Infective: meningitis, encephalitis
        - Toxic: drugs, alcohol
        - Hypoxia/hypercapnia

        Always check glucose in any confused patient!
        """
    },
    {
        "id": "TRIAGE-001",
        "title": "Hospital Triage Protocols",
        "category": "Triage",
        "content": """
        Triage is the process of sorting patients based on 
        urgency of their condition.

        Priority Levels:
        P1 - IMMEDIATE (Red):
        - Life threatening condition
        - Needs treatment within minutes
        - Examples: cardiac arrest, severe sepsis, 
          major trauma, airway compromise

        P2 - URGENT (Orange):
        - Serious but stable condition
        - Treatment within 30 minutes
        - Examples: chest pain, moderate respiratory distress,
          fractured bones, altered consciousness

        P3 - SEMI-URGENT (Yellow):
        - Stable condition
        - Treatment within 2 hours
        - Examples: moderate pain, minor infections,
          stable vital signs with single abnormality

        P4 - ROUTINE (Green):
        - Non-urgent condition
        - Treatment within 4-6 hours
        - Examples: minor wounds, routine medications,
          stable chronic conditions

        NEWS2 and Triage:
        - NEWS2 7+: Always P1
        - NEWS2 5-6: P2
        - NEWS2 3-4: P3
        - NEWS2 0-2: P4
        """
    },
]