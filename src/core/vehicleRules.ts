import type { ManufacturerGroup } from './types';

/**
 * Elenco rigoroso di brand cinesi o joint-venture controllate da costruttori cinesi.
 * CarFix esclude tassativamente i costruttori cinesi dal catalogo, dallo showroom e dalla Wiki.
 */
export const CHINESE_BRANDS_BLOCKLIST = new Set<string>([
  'byd',
  'mg',
  'mg motor',
  'morris garages',
  'geely',
  'chery',
  'omoda',
  'jaecoo',
  'dr',
  'dr automobiles',
  'evo',
  'sportequipe',
  'ich-x',
  'tiger',
  'leapmotor',
  'lynk & co',
  'lynk&co',
  'nio',
  'xpeng',
  'zeekr',
  'gwm',
  'great wall',
  'haval',
  'ora',
  'wey',
  'dongfeng',
  'changan',
  'baic',
  'gac',
  'seres',
  'dfsk',
  'aiways',
  'hongqi',
  'maxus',
  'voyah',
  'swm',
  'cirelli',
  'emc',
  'jac',
  'foton',
  'saic',
  'roewe',
  'neta',
  'arcfox',
  'avatr',
  'forthing',
  'xev',
  'polestar',
  'lotus',
]);

export function normalizeBrandKey(brand: string): string {
  return brand.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function isAllowedBrand(brand: string): boolean {
  const key = normalizeBrandKey(brand);
  if (!key) return false;
  if (CHINESE_BRANDS_BLOCKLIST.has(key)) return false;

  for (const blocked of CHINESE_BRANDS_BLOCKLIST) {
    if (key === blocked || key.startsWith(`${blocked} `)) {
      return false;
    }
  }
  return true;
}

export function filterAllowedVehicles<T extends { brand: string }>(items: T[]): T[] {
  return items.filter((item) => isAllowedBrand(item.brand));
}

export const GROUP_LABELS: Record<ManufacturerGroup, { label: string; badge: string; description: string }> = {
  VAG: {
    label: 'Gruppo VAG',
    badge: 'VAG',
    description: 'Volkswagen, Audi, SEAT, CUPRA, Škoda, Porsche, Lamborghini, Bentley, Bugatti',
  },
  STELLANTIS: {
    label: 'Stellantis',
    badge: 'STLA',
    description: 'Fiat, Abarth, Alfa Romeo, Lancia, Maserati, Peugeot, Citroën, DS, Opel, Vauxhall, Jeep, Dodge, Chrysler, RAM',
  },
  EU_OTHER: {
    label: 'Altri Europei',
    badge: 'EU',
    description: 'BMW, Mercedes-Benz, MINI, Renault, Dacia, Volvo, Ferrari, Land Rover, Jaguar',
  },
  US: {
    label: 'Americani',
    badge: 'USA',
    description: 'Ford, Chevrolet, Cadillac, Tesla',
  },
  JP: {
    label: 'Giapponesi',
    badge: 'JDM / JP',
    description: 'Honda, Toyota, Mazda, Subaru, Nissan, Mitsubishi, Suzuki, Lexus',
  },
};
