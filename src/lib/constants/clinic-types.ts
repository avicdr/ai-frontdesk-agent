// src/lib/constants/clinic-types.ts
// Comprehensive clinic types, default services, procedure presets, and AI domain keywords

export type ClinicTypeId =
  | 'dental_clinic'
  | 'dermatology'
  | 'general_practice'
  | 'pediatrics'
  | 'orthopedics'
  | 'ophthalmology'
  | 'ent'
  | 'physiotherapy'
  | 'gynecology'
  | 'mental_health'
  | 'veterinary'
  | 'other';

export interface ServicePreset {
  name: string;
  duration: number; // in minutes
  price: string; // in INR
  isBookable?: boolean;
}

export interface ClinicTypeConfig {
  id: ClinicTypeId;
  label: string;
  icon: string;
  doctorTitle: string;
  defaultClinicName: string;
  specialtyDescription: string;
  defaultGreeting: string;
  defaultServices: ServicePreset[];
  popularPresets: ServicePreset[];
  specialtyKeywords: string;
}

export const CLINIC_TYPES: ClinicTypeConfig[] = [
  {
    id: 'dental_clinic',
    label: 'Dental & Orthodontics',
    icon: '🦷',
    doctorTitle: 'Principal Dentist',
    defaultClinicName: 'Apex Dental & Orthodontics',
    specialtyDescription: 'Dentistry, orthodontics, oral hygiene, and smile care',
    defaultGreeting:
      "Hello! Welcome to Apex Dental & Orthodontics. I'm Aria, your AI receptionist. How can I assist you with your dental care today?",
    defaultServices: [
      { name: 'Routine Dental Consultation & Checkup', duration: 30, price: '500', isBookable: true },
      { name: 'Professional Teeth Cleaning & Scaling', duration: 45, price: '1200', isBookable: true },
      { name: 'Tooth Filling / Cavity Restoration', duration: 45, price: '1500', isBookable: true },
      { name: 'Root Canal Treatment (Initial Visit)', duration: 60, price: '3500', isBookable: true },
      { name: 'Simple Tooth Extraction', duration: 30, price: '1500', isBookable: true },
      { name: 'Emergency Toothache & Pain Relief', duration: 30, price: '800', isBookable: true },
    ],
    popularPresets: [
      { name: 'Invisalign / Braces Consultation', duration: 45, price: '1000' },
      { name: 'Dental Implant Evaluation', duration: 45, price: '2000' },
      { name: 'Teeth Whitening Session', duration: 60, price: '5000' },
      { name: 'Wisdom Tooth Pain Evaluation', duration: 30, price: '800' },
      { name: 'Dental Crown & Bridge Fitting', duration: 45, price: '4500' },
    ],
    specialtyKeywords:
      'teeth, dental, toothache, root canal, cavity, filling, scaling, cleaning, crown, braces, aligners, gums, wisdom tooth, extraction, veneer, oral hygiene',
  },
  {
    id: 'dermatology',
    label: 'Dermatology & Cosmetology',
    icon: '🧴',
    doctorTitle: 'Consultant Dermatologist',
    defaultClinicName: 'Glow Dermatology & Aesthetic Clinic',
    specialtyDescription: 'Skin care, acne treatment, hair restoration, and cosmetic aesthetics',
    defaultGreeting:
      "Hello! Welcome to Glow Dermatology & Aesthetic Clinic. I'm Aria, your AI receptionist. How can I help you with your skin or hair care today?",
    defaultServices: [
      { name: 'General Dermatology Consultation', duration: 30, price: '700', isBookable: true },
      { name: 'Acne & Skin Flare Treatment Consultation', duration: 30, price: '800', isBookable: true },
      { name: 'Hair Loss & Scalp Evaluation (Trichology)', duration: 45, price: '1000', isBookable: true },
      { name: 'Chemical Peel & Glow Treatment', duration: 45, price: '2500', isBookable: true },
      { name: 'Hydra-Facial Deep Cleanse', duration: 60, price: '3500', isBookable: true },
      { name: 'Laser Hair Reduction Consultation', duration: 30, price: '500', isBookable: true },
    ],
    popularPresets: [
      { name: 'PRP Hair Rejuvenation Session', duration: 60, price: '4500' },
      { name: 'Pigmentation & Melasma Therapy', duration: 45, price: '2200' },
      { name: 'Mole / Wart Removal Consultation', duration: 30, price: '1200' },
      { name: 'Anti-Aging & Fine Line Assessment', duration: 30, price: '1500' },
      { name: 'Eczema & Allergy Review', duration: 30, price: '700' },
    ],
    specialtyKeywords:
      'skin, hair, acne, pimples, scalp, hair loss, laser, pigmentation, rash, eczema, allergy, facial, glow, dark spots, warts, botox, fillers, cosmetic, dermatologist',
  },
  {
    id: 'general_practice',
    label: 'General Practice & Family Physician',
    icon: '🩺',
    doctorTitle: 'Consultant Physician',
    defaultClinicName: 'Citycare Family Health Clinic',
    specialtyDescription: 'General health, routine checkups, fever, diabetes, and preventive medicine',
    defaultGreeting:
      "Hello! Welcome to Citycare Family Health Clinic. I'm Aria, your AI receptionist. How can I help schedule a consultation or check clinic timings for you today?",
    defaultServices: [
      { name: 'General Physician Consultation', duration: 20, price: '500', isBookable: true },
      { name: 'Fever, Cold & Flu Assessment', duration: 20, price: '500', isBookable: true },
      { name: 'Diabetes & Hypertension Follow-up', duration: 30, price: '600', isBookable: true },
      { name: 'Comprehensive Health Checkup Review', duration: 45, price: '1200', isBookable: true },
      { name: 'Vaccination & Preventative Care', duration: 20, price: '400', isBookable: true },
      { name: 'Routine Prescription Refill Consultation', duration: 15, price: '350', isBookable: true },
    ],
    popularPresets: [
      { name: 'Thyroid & Metabolic Review', duration: 30, price: '600' },
      { name: 'Senior Citizen Wellness Check', duration: 45, price: '900' },
      { name: 'Post-Infection Recovery Visit', duration: 20, price: '500' },
      { name: 'Pre-Employment Medical Exam', duration: 45, price: '1500' },
      { name: 'Digestive & Gastric Consultation', duration: 30, price: '600' },
    ],
    specialtyKeywords:
      'fever, cough, cold, doctor, checkup, blood pressure, sugar, diabetes, weakness, stomach ache, headache, infection, prescription, lab test, report review, health checkup',
  },
  {
    id: 'pediatrics',
    label: 'Pediatrics & Child Health',
    icon: '👶',
    doctorTitle: 'Consultant Pediatrician',
    defaultClinicName: 'CareKids Pediatric Clinic',
    specialtyDescription: 'Infant care, child vaccinations, growth milestones, and pediatric illnesses',
    defaultGreeting:
      "Hello! Welcome to CareKids Pediatric Clinic. I'm Aria, your AI receptionist. How can I assist you with your child's appointment today?",
    defaultServices: [
      { name: 'Pediatric General Consultation', duration: 20, price: '600', isBookable: true },
      { name: 'Well-Baby Checkup & Growth Assessment', duration: 30, price: '800', isBookable: true },
      { name: 'Childhood Vaccination & Immunization', duration: 20, price: '500', isBookable: true },
      { name: 'Pediatric Fever & Cough Consultation', duration: 20, price: '600', isBookable: true },
      { name: 'Nutrition & Diet Counseling for Kids', duration: 30, price: '750', isBookable: true },
    ],
    popularPresets: [
      { name: 'Newborn 6-Week Follow-up', duration: 30, price: '800' },
      { name: 'Child Allergy & Asthma Evaluation', duration: 30, price: '900' },
      { name: 'Developmental Milestones Check', duration: 40, price: '1000' },
      { name: 'School Health Clearance Certificate', duration: 20, price: '500' },
    ],
    specialtyKeywords:
      'baby, child, kid, infant, vaccination, vaccine, fever, pediatrician, cold, teething, growth, height, weight, rash, immunization, nutrition',
  },
  {
    id: 'orthopedics',
    label: 'Orthopedics & Joint Care',
    icon: '🦴',
    doctorTitle: 'Orthopedic Specialist',
    defaultClinicName: 'ActiveLife Orthopedics & Joint Clinic',
    specialtyDescription: 'Joint pain, spine care, bone fractures, and sports injuries',
    defaultGreeting:
      "Hello! Welcome to ActiveLife Orthopedics & Joint Clinic. I'm Aria, your AI receptionist. How can I assist you with your joint or bone health today?",
    defaultServices: [
      { name: 'Orthopedic Consultation (Knee/Back/Joint)', duration: 30, price: '800', isBookable: true },
      { name: 'Knee Arthritis & Joint Pain Evaluation', duration: 30, price: '800', isBookable: true },
      { name: 'Spine & Back Pain Consultation', duration: 30, price: '900', isBookable: true },
      { name: 'Sports Injury & Sprain Assessment', duration: 30, price: '800', isBookable: true },
      { name: 'Post-Surgery / Plaster Removal Follow-up', duration: 20, price: '500', isBookable: true },
    ],
    popularPresets: [
      { name: 'Shoulder Impingement / Frozen Shoulder Exam', duration: 30, price: '800' },
      { name: 'Joint Lubrication Injection Consultation', duration: 30, price: '1200' },
      { name: 'Bone Mineral Density Review (Osteoporosis)', duration: 30, price: '700' },
      { name: 'Ligament Tear (ACL/Meniscus) Consultation', duration: 40, price: '1000' },
    ],
    specialtyKeywords:
      'bone, joint, knee, back pain, spine, fracture, sprain, shoulder, neck pain, orthopedic, ligament, arthritis, plaster, x-ray, sports injury',
  },
  {
    id: 'ophthalmology',
    label: 'Ophthalmology & Eye Care',
    icon: '👁️',
    doctorTitle: 'Consultant Ophthalmologist',
    defaultClinicName: 'ClearVision Eye Care & Laser Clinic',
    specialtyDescription: 'Vision exams, cataract evaluation, retina checks, and glasses prescriptions',
    defaultGreeting:
      "Hello! Welcome to ClearVision Eye Care & Laser Clinic. I'm Aria, your AI receptionist. How can I assist you with your eye care appointment today?",
    defaultServices: [
      { name: 'Comprehensive Eye Examination & Vision Test', duration: 30, price: '600', isBookable: true },
      { name: 'Refraction & Glasses Prescription', duration: 20, price: '400', isBookable: true },
      { name: 'Cataract Pre-Surgery Evaluation', duration: 45, price: '1000', isBookable: true },
      { name: 'Dry Eye & Digital Strain Consultation', duration: 30, price: '600', isBookable: true },
      { name: 'Glaucoma & Eye Pressure Screening', duration: 30, price: '800', isBookable: true },
    ],
    popularPresets: [
      { name: 'LASIK / Refractive Surgery Consultation', duration: 45, price: '1200' },
      { name: 'Diabetic Retinopathy Screening', duration: 40, price: '1000' },
      { name: 'Contact Lens Fitting & Trial', duration: 30, price: '600' },
      { name: 'Red Eye & Eye Infection Checkup', duration: 20, price: '500' },
    ],
    specialtyKeywords:
      'eye, vision, glasses, spectacle, cataract, lasik, retina, blurry, red eye, itching, eye drops, lens, glaucoma, ophthalmologist',
  },
  {
    id: 'ent',
    label: 'ENT (Ear, Nose & Throat)',
    icon: '👂',
    doctorTitle: 'Consultant ENT Specialist',
    defaultClinicName: 'Apex ENT & Sinus Care Clinic',
    specialtyDescription: 'Hearing tests, sinusitis treatment, ear wax clearing, and voice care',
    defaultGreeting:
      "Hello! Welcome to Apex ENT & Sinus Care Clinic. I'm Aria, your AI receptionist. How can I assist with your ear, nose, or throat consultation today?",
    defaultServices: [
      { name: 'ENT Specialist Consultation', duration: 20, price: '600', isBookable: true },
      { name: 'Ear Wax Microsuction / Irrigation', duration: 30, price: '1000', isBookable: true },
      { name: 'Sinusitis & Allergy Evaluation', duration: 25, price: '700', isBookable: true },
      { name: 'Throat Pain & Tonsil Assessment', duration: 20, price: '600', isBookable: true },
      { name: 'Hearing Screening Consultation', duration: 30, price: '800', isBookable: true },
    ],
    popularPresets: [
      { name: 'Tinnitus & Ear Ringing Consultation', duration: 30, price: '800' },
      { name: 'Deviated Septum (DNS) Evaluation', duration: 30, price: '900' },
      { name: 'Snoring & Sleep Apnea Checkup', duration: 40, price: '1200' },
      { name: 'Dizziness & Vertigo Evaluation', duration: 35, price: '900' },
    ],
    specialtyKeywords:
      'ear, nose, throat, ent, sinus, hearing, ear wax, tonsils, voice, hoarse, dizziness, vertigo, sniffing, blocked ear, snoring, tinnitus',
  },
  {
    id: 'physiotherapy',
    label: 'Physiotherapy & Sports Rehab',
    icon: '🏃',
    doctorTitle: 'Chief Physiotherapist',
    defaultClinicName: 'Revive Physiotherapy & Sports Rehabilitation',
    specialtyDescription: 'Physical therapy, post-op rehabilitation, pain management, and mobility',
    defaultGreeting:
      "Hello! Welcome to Revive Physiotherapy & Sports Rehabilitation. I'm Aria, your AI receptionist. How can I assist you with scheduling your therapy session today?",
    defaultServices: [
      { name: 'Initial Physiotherapy Assessment & Plan', duration: 45, price: '800', isBookable: true },
      { name: 'Back & Neck Pain Physiotherapy Session', duration: 45, price: '700', isBookable: true },
      { name: 'Post-Surgery / Fracture Rehab Session', duration: 50, price: '900', isBookable: true },
      { name: 'Sports Injury Therapy & Dry Needling', duration: 45, price: '1000', isBookable: true },
      { name: 'Elderly Mobility & Balance Therapy', duration: 40, price: '650', isBookable: true },
    ],
    popularPresets: [
      { name: 'Sciatica & Nerve Compression Relief', duration: 45, price: '800' },
      { name: 'Knee Osteoarthritis Rehab Session', duration: 45, price: '700' },
      { name: 'Post-Stroke Neurological Rehab', duration: 60, price: '1200' },
      { name: 'Ergonomic & Postural Correction', duration: 30, price: '600' },
    ],
    specialtyKeywords:
      'physio, physiotherapy, rehabilitation, rehab, posture, exercise, physical therapy, stiffness, spasm, sciatica, mobility, dry needling, massage, stretching',
  },
  {
    id: 'gynecology',
    label: "Gynecology & Women's Health",
    icon: '🌸',
    doctorTitle: 'Consultant Gynecologist & Obstetrician',
    defaultClinicName: "Aura Women's Wellness & Maternity Clinic",
    specialtyDescription: "Women's health, pregnancy care, menstrual wellness, and PCOD/PCOS",
    defaultGreeting:
      "Hello! Welcome to Aura Women's Wellness & Maternity Clinic. I'm Aria, your AI receptionist. How can I assist you with your appointment today?",
    defaultServices: [
      { name: 'Routine Gynecological Consultation', duration: 30, price: '800', isBookable: true },
      { name: 'Antenatal / Pregnancy Routine Checkup', duration: 30, price: '800', isBookable: true },
      { name: 'PCOS / PCOD Evaluation & Counseling', duration: 40, price: '1000', isBookable: true },
      { name: 'Menstrual Irregularity & Hormonal Review', duration: 30, price: '750', isBookable: true },
      { name: 'Pap Smear & Cervical Screening Visit', duration: 30, price: '1500', isBookable: true },
    ],
    popularPresets: [
      { name: 'Pre-Conception / Fertility Counseling', duration: 45, price: '1200' },
      { name: 'First Trimester Pregnancy Scan Review', duration: 30, price: '900' },
      { name: 'Menopause Wellness Consultation', duration: 35, price: '850' },
      { name: 'Contraception & Family Planning Guidance', duration: 30, price: '700' },
    ],
    specialtyKeywords:
      'pregnancy, pregnant, gynecologist, periods, pcos, pcod, menstrual, cramps, delivery, ultrasound, scan, fertility, baby, cervical, hormonal, uterus',
  },
  {
    id: 'mental_health',
    label: 'Psychiatry & Mental Wellness',
    icon: '🧠',
    doctorTitle: 'Consultant Psychiatrist / Psychologist',
    defaultClinicName: 'MindWell Psychiatry & Behavioral Clinic',
    specialtyDescription: 'Therapy, anxiety, depression, sleep disorders, and emotional wellness',
    defaultGreeting:
      "Hello! Welcome to MindWell Psychiatry & Behavioral Clinic. I'm Aria, your AI receptionist. How can I assist you with booking a confidential session today?",
    defaultServices: [
      { name: 'Initial Psychiatric Evaluation', duration: 50, price: '1500', isBookable: true },
      { name: 'Follow-up Psychiatric Consultation', duration: 30, price: '900', isBookable: true },
      { name: 'Clinical Psychology & Counseling Session', duration: 50, price: '1500', isBookable: true },
      { name: 'Anxiety & Stress Management Consultation', duration: 45, price: '1200', isBookable: true },
      { name: 'Sleep & Insomnia Consultation', duration: 30, price: '1000', isBookable: true },
    ],
    popularPresets: [
      { name: 'Depression Assessment & Care Plan', duration: 50, price: '1500' },
      { name: 'Adult ADHD Evaluation', duration: 60, price: '2000' },
      { name: 'Relationship & Couples Therapy', duration: 60, price: '2500' },
      { name: 'Workplace Burnout Counseling', duration: 45, price: '1200' },
    ],
    specialtyKeywords:
      'mental health, therapy, psychiatrist, psychologist, counseling, anxiety, stress, depression, insomnia, sleep, panic, adhd, mood, burnout, counselor',
  },
  {
    id: 'veterinary',
    label: 'Veterinary & Pet Care',
    icon: '🐾',
    doctorTitle: 'Chief Veterinary Surgeon',
    defaultClinicName: 'HappyPaws Veterinary & Pet Clinic',
    specialtyDescription: 'Pet health, animal vaccinations, surgery, dental, and preventive care',
    defaultGreeting:
      "Hello! Welcome to HappyPaws Veterinary Clinic. I'm Aria, your AI receptionist. How can I assist with your pet's appointment or wellness checkup today?",
    defaultServices: [
      { name: 'General Pet Wellness Exam & Consultation', duration: 25, price: '600', isBookable: true },
      { name: 'Pet Vaccination & Deworming Session', duration: 20, price: '500', isBookable: true },
      { name: 'Sick Pet (Vomiting/Fever/Lethargy) Checkup', duration: 30, price: '700', isBookable: true },
      { name: 'Pet Skin, Flea & Tick Treatment Consultation', duration: 25, price: '650', isBookable: true },
      { name: 'Pet Dental Scaling & Oral Checkup', duration: 45, price: '2000', isBookable: true },
    ],
    popularPresets: [
      { name: 'Puppy / Kitten 1st Health Check & Passport', duration: 30, price: '800' },
      { name: 'Pet Blood Test & Diagnostic Review', duration: 30, price: '1200' },
      { name: 'Neutering / Spaying Pre-Surgical Consultation', duration: 30, price: '800' },
      { name: 'Pet Wound Dressing & Follow-up', duration: 20, price: '450' },
    ],
    specialtyKeywords:
      'pet, dog, cat, puppy, kitten, veterinary, vet, animal, rabies, vaccination, deworming, vomiting, barking, scratching, tick, flea, paws',
  },
  {
    id: 'other',
    label: 'Multi-Specialty & General Healthcare',
    icon: '🏥',
    doctorTitle: 'Chief Medical Officer',
    defaultClinicName: 'Lifeline Healthcare & Multi-Specialty Clinic',
    specialtyDescription: 'Comprehensive outpatient care, consultations, and medical diagnostics',
    defaultGreeting:
      "Hello! Welcome to Lifeline Healthcare Clinic. I'm Aria, your AI receptionist. How can I help schedule a consultation or assist you today?",
    defaultServices: [
      { name: 'Doctor Consultation (First Visit)', duration: 30, price: '600', isBookable: true },
      { name: 'Follow-up Consultation', duration: 20, price: '400', isBookable: true },
      { name: 'Routine Health Screening', duration: 45, price: '1200', isBookable: true },
      { name: 'Diagnostic Report Review Consultation', duration: 20, price: '350', isBookable: true },
      { name: 'Minor Procedure / Dressing', duration: 30, price: '750', isBookable: true },
    ],
    popularPresets: [
      { name: 'Full Body Wellness Package Review', duration: 45, price: '1800' },
      { name: 'Specialist Referral Evaluation', duration: 30, price: '800' },
      { name: 'Lifestyle & Preventative Health Consultation', duration: 30, price: '600' },
      { name: 'Medical Fitness Certificate Exam', duration: 25, price: '500' },
    ],
    specialtyKeywords:
      'doctor, appointment, clinic, consultation, medicine, prescription, report, lab test, checkup, timing, address, fees, slots, availability',
  },
];

export function getClinicTypeConfig(typeId?: string | null): ClinicTypeConfig {
  const found = CLINIC_TYPES.find((c) => c.id === typeId);
  return found || CLINIC_TYPES[0]; // fallback to dental
}
