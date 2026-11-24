export type ManufacturerGroup = 'VAG' | 'STELLANTIS' | 'EU_OTHER' | 'US' | 'JP';

export type OriginRegion = 'EU' | 'US' | 'JP';

export type BodyArchetype =
  | 'hatchback'
  | 'sedan'
  | 'coupe'
  | 'wagon'
  | 'suv'
  | 'muscle'
  | 'jdm';

export type EuroClass =
  | 'EURO_0'
  | 'EURO_1'
  | 'EURO_2'
  | 'EURO_3'
  | 'EURO_4'
  | 'EURO_5'
  | 'EURO_6'
  | 'EURO_7';

export type VerdictTier = 'hall_of_fame' | 'solid' | 'hall_of_shame';

export type FuelType = 'Diesel' | 'Benzina' | 'Ibrido' | 'Elettrico' | 'GPL/Metano';

export type HotspotKey = 'engine' | 'wheels' | 'exhaust' | 'suspension';

export type RimStyleId =
  | 'oem_5spoke'
  | 'bbs_multispoke'
  | 'detroit_gti'
  | 'oz_ultraleggera'
  | 'pretoria_10spoke'
  | 'rotor_audi'
  | 'deep_dish';

export interface VisualModsConfig {
  exhaustStyle: 'stock' | 'r32_center' | 'quad';
  lowered: boolean;
  spoiler: boolean;
  rimStyle: RimStyleId;
  rimFinish: 'silver' | 'anthracite' | 'black' | 'gold' | 'bronze';
  rimInches: 16 | 17 | 18 | 19 | 20;
  bremboCalipers: boolean;
  caliperColor: 'stock' | 'red' | 'yellow' | 'blue' | 'lime';
  tintedGlass: boolean;
}

export const DEFAULT_VISUAL_MODS: VisualModsConfig = {
  exhaustStyle: 'stock',
  lowered: false,
  spoiler: false,
  rimStyle: 'oem_5spoke',
  rimFinish: 'silver',
  rimInches: 17,
  bremboCalipers: false,
  caliperColor: 'stock',
  tintedGlass: false,
};

export interface EngineCodeVariant {
  code: string;
  powerHp: string;
  years: string;
  models?: string;
  status: 'recommended' | 'caution' | 'avoid';
  note: string;
}

export interface MaintenanceMilestone {
  id: string;
  kmThreshold: number;
  componentName: string;
  severity: 'info' | 'warning' | 'critical';
  whatItIs: string;
  symptoms: string;
  estimatedCostEur: string;
  preventionAndMods: string;
}

export interface CuratedRecall {
  id: string;
  date: string;
  component: string;
  summary: string;
  remedy: string;
  region: 'EU' | 'US';
}

export interface EngineWiki {
  id: string;
  code: string;
  familyName: string;
  group: ManufacturerGroup;
  fuelType: FuelType;
  verdictTier: VerdictTier;
  reliabilityScore: number; // 0-100
  tagline: string;
  ironicSummary: string;
  forumConsensus: string;
  tuningPotential: string;
  engineCodes: EngineCodeVariant[];
  hotspotNotes: Record<HotspotKey, string>;
  milestones: MaintenanceMilestone[];
  euRecalls: CuratedRecall[];
}

export interface VehicleModel {
  id: string;
  brand: string;
  group: ManufacturerGroup;
  originRegion: OriginRegion;
  model: string;
  generation: string;
  years: string;
  bodyArchetype: BodyArchetype;
  euroClass: EuroClass;
  engineId: string;
  powerHp: number;
  torqueNm: number;
  defaultColor: string;
  nhtsaMake: string;
  nhtsaModel: string;
  nhtsaYear: number;
  highlightNote: string;
}

export interface EuroStandardGuide {
  id: EuroClass;
  label: string;
  yearIntroduced: number;
  ironicTagline: string;
  summary: string;
  coIndex: number;
  noxIndex: number;
  pmIndex: number;
  hardwareIntroduced: string[];
  reliabilitySideEffects: string;
  ztlItalyStatus: string;
  buyingAdvice: string;
  exampleEngineIds: string[];
}

export type ModCategory =
  | 'stage'
  | 'exhaust'
  | 'suspension'
  | 'intake'
  | 'brakes'
  | 'aesthetic';

export interface RealModSpec {
  id: string;
  name: string;
  category: ModCategory;
  compatibleLabel: string;
  compatibleGroups: ManufacturerGroup[];
  compatibleFuels: FuelType[];
  recommendedEngineIds?: string[];
  hpGainMin: number;
  hpGainMax: number;
  nmGainMin: number;
  nmGainMax: number;
  zeroToHundredDeltaSec: number;
  estimatedCostEur: string;
  whatChangesSummary: string;
  soundImpact: string;
  performanceImpact: string;
  reliabilityImpact: string;
  legalityItaly: string;
  visualPatch?: Partial<VisualModsConfig>;
}

export type MaintenanceCategory =
  | 'engine_timing'
  | 'transmission'
  | 'brakes'
  | 'suspension_tires'
  | 'cooling_ac'
  | 'electrical'
  | 'legal_body';

export interface CategoryMaintenanceTask {
  id: string;
  category: MaintenanceCategory;
  title: string;
  intervalKm: number;
  intervalMonths?: number;
  severity: 'info' | 'warning' | 'critical';
  whatItIs: string;
  symptoms: string;
  ifIgnored: string;
  estimatedCostEur: string;
  preventionTip: string;
  appliesToFuels?: FuelType[];
  appliesToTransmissions?: GarageCar['transmission'][];
}

export interface MaintenanceLogEntry {
  id: string;
  taskId: string;
  taskTitle: string;
  completedAtKm: number;
  completedDate: string;
  costEur?: number;
  notes?: string;
}

export interface ModEntry {
  id: string;
  modSpecId?: string;
  category: ModCategory;
  title: string;
  notes: string;
  installedAtKm: number;
  createdAt: string;
}

export interface CarPhoto {
  id: string;
  dataUrl: string;
  cutoutSucceeded?: boolean;
  dominantColorHex?: string;
  detectedRimFinish?: VisualModsConfig['rimFinish'];
  detectedRimStyle?: RimStyleId;
  detectedStance?: 'stock' | 'lowered';
  aiConfidence: number;
  aiLabel: string;
  caption: string;
  createdAt: string;
}

export interface GarageCar {
  id: string;
  vehicleId: string;
  nickname: string;
  customColorHex: string;
  currentKm: number;
  transmission: 'Manuale' | 'Automatico' | 'DSG / Doppia Frizione' | 'Automatico AT' | 'CVT / e-CVT' | 'Elettrico Direct';
  visualMods?: VisualModsConfig;
  maintenanceLogs?: MaintenanceLogEntry[];
  mods: ModEntry[];
  photos: CarPhoto[];
  primaryPhotoId?: string;
  createdAt: string;
}

export interface BuildComment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface CommunityBuild {
  id: string;
  authorHandle: string;
  vehicleId: string;
  title: string;
  summary: string;
  powerLabel: string;
  kmOnClock: number;
  mods: string[];
  modIds?: string[];
  visualMods?: Partial<VisualModsConfig>;
  upvotes: number;
  userUpvoted?: boolean;
  tags: string[];
  comments: BuildComment[];
  createdAt: string;
}

export interface RecallItem {
  id: string;
  source: 'NHTSA_LIVE' | 'EU_CURATED';
  date: string;
  component: string;
  summary: string;
  remedy: string;
}

export type AppRoute = 'showroom' | 'garage' | 'simulator' | 'wiki' | 'euro' | 'community';
