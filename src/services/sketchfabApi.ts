import type { VehicleModel, VisualModsConfig } from '../core/types';

export interface SketchfabCarModel {
  uid: string;
  name: string;
  author: string;
  likeCount: number;
  viewerUrl: string;
  variantTag?: 'r32' | 'clubsport' | 'stock';
}

interface SketchfabApiRawResult {
  uid: string;
  name: string;
  likeCount?: number;
  viewerUrl?: string;
  user?: {
    displayName?: string;
    username?: string;
  };
}

interface SketchfabCacheEntry {
  timestamp: number;
  models: SketchfabCarModel[];
}

const CACHE_PREFIX = 'carfix_sketchfab_v5_';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const EXCLUDED_KEYWORDS = [
  'pack',
  'bundle',
  'collection',
  'store',
  'car seat',
  'bucket seat',
  'racing seat',
  'seat only',
  'rim',
  'wheel',
  'logo',
  'damaged',
  'tunnel',
  'road',
  'garage',
  'engine only',
  'dashboard',
  'steering',
  'gauge pod',
  'traffic vehicles',
  'driving school',
  'blacklist',
  'halloween',
];

export const CURATED_SKETCHFAB_MODELS: Record<string, SketchfabCarModel[]> = {
  // ---- GOLF MK4 ----
  'vw-golf-4-tdi': [
    {
      uid: '95c8444ef4124a59b1b24cad4770b77a',
      name: 'Volkswagen Golf Mk4 (1.9 TDI / GTI / R32)',
      author: 'Sketchfab 3D',
      likeCount: 21,
      viewerUrl: 'https://sketchfab.com/3d-models/95c8444ef4124a59b1b24cad4770b77a',
      variantTag: 'stock',
    },
    {
      uid: '57fa4f06ba3e4eb09572796a4d76f546',
      name: '2002 Volkswagen Golf R32 Mk4',
      author: 'Sketchfab 3D',
      likeCount: 142,
      viewerUrl: 'https://sketchfab.com/3d-models/57fa4f06ba3e4eb09572796a4d76f546',
      variantTag: 'r32',
    },
  ],
  'vw-golf-4-gti': [
    {
      uid: '95c8444ef4124a59b1b24cad4770b77a',
      name: 'Volkswagen Golf Mk4 GTI 1.8T',
      author: 'Sketchfab 3D',
      likeCount: 21,
      viewerUrl: 'https://sketchfab.com/3d-models/95c8444ef4124a59b1b24cad4770b77a',
      variantTag: 'stock',
    },
  ],
  'vw-golf-4-r32': [
    {
      uid: '57fa4f06ba3e4eb09572796a4d76f546',
      name: '2002 Volkswagen Golf R32 Mk4',
      author: 'Sketchfab 3D',
      likeCount: 142,
      viewerUrl: 'https://sketchfab.com/3d-models/57fa4f06ba3e4eb09572796a4d76f546',
      variantTag: 'r32',
    },
  ],

  // ---- GOLF MK5 ----
  'vw-golf-5-tdi-bkc': [
    {
      uid: '4389c32f54964b5ab01aa8462419b6c1',
      name: 'Volkswagen Golf Mk5 (BKC / GTI Spec)',
      author: 'Sketchfab 3D',
      likeCount: 65,
      viewerUrl: 'https://sketchfab.com/3d-models/4389c32f54964b5ab01aa8462419b6c1',
      variantTag: 'stock',
    },
    {
      uid: '8171332b39be45e896a7fdf3c3e66354',
      name: 'Volkswagen Golf R32 (Look & Scarico Centrale)',
      author: 'Sketchfab 3D',
      likeCount: 37,
      viewerUrl: 'https://sketchfab.com/3d-models/8171332b39be45e896a7fdf3c3e66354',
      variantTag: 'r32',
    },
  ],
  'vw-golf-5-20tdi': [
    {
      uid: '4389c32f54964b5ab01aa8462419b6c1',
      name: 'Volkswagen Golf Mk5 2.0 TDI',
      author: 'Sketchfab 3D',
      likeCount: 65,
      viewerUrl: 'https://sketchfab.com/3d-models/4389c32f54964b5ab01aa8462419b6c1',
      variantTag: 'stock',
    },
    {
      uid: '8171332b39be45e896a7fdf3c3e66354',
      name: 'Volkswagen Golf V R32',
      author: 'Sketchfab 3D',
      likeCount: 37,
      viewerUrl: 'https://sketchfab.com/3d-models/8171332b39be45e896a7fdf3c3e66354',
      variantTag: 'r32',
    },
  ],
  'vw-golf-5-gti': [
    {
      uid: '4389c32f54964b5ab01aa8462419b6c1',
      name: 'Volkswagen Golf V GTI',
      author: 'Sketchfab 3D',
      likeCount: 65,
      viewerUrl: 'https://sketchfab.com/3d-models/4389c32f54964b5ab01aa8462419b6c1',
      variantTag: 'stock',
    },
    {
      uid: '8171332b39be45e896a7fdf3c3e66354',
      name: 'Volkswagen Golf R32 Style',
      author: 'Sketchfab 3D',
      likeCount: 37,
      viewerUrl: 'https://sketchfab.com/3d-models/8171332b39be45e896a7fdf3c3e66354',
      variantTag: 'r32',
    },
  ],
  'vw-golf-5-r32': [
    {
      uid: '8171332b39be45e896a7fdf3c3e66354',
      name: 'Volkswagen Golf V R32',
      author: 'Sketchfab 3D',
      likeCount: 37,
      viewerUrl: 'https://sketchfab.com/3d-models/8171332b39be45e896a7fdf3c3e66354',
      variantTag: 'r32',
    },
    {
      uid: '4389c32f54964b5ab01aa8462419b6c1',
      name: 'Volkswagen Golf Mk5',
      author: 'Sketchfab 3D',
      likeCount: 65,
      viewerUrl: 'https://sketchfab.com/3d-models/4389c32f54964b5ab01aa8462419b6c1',
      variantTag: 'stock',
    },
  ],

  // ---- GOLF MK6 (Modelli reali Golf 6 verificati!) ----
  'vw-golf-6-16tdi': [
    {
      uid: '46d9c43124b94f6293920944bef5b563',
      name: 'Volkswagen Golf VI (Mk6 1.6 TDI)',
      author: 'Sketchfab 3D',
      likeCount: 68,
      viewerUrl: 'https://sketchfab.com/3d-models/46d9c43124b94f6293920944bef5b563',
      variantTag: 'stock',
    },
    {
      uid: '72ff1ac5981e4b77a0aa2c22437eca82',
      name: 'Volkswagen Golf MK 6 Sport',
      author: 'Sketchfab 3D',
      likeCount: 45,
      viewerUrl: 'https://sketchfab.com/3d-models/72ff1ac5981e4b77a0aa2c22437eca82',
      variantTag: 'clubsport',
    },
  ],
  'vw-golf-6-tdi': [
    {
      uid: '46d9c43124b94f6293920944bef5b563',
      name: 'Volkswagen Golf VI 2.0 TDI',
      author: 'Sketchfab 3D',
      likeCount: 68,
      viewerUrl: 'https://sketchfab.com/3d-models/46d9c43124b94f6293920944bef5b563',
      variantTag: 'stock',
    },
    {
      uid: '72ff1ac5981e4b77a0aa2c22437eca82',
      name: 'Volkswagen Golf MK 6',
      author: 'Sketchfab 3D',
      likeCount: 45,
      viewerUrl: 'https://sketchfab.com/3d-models/72ff1ac5981e4b77a0aa2c22437eca82',
      variantTag: 'clubsport',
    },
  ],
  'vw-golf-6-14tsi': [
    {
      uid: '46d9c43124b94f6293920944bef5b563',
      name: 'Volkswagen Golf VI 1.4 TSI',
      author: 'Sketchfab 3D',
      likeCount: 68,
      viewerUrl: 'https://sketchfab.com/3d-models/46d9c43124b94f6293920944bef5b563',
      variantTag: 'stock',
    },
  ],
  'vw-golf-6-gti': [
    {
      uid: '72ff1ac5981e4b77a0aa2c22437eca82',
      name: 'Volkswagen Golf VI GTI',
      author: 'Sketchfab 3D',
      likeCount: 45,
      viewerUrl: 'https://sketchfab.com/3d-models/72ff1ac5981e4b77a0aa2c22437eca82',
      variantTag: 'stock',
    },
    {
      uid: '46d9c43124b94f6293920944bef5b563',
      name: 'Volkswagen Golf VI',
      author: 'Sketchfab 3D',
      likeCount: 68,
      viewerUrl: 'https://sketchfab.com/3d-models/46d9c43124b94f6293920944bef5b563',
      variantTag: 'clubsport',
    },
  ],

  // ---- GOLF MK7 & MK7.5 ----
  'vw-golf-7-tdi': [
    {
      uid: '364f56c79e9a4bfbb0bfa981b9abb6a3',
      name: 'Volkswagen Golf 7',
      author: 'Sketchfab 3D',
      likeCount: 39,
      viewerUrl: 'https://sketchfab.com/3d-models/364f56c79e9a4bfbb0bfa981b9abb6a3',
      variantTag: 'stock',
    },
    {
      uid: '93f2b79c56c14b269fbe914205c4712e',
      name: '2014 Volkswagen Golf GTI Mk7',
      author: 'Sketchfab 3D',
      likeCount: 25,
      viewerUrl: 'https://sketchfab.com/3d-models/93f2b79c56c14b269fbe914205c4712e',
      variantTag: 'clubsport',
    },
  ],
  'vw-golf-7-gti': [
    {
      uid: '93f2b79c56c14b269fbe914205c4712e',
      name: '2014 Volkswagen Golf GTI Mk7',
      author: 'Sketchfab 3D',
      likeCount: 25,
      viewerUrl: 'https://sketchfab.com/3d-models/93f2b79c56c14b269fbe914205c4712e',
      variantTag: 'stock',
    },
    {
      uid: '492301d401ea4fb7bb1cb63e980051d0',
      name: '2016 Volkswagen Golf GTI Clubsport Mk7',
      author: 'Sketchfab 3D',
      likeCount: 30,
      viewerUrl: 'https://sketchfab.com/3d-models/492301d401ea4fb7bb1cb63e980051d0',
      variantTag: 'clubsport',
    },
  ],
  'vw-golf-75-15tsi': [
    {
      uid: '364f56c79e9a4bfbb0bfa981b9abb6a3',
      name: 'Volkswagen Golf 7.5 1.5 TSI Evo',
      author: 'Sketchfab 3D',
      likeCount: 39,
      viewerUrl: 'https://sketchfab.com/3d-models/364f56c79e9a4bfbb0bfa981b9abb6a3',
      variantTag: 'stock',
    },
  ],
  'vw-golf-75-gti': [
    {
      uid: '492301d401ea4fb7bb1cb63e980051d0',
      name: 'Volkswagen Golf GTI Clubsport Mk7/7.5',
      author: 'Sketchfab 3D',
      likeCount: 30,
      viewerUrl: 'https://sketchfab.com/3d-models/492301d401ea4fb7bb1cb63e980051d0',
      variantTag: 'clubsport',
    },
    {
      uid: '5fbee7cbb12d4f599ee5f2ade3d637a9',
      name: 'Volkswagen Golf 7.5 R',
      author: 'Sketchfab 3D',
      likeCount: 3,
      viewerUrl: 'https://sketchfab.com/3d-models/5fbee7cbb12d4f599ee5f2ade3d637a9',
      variantTag: 'r32',
    },
  ],
  'vw-golf-75-r': [
    {
      uid: '13d7f2b87c4f42f2970eb1f302ea9eb9',
      name: 'Volkswagen Golf R 7.5',
      author: 'Sketchfab 3D',
      likeCount: 7,
      viewerUrl: 'https://sketchfab.com/3d-models/13d7f2b87c4f42f2970eb1f302ea9eb9',
      variantTag: 'r32',
    },
    {
      uid: '5fbee7cbb12d4f599ee5f2ade3d637a9',
      name: 'Vw Golf 7.5 R',
      author: 'Sketchfab 3D',
      likeCount: 3,
      viewerUrl: 'https://sketchfab.com/3d-models/5fbee7cbb12d4f599ee5f2ade3d637a9',
      variantTag: 'clubsport',
    },
  ],
  'vw-golf-75-tdi': [
    {
      uid: '364f56c79e9a4bfbb0bfa981b9abb6a3',
      name: 'Volkswagen Golf 7 / 7.5',
      author: 'Sketchfab 3D',
      likeCount: 39,
      viewerUrl: 'https://sketchfab.com/3d-models/364f56c79e9a4bfbb0bfa981b9abb6a3',
      variantTag: 'stock',
    },
    {
      uid: '13d7f2b87c4f42f2970eb1f302ea9eb9',
      name: 'Volkswagen Golf 7.5 R Line',
      author: 'Sketchfab 3D',
      likeCount: 7,
      viewerUrl: 'https://sketchfab.com/3d-models/13d7f2b87c4f42f2970eb1f302ea9eb9',
      variantTag: 'r32',
    },
  ],

  // ---- GOLF MK8 ----
  'vw-golf-8-tdi': [
    {
      uid: 'cb1187bfbee447b394759315bcbcbb4d',
      name: '2021 Volkswagen Golf Mk8',
      author: 'Sketchfab 3D',
      likeCount: 75,
      viewerUrl: 'https://sketchfab.com/3d-models/cb1187bfbee447b394759315bcbcbb4d',
      variantTag: 'stock',
    },
    {
      uid: '8717f7b321cf414cab680bf6f1802fe7',
      name: 'Volkswagen Golf Mk8 Widebody',
      author: 'Sketchfab 3D',
      likeCount: 10,
      viewerUrl: 'https://sketchfab.com/3d-models/8717f7b321cf414cab680bf6f1802fe7',
      variantTag: 'clubsport',
    },
  ],
  'vw-golf-8-gti': [
    {
      uid: 'e87d7c0f8937481db236529beb5ecab7',
      name: 'Volkswagen Golf 8 GTI (A8)',
      author: 'Sketchfab 3D',
      likeCount: 87,
      viewerUrl: 'https://sketchfab.com/3d-models/e87d7c0f8937481db236529beb5ecab7',
      variantTag: 'stock',
    },
    {
      uid: '0af23cd0b6974334842745bf2230a370',
      name: 'Volkswagen Golf 8 GTI Clubsport',
      author: 'Sketchfab 3D',
      likeCount: 25,
      viewerUrl: 'https://sketchfab.com/3d-models/0af23cd0b6974334842745bf2230a370',
      variantTag: 'clubsport',
    },
  ],
  'vw-golf-8-gte': [
    {
      uid: 'cb1187bfbee447b394759315bcbcbb4d',
      name: 'Volkswagen Golf Mk8 GTE / GTI',
      author: 'Sketchfab 3D',
      likeCount: 75,
      viewerUrl: 'https://sketchfab.com/3d-models/cb1187bfbee447b394759315bcbcbb4d',
    },
  ],

  // ---- AUDI / ALFA / FIAT / BMW / JDM / USA ----
  'audi-a3-8p-tdi': [
    {
      uid: '070e6a27527a433baae83f55a40df536',
      name: 'Audi A3 8P Quattro',
      author: 'Sketchfab 3D',
      likeCount: 40,
      viewerUrl: 'https://sketchfab.com/3d-models/070e6a27527a433baae83f55a40df536',
    },
    {
      uid: 'b0eb581f30b941b3a2278194489c5374',
      name: '2009 Audi A3 2.0T',
      author: 'Sketchfab 3D',
      likeCount: 61,
      viewerUrl: 'https://sketchfab.com/3d-models/b0eb581f30b941b3a2278194489c5374',
    },
  ],
  'audi-s3-8v': [
    {
      uid: '4658de67e4444184b6e5d29facc09038',
      name: 'Audi S3 8V',
      author: 'Sketchfab 3D',
      likeCount: 45,
      viewerUrl: 'https://sketchfab.com/3d-models/4658de67e4444184b6e5d29facc09038',
    },
    {
      uid: '596b3121571242039a23f7a83092be17',
      name: 'Audi A3 / S3 8V',
      author: 'Sketchfab 3D',
      likeCount: 30,
      viewerUrl: 'https://sketchfab.com/3d-models/596b3121571242039a23f7a83092be17',
    },
  ],
  'alfa-147-jtd': [
    {
      uid: '65d6e3b831274a46b26e821477b0147d',
      name: 'Alfa Romeo 147',
      author: 'Sketchfab 3D',
      likeCount: 35,
      viewerUrl: 'https://sketchfab.com/3d-models/65d6e3b831274a46b26e821477b0147d',
    },
    {
      uid: 'd0a4e13a2ee94dcbad7c57922c4c81e6',
      name: 'Alfa Romeo 147 GTA',
      author: 'Sketchfab 3D',
      likeCount: 55,
      viewerUrl: 'https://sketchfab.com/3d-models/d0a4e13a2ee94dcbad7c57922c4c81e6',
      variantTag: 'clubsport',
    },
  ],
  'alfa-159-jtd': [
    {
      uid: '800b9a3e2f114bf69e10d335e7d53f86',
      name: 'Alfa Romeo 159',
      author: 'Sketchfab 3D',
      likeCount: 18,
      viewerUrl: 'https://sketchfab.com/3d-models/800b9a3e2f114bf69e10d335e7d53f86',
    },
    {
      uid: 'b0f4d6ae8eb74b63ad49455215508415',
      name: 'Alfa Romeo 159 Sedan & Sportwagon',
      author: 'Sketchfab 3D',
      likeCount: 26,
      viewerUrl: 'https://sketchfab.com/3d-models/b0f4d6ae8eb74b63ad49455215508415',
    },
  ],
  'alfa-giulietta-qv': [
    {
      uid: '1593b00458b14ae4a838f392a66d209d',
      name: 'Alfa Romeo Giulietta QV',
      author: 'Sketchfab 3D',
      likeCount: 236,
      viewerUrl: 'https://sketchfab.com/3d-models/1593b00458b14ae4a838f392a66d209d',
    },
  ],
  'alfa-giulia-20t': [
    {
      uid: '373b333a938e49c7ba596919817e844c',
      name: 'Alfa Romeo Giulia',
      author: 'Sketchfab 3D',
      likeCount: 241,
      viewerUrl: 'https://sketchfab.com/3d-models/373b333a938e49c7ba596919817e844c',
    },
  ],
  'alfa-giulia-qf': [
    {
      uid: '373b333a938e49c7ba596919817e844c',
      name: 'Alfa Romeo Giulia Quadrifoglio',
      author: 'Sketchfab 3D',
      likeCount: 241,
      viewerUrl: 'https://sketchfab.com/3d-models/373b333a938e49c7ba596919817e844c',
    },
  ],
  'fiat-panda-12-gpl': [
    {
      uid: '478cbb5ec81848f7b702768c8e6fe1a6',
      name: 'Fiat Panda',
      author: 'Sketchfab 3D',
      likeCount: 95,
      viewerUrl: 'https://sketchfab.com/3d-models/478cbb5ec81848f7b702768c8e6fe1a6',
    },
  ],
  'fiat-punto-14-tjet': [
    {
      uid: 'c5c266b8d4ff4912898e189352af314f',
      name: 'Fiat Grande Punto',
      author: 'Sketchfab 3D',
      likeCount: 40,
      viewerUrl: 'https://sketchfab.com/3d-models/c5c266b8d4ff4912898e189352af314f',
    },
    {
      uid: 'b31af925b47848dc89f281c4c80a744f',
      name: 'Abarth Grande Punto',
      author: 'Sketchfab 3D',
      likeCount: 30,
      viewerUrl: 'https://sketchfab.com/3d-models/b31af925b47848dc89f281c4c80a744f',
      variantTag: 'clubsport',
    },
  ],
  'abarth-595-competizione': [
    {
      uid: '4fb5ffae29e04abe946e0f365555fe3a',
      name: 'Fiat Abarth 595',
      author: 'Sketchfab 3D',
      likeCount: 27,
      viewerUrl: 'https://sketchfab.com/3d-models/4fb5ffae29e04abe946e0f365555fe3a',
    },
  ],
  'bmw-320d-e46': [
    {
      uid: '478330312c3d46fd94999c3133ce0366',
      name: 'BMW Serie 3 E46',
      author: 'Sketchfab 3D',
      likeCount: 50,
      viewerUrl: 'https://sketchfab.com/3d-models/478330312c3d46fd94999c3133ce0366',
    },
  ],
  'bmw-330d-e90-m57': [
    {
      uid: '28f0bc2f0083417a8e521150529034d6',
      name: 'BMW Serie 3 E90',
      author: 'Sketchfab 3D',
      likeCount: 57,
      viewerUrl: 'https://sketchfab.com/3d-models/28f0bc2f0083417a8e521150529034d6',
    },
    {
      uid: 'c35a14d811b042d792a6da69381f7f80',
      name: 'BMW E92 Stance',
      author: 'Sketchfab 3D',
      likeCount: 431,
      viewerUrl: 'https://sketchfab.com/3d-models/c35a14d811b042d792a6da69381f7f80',
      variantTag: 'clubsport',
    },
  ],
  'bmw-320d-f30-b47': [
    {
      uid: '3b8c8703b97f4abe9ec9ca1d11cb346f',
      name: 'BMW Serie 3 F30',
      author: 'Sketchfab 3D',
      likeCount: 60,
      viewerUrl: 'https://sketchfab.com/3d-models/3b8c8703b97f4abe9ec9ca1d11cb346f',
    },
  ],
  'toyota-supra-mk4': [
    {
      uid: 'dd897d7823784bc5893c183c1328e8cb',
      name: 'Toyota Supra (A80) 1993',
      author: 'Sketchfab 3D',
      likeCount: 616,
      viewerUrl: 'https://sketchfab.com/3d-models/dd897d7823784bc5893c183c1328e8cb',
    },
  ],
  'ford-mustang-gt': [
    {
      uid: '0eaa7a16796540f29461ddae05ecdeb3',
      name: 'Ford Mustang Shelby GT',
      author: 'Sketchfab 3D',
      likeCount: 856,
      viewerUrl: 'https://sketchfab.com/3d-models/0eaa7a16796540f29461ddae05ecdeb3',
    },
  ],
  'vw-golf-tgi-metano': [
    {
      uid: '364f56c79e9a4bfbb0bfa981b9abb6a3',
      name: 'Volkswagen Golf 7 / 7.5 TGI',
      author: 'Sketchfab 3D',
      likeCount: 39,
      viewerUrl: 'https://sketchfab.com/3d-models/364f56c79e9a4bfbb0bfa981b9abb6a3',
    },
  ],
    // Golf 7.5: 13d7f2b87c4f42f2970eb1f302ea9eb9 / 5fbee7cbb12d4f599ee5f2ade3d637a9
  'vw-id3-ev': [
    {
      uid: '869fe1b400104f45b9a51df73222b7c4',
      name: 'Volkswagen ID.3 Pro (2024)',
      author: 'Sketchfab 3D',
      likeCount: 82,
      viewerUrl: 'https://sketchfab.com/3d-models/869fe1b400104f45b9a51df73222b7c4',
    },
  ],
  'vw-polo-gti': [
    {
      uid: 'd57694d382bc49d5b53ff470ce001219',
      name: 'Volkswagen Polo R / GTI',
      author: 'Sketchfab 3D',
      likeCount: 90,
      viewerUrl: 'https://sketchfab.com/3d-models/d57694d382bc49d5b53ff470ce001219',
    },
    {
      uid: 'bab77902c638427bb85e68b6762a481f',
      name: '2016 Volkswagen Polo',
      author: 'Sketchfab 3D',
      likeCount: 44,
      viewerUrl: 'https://sketchfab.com/3d-models/bab77902c638427bb85e68b6762a481f',
    },
  ],
  'vw-scirocco-r': [
    {
      uid: '65a3bacfe328426baaff2843c1884bf1',
      name: '2015 Volkswagen Scirocco R',
      author: 'Sketchfab 3D',
      likeCount: 145,
      viewerUrl: 'https://sketchfab.com/3d-models/65a3bacfe328426baaff2843c1884bf1',
    },
  ],
  'vw-passat-tdi': [
    {
      uid: 'c839fbd24faa4477b9fb7b3fc6f68fa4',
      name: 'Volkswagen Passat Variant / B8',
      author: 'Sketchfab 3D',
      likeCount: 64,
      viewerUrl: 'https://sketchfab.com/3d-models/c839fbd24faa4477b9fb7b3fc6f68fa4',
    },
    {
      uid: '0e668a2cc10647b1a6e47e06384aa26a',
      name: 'Volkswagen Passat 2022',
      author: 'Sketchfab 3D',
      likeCount: 51,
      viewerUrl: 'https://sketchfab.com/3d-models/0e668a2cc10647b1a6e47e06384aa26a',
    },
  ],
  'vw-tiguan-tdi': [
    {
      uid: 'c8780d08e8dc4050a1287fa99c31824c',
      name: '2022 Volkswagen Tiguan',
      author: 'Sketchfab 3D',
      likeCount: 58,
      viewerUrl: 'https://sketchfab.com/3d-models/c8780d08e8dc4050a1287fa99c31824c',
    },
  ],
  'audi-a3-8l-18t': [
    {
      uid: '92ad1307f3d045d181ee9d9d940d2814',
      name: 'Audi A3 8L Mk1 1.8T',
      author: 'Sketchfab 3D',
      likeCount: 35,
      viewerUrl: 'https://sketchfab.com/3d-models/92ad1307f3d045d181ee9d9d940d2814',
    },
  ],
  'audi-rs3-daza': [
    {
      uid: '20fdc17a5b2f4afab096337b5822c170',
      name: 'Audi RS3 Sportback (DAZA)',
      author: 'Sketchfab 3D',
      likeCount: 112,
      viewerUrl: 'https://sketchfab.com/3d-models/20fdc17a5b2f4afab096337b5822c170',
    },
  ],
  'audi-a4-b8-tfsi': [
    {
      uid: '101fe36c91244631b2ce6c012520e85e',
      name: '2010 Audi A4 B8',
      author: 'Sketchfab 3D',
      likeCount: 74,
      viewerUrl: 'https://sketchfab.com/3d-models/101fe36c91244631b2ce6c012520e85e',
    },
  ],
  'audi-a6-30-tdi': [
    {
      uid: '04925f2cea0c4090a58d13d88e3f16d9',
      name: 'Audi A6 Quattro',
      author: 'Sketchfab 3D',
      likeCount: 84,
      viewerUrl: 'https://sketchfab.com/3d-models/04925f2cea0c4090a58d13d88e3f16d9',
    },
  ],
  'audi-q5-tdi': [
    {
      uid: '60fea790b21c48bcb379be2a6d2c1f81',
      name: '2023 Audi Q5 Quattro S-Line',
      author: 'Sketchfab 3D',
      likeCount: 62,
      viewerUrl: 'https://sketchfab.com/3d-models/60fea790b21c48bcb379be2a6d2c1f81',
    },
  ],
  'audi-tt-rs': [
    {
      uid: 'd00ae4bc719249bb9bd1e2fc06853bec',
      name: '2018 Audi TT RS',
      author: 'Sketchfab 3D',
      likeCount: 110,
      viewerUrl: 'https://sketchfab.com/3d-models/d00ae4bc719249bb9bd1e2fc06853bec',
    },
  ],
  'audi-r8-v10': [
    {
      uid: 'e17e438f076f4427a58d93aa779edaed',
      name: 'Audi R8 V10 Performance',
      author: 'Sketchfab 3D',
      likeCount: 215,
      viewerUrl: 'https://sketchfab.com/3d-models/e17e438f076f4427a58d93aa779edaed',
    },
  ],
  'seat-leon-19-tdi': [
    {
      uid: '1701d78b9b1f4f598d8238fc26fb5cd3',
      name: 'SEAT León 5-Door',
      author: 'Sketchfab 3D',
      likeCount: 54,
      viewerUrl: 'https://sketchfab.com/3d-models/1701d78b9b1f4f598d8238fc26fb5cd3',
    },
  ],
  'seat-leon-tgi': [
    {
      uid: '1701d78b9b1f4f598d8238fc26fb5cd3',
      name: 'SEAT León TGI Hybrid',
      author: 'Sketchfab 3D',
      likeCount: 54,
      viewerUrl: 'https://sketchfab.com/3d-models/1701d78b9b1f4f598d8238fc26fb5cd3',
    },
  ],
  'seat-ibiza-fr': [
    {
      uid: 'fec8626c9f0847fa900edfec200d82f9',
      name: '2022 SEAT Ibiza FR',
      author: 'Sketchfab 3D',
      likeCount: 49,
      viewerUrl: 'https://sketchfab.com/3d-models/fec8626c9f0847fa900edfec200d82f9',
    },
  ],
  'cupra-leon-vz': [
    {
      uid: '09447fae3d254d6c91ec32ef6bc0d3b9',
      name: 'CUPRA León VZ / Racer',
      author: 'Sketchfab 3D',
      likeCount: 70,
      viewerUrl: 'https://sketchfab.com/3d-models/09447fae3d254d6c91ec32ef6bc0d3b9',
    },
  ],
  'cupra-formentor-vz': [
    {
      uid: 'c3c7c51cf51a4d0ba9701c729721558d',
      name: 'CUPRA Formentor VZ',
      author: 'Sketchfab 3D',
      likeCount: 48,
      viewerUrl: 'https://sketchfab.com/3d-models/c3c7c51cf51a4d0ba9701c729721558d',
    },
  ],
  'cupra-formentor-ehybrid': [
    {
      uid: 'c3c7c51cf51a4d0ba9701c729721558d',
      name: 'CUPRA Formentor e-Hybrid',
      author: 'Sketchfab 3D',
      likeCount: 48,
      viewerUrl: 'https://sketchfab.com/3d-models/c3c7c51cf51a4d0ba9701c729721558d',
    },
  ],
  'skoda-octavia-rs-tdi': [
    {
      uid: '892e152237fa4e8bbeb6afb20169f0c2',
      name: 'Škoda Octavia',
      author: 'Sketchfab 3D',
      likeCount: 28,
      viewerUrl: 'https://sketchfab.com/3d-models/892e152237fa4e8bbeb6afb20169f0c2',
    },
  ],
  'skoda-octavia-gtec': [
    {
      uid: '892e152237fa4e8bbeb6afb20169f0c2',
      name: 'Škoda Octavia G-TEC',
      author: 'Sketchfab 3D',
      likeCount: 28,
      viewerUrl: 'https://sketchfab.com/3d-models/892e152237fa4e8bbeb6afb20169f0c2',
    },
  ],
  'skoda-fabia-rs': [
    {
      uid: 'faf858b3ae324e398c15db62bfe015d5',
      name: 'Škoda Fabia RS',
      author: 'Sketchfab 3D',
      likeCount: 61,
      viewerUrl: 'https://sketchfab.com/3d-models/faf858b3ae324e398c15db62bfe015d5',
    },
  ],
  'porsche-taycan-ev': [
    {
      uid: '58eabf784de44202b7b73abf9da78549',
      name: 'Porsche Taycan 4S',
      author: 'Sketchfab 3D',
      likeCount: 165,
      viewerUrl: 'https://sketchfab.com/3d-models/58eabf784de44202b7b73abf9da78549',
    },
  ],
  'porsche-cayenne-gt': [
    {
      uid: '74fbea5a4dfc4197839fdd2bf654369a',
      name: '2022 Porsche Cayenne Turbo GT',
      author: 'Sketchfab 3D',
      likeCount: 92,
      viewerUrl: 'https://sketchfab.com/3d-models/74fbea5a4dfc4197839fdd2bf654369a',
    },
  ],
  'lambo-huracan-evo': [
    {
      uid: 'f4004ef10bd44845b3cece359e6a6b2e',
      name: 'Lamborghini Huracán EVO',
      author: 'Sketchfab 3D',
      likeCount: 290,
      viewerUrl: 'https://sketchfab.com/3d-models/f4004ef10bd44845b3cece359e6a6b2e',
    },
  ],
  'lambo-urus-se': [
    {
      uid: 'cc113385b7e34481af5e50a2fb8b6b2e',
      name: '2025 Lamborghini Urus SE',
      author: 'Sketchfab 3D',
      likeCount: 132,
      viewerUrl: 'https://sketchfab.com/3d-models/cc113385b7e34481af5e50a2fb8b6b2e',
    },
  ],
  'lambo-aventador-v12': [
    {
      uid: 'e328d9f5dcfd48bdbe8c73324b52ece3',
      name: 'Lamborghini Aventador SVJ',
      author: 'Sketchfab 3D',
      likeCount: 280,
      viewerUrl: 'https://sketchfab.com/3d-models/e328d9f5dcfd48bdbe8c73324b52ece3',
    },
  ],
  'bentley-continental-gt': [
    {
      uid: '229a4a6d8b7849fea2cf4f23510f9538',
      name: 'Bentley Continental GT',
      author: 'Sketchfab 3D',
      likeCount: 165,
      viewerUrl: 'https://sketchfab.com/3d-models/229a4a6d8b7849fea2cf4f23510f9538',
    },
  ],
  'bugatti-chiron': [
    {
      uid: '04c5e3cad9bb49509fa44f16dbee24d8',
      name: 'Bugatti Chiron Sport',
      author: 'Sketchfab 3D',
      likeCount: 410,
      viewerUrl: 'https://sketchfab.com/3d-models/04c5e3cad9bb49509fa44f16dbee24d8',
    },
  ],
  'fiat-500-hybrid': [
    {
      uid: 'f412bdec4b494692b9d5d9c03f4178ad',
      name: 'Fiat 500',
      author: 'Sketchfab 3D',
      likeCount: 74,
      viewerUrl: 'https://sketchfab.com/3d-models/f412bdec4b494692b9d5d9c03f4178ad',
    },
  ],
  'fiat-500e-ev': [
    {
      uid: '3db18adf07a14765a73ef286393ffbea',
      name: 'Fiat 500e Electric',
      author: 'Sketchfab 3D',
      likeCount: 68,
      viewerUrl: 'https://sketchfab.com/3d-models/3db18adf07a14765a73ef286393ffbea',
    },
  ],
  'fiat-tipo-mjet': [
    {
      uid: 'f591ec941c2f471c92a7dbe9a3c0c2bd',
      name: 'Fiat Tipo Sedan 2021',
      author: 'Sketchfab 3D',
      likeCount: 55,
      viewerUrl: 'https://sketchfab.com/3d-models/f591ec941c2f471c92a7dbe9a3c0c2bd',
    },
  ],
  'fiat-panda-hybrid': [
    {
      uid: '478cbb5ec81848f7b702768c8e6fe1a6',
      name: 'Fiat Panda Hybrid',
      author: 'Sketchfab 3D',
      likeCount: 95,
      viewerUrl: 'https://sketchfab.com/3d-models/478cbb5ec81848f7b702768c8e6fe1a6',
    },
  ],
  'fiat-punto-13-mjet': [
    {
      uid: 'c5c266b8d4ff4912898e189352af314f',
      name: 'Fiat Grande Punto 1.3 MJet',
      author: 'Sketchfab 3D',
      likeCount: 40,
      viewerUrl: 'https://sketchfab.com/3d-models/c5c266b8d4ff4912898e189352af314f',
    },
  ],
  'alfa-mito-tjet': [
    {
      uid: '3d3dc53289eb46d1b57e6c8741e09c0c',
      name: '2009 Alfa Romeo MiTo',
      author: 'Sketchfab 3D',
      likeCount: 83,
      viewerUrl: 'https://sketchfab.com/3d-models/3d3dc53289eb46d1b57e6c8741e09c0c',
    },
  ],
  'alfa-stelvio-22d': [
    {
      uid: 'df99564e71fb449d99f69c0bbf791bf6',
      name: 'Alfa Romeo Stelvio Ti',
      author: 'Sketchfab 3D',
      likeCount: 77,
      viewerUrl: 'https://sketchfab.com/3d-models/df99564e71fb449d99f69c0bbf791bf6',
    },
  ],
  'alfa-4c-tbi': [
    {
      uid: '0b21093485e242358f40c2d060a488bb',
      name: '2018 Alfa Romeo 4C',
      author: 'Sketchfab 3D',
      likeCount: 118,
      viewerUrl: 'https://sketchfab.com/3d-models/0b21093485e242358f40c2d060a488bb',
    },
  ],
  'lancia-ypsilon-gpl': [
    {
      uid: '0bbc8e038f644f7089150cd3f6a1a927',
      name: 'Lancia Ypsilon 2017',
      author: 'Sketchfab 3D',
      likeCount: 42,
      viewerUrl: 'https://sketchfab.com/3d-models/0bbc8e038f644f7089150cd3f6a1a927',
    },
  ],
  'lancia-delta-integrale': [
    {
      uid: '85614131e0dc4613a948472aaa935fc7',
      name: 'Lancia Delta HF Integrale Evo 2',
      author: 'Sketchfab 3D',
      likeCount: 295,
      viewerUrl: 'https://sketchfab.com/3d-models/85614131e0dc4613a948472aaa935fc7',
    },
  ],
  'maserati-ghibli-q4': [
    {
      uid: 'ce8a31151aa54518a804076a2e7071c9',
      name: 'Maserati Ghibli Q4',
      author: 'Sketchfab 3D',
      likeCount: 95,
      viewerUrl: 'https://sketchfab.com/3d-models/ce8a31151aa54518a804076a2e7071c9',
    },
  ],
  'peugeot-208-puretech': [
    {
      uid: '3d4a1578573645de9a2915e93b7edcf7',
      name: 'Nouvelle Peugeot 208',
      author: 'Sketchfab 3D',
      likeCount: 84,
      viewerUrl: 'https://sketchfab.com/3d-models/3d4a1578573645de9a2915e93b7edcf7',
    },
  ],
  'peugeot-e208-ev': [
    {
      uid: '3d4a1578573645de9a2915e93b7edcf7',
      name: 'Peugeot e-208 Electric',
      author: 'Sketchfab 3D',
      likeCount: 84,
      viewerUrl: 'https://sketchfab.com/3d-models/3d4a1578573645de9a2915e93b7edcf7',
    },
  ],
  'peugeot-308-hdi': [
    {
      uid: '0d9c9c265bec42678bfc269c1a8cebc3',
      name: '2022 Peugeot 308',
      author: 'Sketchfab 3D',
      likeCount: 79,
      viewerUrl: 'https://sketchfab.com/3d-models/0d9c9c265bec42678bfc269c1a8cebc3',
    },
  ],
  'peugeot-3008-hybrid': [
    {
      uid: '4f7c7318a29d4e16a6047c2d58bba28d',
      name: 'Peugeot 3008 SUV',
      author: 'Sketchfab 3D',
      likeCount: 64,
      viewerUrl: 'https://sketchfab.com/3d-models/4f7c7318a29d4e16a6047c2d58bba28d',
    },
  ],
  'citroen-c3-puretech': [
    {
      uid: '0761dead5baf4775ac929ec0bf4c8708',
      name: 'Citroën C3',
      author: 'Sketchfab 3D',
      likeCount: 38,
      viewerUrl: 'https://sketchfab.com/3d-models/0761dead5baf4775ac929ec0bf4c8708',
    },
  ],
  'citroen-c4-hdi': [
    {
      uid: '97d128fb4b2a4558a02d65af542486dc',
      name: 'Citroën C4',
      author: 'Sketchfab 3D',
      likeCount: 62,
      viewerUrl: 'https://sketchfab.com/3d-models/97d128fb4b2a4558a02d65af542486dc',
    },
  ],
  'ds-4-bluehdi': [
    {
      uid: '9afce38125f24e05b8080337cce8bfac',
      name: 'DS 4 2022',
      author: 'Sketchfab 3D',
      likeCount: 44,
      viewerUrl: 'https://sketchfab.com/3d-models/9afce38125f24e05b8080337cce8bfac',
    },
  ],
  'opel-corsa-f-puretech': [
    {
      uid: '097c96ea47014f4bbcd56c8935a6f6a1',
      name: 'Opel Corsa',
      author: 'Sketchfab 3D',
      likeCount: 42,
      viewerUrl: 'https://sketchfab.com/3d-models/097c96ea47014f4bbcd56c8935a6f6a1',
    },
  ],
  'vauxhall-astra-gs': [
    {
      uid: 'f3eed38d0b2143889cbc465769e146cc',
      name: 'Vauxhall / Opel Astra',
      author: 'Sketchfab 3D',
      likeCount: 47,
      viewerUrl: 'https://sketchfab.com/3d-models/f3eed38d0b2143889cbc465769e146cc',
    },
  ],
  'jeep-renegade-16-mjet': [
    {
      uid: '192f7e81dce84c6780434f692a0f96c5',
      name: 'Jeep Renegade 1.6 MJet',
      author: 'Sketchfab 3D',
      likeCount: 61,
      viewerUrl: 'https://sketchfab.com/3d-models/192f7e81dce84c6780434f692a0f96c5',
    },
  ],
  'jeep-wrangler-rubicon': [
    {
      uid: 'aae5b65c544d40a4b8eaf95d907e67cd',
      name: 'Jeep Wrangler Rubicon',
      author: 'Sketchfab 3D',
      likeCount: 122,
      viewerUrl: 'https://sketchfab.com/3d-models/aae5b65c544d40a4b8eaf95d907e67cd',
    },
  ],
  'dodge-challenger-hellcat': [
    {
      uid: 'dffef27adb89412581cc61201b42b341',
      name: 'Dodge Challenger Hellcat',
      author: 'Sketchfab 3D',
      likeCount: 245,
      viewerUrl: 'https://sketchfab.com/3d-models/dffef27adb89412581cc61201b42b341',
    },
  ],
  'dodge-charger-srt': [
    {
      uid: 'c6d52512e32d42abb89466ced4d56c1d',
      name: 'Dodge Charger SRT',
      author: 'Sketchfab 3D',
      likeCount: 164,
      viewerUrl: 'https://sketchfab.com/3d-models/c6d52512e32d42abb89466ced4d56c1d',
    },
  ],
  'chrysler-300c-hemi': [
    {
      uid: 'deac34a345cd47299e0741d335abf549',
      name: '2008 Chrysler 300C SRT-8',
      author: 'Sketchfab 3D',
      likeCount: 84,
      viewerUrl: 'https://sketchfab.com/3d-models/deac34a345cd47299e0741d335abf549',
    },
  ],
  'ram-1500-trx': [
    {
      uid: '372fbf37230c46eca1997841bfaf0758',
      name: 'RAM 1500 TRX',
      author: 'Sketchfab 3D',
      likeCount: 192,
      viewerUrl: 'https://sketchfab.com/3d-models/372fbf37230c46eca1997841bfaf0758',
    },
  ],
  'bmw-320d-e90-n47': [
    {
      uid: '28f0bc2f0083417a8e521150529034d6',
      name: 'BMW Serie 3 E90 N47',
      author: 'Sketchfab 3D',
      likeCount: 57,
      viewerUrl: 'https://sketchfab.com/3d-models/28f0bc2f0083417a8e521150529034d6',
    },
  ],
  'bmw-m340i-b58': [
    {
      uid: '87c972d41e9e4717b2d2db206bf315ae',
      name: 'BMW G20 M340i / 330i',
      author: 'Sketchfab 3D',
      likeCount: 148,
      viewerUrl: 'https://sketchfab.com/3d-models/87c972d41e9e4717b2d2db206bf315ae',
    },
  ],
  'bmw-128i-e82': [
    {
      uid: 'f474a256fd7b4b6ea60b1fdcdd8a933d',
      name: 'BMW Serie 1 Coupé E82',
      author: 'Sketchfab 3D',
      likeCount: 74,
      viewerUrl: 'https://sketchfab.com/3d-models/f474a256fd7b4b6ea60b1fdcdd8a933d',
    },
  ],
  'bmw-m2-g87': [
    {
      uid: '4bb3ebbb88b04ab6bbb1b95f2aa1c176',
      name: '2023 BMW M2 Coupé (G87)',
      author: 'Sketchfab 3D',
      likeCount: 195,
      viewerUrl: 'https://sketchfab.com/3d-models/4bb3ebbb88b04ab6bbb1b95f2aa1c176',
    },
  ],
  'bmw-m4-f82': [
    {
      uid: 'a5687befab084efdba9a5c99a9a8ad4c',
      name: 'BMW M4 F82 Widebody',
      author: 'Sketchfab 3D',
      likeCount: 280,
      viewerUrl: 'https://sketchfab.com/3d-models/a5687befab084efdba9a5c99a9a8ad4c',
    },
  ],
  'bmw-x5-b58': [
    {
      uid: 'b453ba441ff04f9290955d09c3d46b9f',
      name: '2024 BMW X5 xDrive40i',
      author: 'Sketchfab 3D',
      likeCount: 112,
      viewerUrl: 'https://sketchfab.com/3d-models/b453ba441ff04f9290955d09c3d46b9f',
    },
  ],
  'merc-e300td-w210': [
    {
      uid: '5ddd3b440cf0496782948d765b8ef0c4',
      name: 'Mercedes-Benz W210 Sedan',
      author: 'Sketchfab 3D',
      likeCount: 69,
      viewerUrl: 'https://sketchfab.com/3d-models/5ddd3b440cf0496782948d765b8ef0c4',
    },
  ],
  'merc-a45-m139': [
    {
      uid: '9482f251f9c34a6e91d7777db5934cfc',
      name: 'Mercedes-Benz A45 AMG',
      author: 'Sketchfab 3D',
      likeCount: 164,
      viewerUrl: 'https://sketchfab.com/3d-models/9482f251f9c34a6e91d7777db5934cfc',
    },
  ],
  'merc-c63-amg': [
    {
      uid: '07f1e84892384aa08891b1f4cf266dd0',
      name: '2019 Mercedes-Benz C63 S AMG',
      author: 'Sketchfab 3D',
      likeCount: 224,
      viewerUrl: 'https://sketchfab.com/3d-models/07f1e84892384aa08891b1f4cf266dd0',
    },
  ],
  'merc-g-class': [
    {
      uid: '1a2a52b16cad4e618af347461817895c',
      name: 'Mercedes-Benz Classe G W463',
      author: 'Sketchfab 3D',
      likeCount: 175,
      viewerUrl: 'https://sketchfab.com/3d-models/1a2a52b16cad4e618af347461817895c',
    },
  ],
  'mini-cooper-s-f56': [
    {
      uid: 'b262744901a04cda823f17289d1a4847',
      name: 'MINI Cooper S',
      author: 'Sketchfab 3D',
      likeCount: 88,
      viewerUrl: 'https://sketchfab.com/3d-models/b262744901a04cda823f17289d1a4847',
    },
  ],
  'renault-clio-15-dci': [
    {
      uid: '5e7b0362f3ba4fbdae102825283f9688',
      name: 'Renault Clio',
      author: 'Sketchfab 3D',
      likeCount: 73,
      viewerUrl: 'https://sketchfab.com/3d-models/5e7b0362f3ba4fbdae102825283f9688',
    },
  ],
  'renault-clio-ecog-gpl': [
    {
      uid: '5e7b0362f3ba4fbdae102825283f9688',
      name: 'Renault Clio TCe GPL',
      author: 'Sketchfab 3D',
      likeCount: 73,
      viewerUrl: 'https://sketchfab.com/3d-models/5e7b0362f3ba4fbdae102825283f9688',
    },
  ],
  'renault-megane-rs': [
    {
      uid: '9b354d3413c64215a3c576cc6ffb3ca3',
      name: '2010 Renault Mégane RS 250 Cup',
      author: 'Sketchfab 3D',
      likeCount: 142,
      viewerUrl: 'https://sketchfab.com/3d-models/9b354d3413c64215a3c576cc6ffb3ca3',
    },
  ],
  'dacia-sandero-ecog': [
    {
      uid: '561fadf60efa4d45902eeee9e90ba268',
      name: 'Dacia Sandero 2021',
      author: 'Sketchfab 3D',
      likeCount: 51,
      viewerUrl: 'https://sketchfab.com/3d-models/561fadf60efa4d45902eeee9e90ba268',
    },
  ],
  'dacia-duster-15-dci': [
    {
      uid: '30bc2e09de66426bb67be72c95fa2476',
      name: 'Dacia Duster',
      author: 'Sketchfab 3D',
      likeCount: 59,
      viewerUrl: 'https://sketchfab.com/3d-models/30bc2e09de66426bb67be72c95fa2476',
    },
  ],
  'volvo-v60-d4': [
    {
      uid: '504ce39150fe49c7979f702d5f0f8580',
      name: 'Volvo V60',
      author: 'Sketchfab 3D',
      likeCount: 94,
      viewerUrl: 'https://sketchfab.com/3d-models/504ce39150fe49c7979f702d5f0f8580',
    },
  ],
  'ferrari-458-italia': [
    {
      uid: '16c28f5b3ed24991ac3d1208f4a8bc1f',
      name: 'Ferrari 458 / 488',
      author: 'Sketchfab 3D',
      likeCount: 290,
      viewerUrl: 'https://sketchfab.com/3d-models/16c28f5b3ed24991ac3d1208f4a8bc1f',
    },
  ],
  'ferrari-488-pista': [
    {
      uid: '16c28f5b3ed24991ac3d1208f4a8bc1f',
      name: 'Ferrari 488 Pista Widebody',
      author: 'Sketchfab 3D',
      likeCount: 290,
      viewerUrl: 'https://sketchfab.com/3d-models/16c28f5b3ed24991ac3d1208f4a8bc1f',
    },
  ],
  'jaguar-xe-20d': [
    {
      uid: '9242afa6a7ae4800833e18b1249fa3f9',
      name: 'Jaguar XE Project 8',
      author: 'Sketchfab 3D',
      likeCount: 112,
      viewerUrl: 'https://sketchfab.com/3d-models/9242afa6a7ae4800833e18b1249fa3f9',
    },
  ],
  'landrover-defender-110': [
    {
      uid: 'acd4ccac7181427895d66f6e668b4ef7',
      name: 'Land Rover Defender',
      author: 'Sketchfab 3D',
      likeCount: 158,
      viewerUrl: 'https://sketchfab.com/3d-models/acd4ccac7181427895d66f6e668b4ef7',
    },
  ],
  'ford-fiesta-ecoboost': [
    {
      uid: '1baa5c512e3c4ac3af4131fce9557ebe',
      name: 'Ford Fiesta ST / EcoBoost',
      author: 'Sketchfab 3D',
      likeCount: 58,
      viewerUrl: 'https://sketchfab.com/3d-models/1baa5c512e3c4ac3af4131fce9557ebe',
    },
  ],
  'ford-focus-rs': [
    {
      uid: '27e25fcead154e62a1dd8e92ccedb691',
      name: '2016 Ford Focus RS Mk3',
      author: 'Sketchfab 3D',
      likeCount: 165,
      viewerUrl: 'https://sketchfab.com/3d-models/27e25fcead154e62a1dd8e92ccedb691',
    },
  ],
  'chevy-camaro-ss': [
    {
      uid: '37ecedd9b5284cbfae74956eea2ad3fd',
      name: 'Chevrolet Camaro SS',
      author: 'Sketchfab 3D',
      likeCount: 148,
      viewerUrl: 'https://sketchfab.com/3d-models/37ecedd9b5284cbfae74956eea2ad3fd',
    },
  ],
  'chevy-corvette-v8': [
    {
      uid: '64cc449e7bb54a36bf0433812038670a',
      name: 'Chevrolet Corvette Stingray',
      author: 'Sketchfab 3D',
      likeCount: 230,
      viewerUrl: 'https://sketchfab.com/3d-models/64cc449e7bb54a36bf0433812038670a',
    },
  ],
  'cadillac-ct5v': [
    {
      uid: '49e07283510b4621b91bf1c52469658b',
      name: '2022 Cadillac CT5-V Blackwing',
      author: 'Sketchfab 3D',
      likeCount: 95,
      viewerUrl: 'https://sketchfab.com/3d-models/49e07283510b4621b91bf1c52469658b',
    },
  ],
  'tesla-model3-perf': [
    {
      uid: '3a602469d7874d1397efa67182198705',
      name: 'Tesla Model 3 Performance',
      author: 'Sketchfab 3D',
      likeCount: 210,
      viewerUrl: 'https://sketchfab.com/3d-models/3a602469d7874d1397efa67182198705',
    },
  ],
  'tesla-model-y': [
    {
      uid: 'e0f703b823e74746b40634d1876f6a13',
      name: 'Tesla Model Y',
      author: 'Sketchfab 3D',
      likeCount: 120,
      viewerUrl: 'https://sketchfab.com/3d-models/e0f703b823e74746b40634d1876f6a13',
    },
  ],
  'tesla-model-s': [
    {
      uid: '1360e3cf7323487eaba8ce94279229b6',
      name: 'Tesla Model S Plaid',
      author: 'Sketchfab 3D',
      likeCount: 190,
      viewerUrl: 'https://sketchfab.com/3d-models/1360e3cf7323487eaba8ce94279229b6',
    },
  ],
  'honda-civic-ep3': [
    {
      uid: '959eced6b43549638fec212245646f1c',
      name: 'Honda Civic Type R',
      author: 'Sketchfab 3D',
      likeCount: 185,
      viewerUrl: 'https://sketchfab.com/3d-models/959eced6b43549638fec212245646f1c',
    },
  ],
  'honda-s2000': [
    {
      uid: '1daea6b886c34945bbb54c74dd6ef362',
      name: 'Honda S2000 Roadster',
      author: 'Sketchfab 3D',
      likeCount: 210,
      viewerUrl: 'https://sketchfab.com/3d-models/1daea6b886c34945bbb54c74dd6ef362',
    },
  ],
  'honda-nsx': [
    {
      uid: '1cc15628a00a4739a6b6c01128927c8d',
      name: 'Honda NSX NA1 (1990)',
      author: 'Sketchfab 3D',
      likeCount: 245,
      viewerUrl: 'https://sketchfab.com/3d-models/1cc15628a00a4739a6b6c01128927c8d',
    },
  ],
  'toyota-corolla-hybrid': [
    {
      uid: '6fa01cd3bb2344578f0160ced12e9af2',
      name: 'Toyota Corolla / Heritage',
      author: 'Sketchfab 3D',
      likeCount: 140,
      viewerUrl: 'https://sketchfab.com/3d-models/6fa01cd3bb2344578f0160ced12e9af2',
    },
  ],
  'toyota-gr-yaris': [
    {
      uid: '1c2ce5ff548f4ab49d72183d1e0f2afe',
      name: 'Toyota GR Yaris',
      author: 'Sketchfab 3D',
      likeCount: 175,
      viewerUrl: 'https://sketchfab.com/3d-models/1c2ce5ff548f4ab49d72183d1e0f2afe',
    },
  ],
  'mazda-mx5-nd': [
    {
      uid: '5fb3081e227240b6a98791b8edcc41ba',
      name: 'Mazda MX-5 Roadster',
      author: 'Sketchfab 3D',
      likeCount: 120,
      viewerUrl: 'https://sketchfab.com/3d-models/5fb3081e227240b6a98791b8edcc41ba',
    },
  ],
  'mazda-rx7': [
    {
      uid: '45cb02e634ed477a9a04bb19813443f2',
      name: 'Mazda RX-7 FD3S',
      author: 'Sketchfab 3D',
      likeCount: 280,
      viewerUrl: 'https://sketchfab.com/3d-models/45cb02e634ed477a9a04bb19813443f2',
    },
  ],
  'mazda-3-skyactiv': [
    {
      uid: 'a72de3f3c1604409a7e6fc6be9854c9d',
      name: '2020 Mazda 3 Hatchback',
      author: 'Sketchfab 3D',
      likeCount: 95,
      viewerUrl: 'https://sketchfab.com/3d-models/a72de3f3c1604409a7e6fc6be9854c9d',
    },
  ],
  'subaru-impreza-sti': [
    {
      uid: '08296bc950364621b6174a3078bb19e0',
      name: 'Subaru Impreza WRX STi',
      author: 'Sketchfab 3D',
      likeCount: 198,
      viewerUrl: 'https://sketchfab.com/3d-models/08296bc950364621b6174a3078bb19e0',
    },
  ],
  'subaru-brz': [
    {
      uid: '8fecd93279644ada9111c5bfa2226327',
      name: 'Subaru BRZ Coupé',
      author: 'Sketchfab 3D',
      likeCount: 134,
      viewerUrl: 'https://sketchfab.com/3d-models/8fecd93279644ada9111c5bfa2226327',
    },
  ],
  'nissan-skyline-r34': [
    {
      uid: 'ff8fb2251dfa4bb9979e7022c5a6666c',
      name: 'Nissan Skyline R34 GT-R',
      author: 'Sketchfab 3D',
      likeCount: 410,
      viewerUrl: 'https://sketchfab.com/3d-models/ff8fb2251dfa4bb9979e7022c5a6666c',
    },
  ],
  'nissan-370z': [
    {
      uid: 'c0b36c1dc2b345418c3c190c5be7a359',
      name: 'Nissan 370Z NISMO',
      author: 'Sketchfab 3D',
      likeCount: 175,
      viewerUrl: 'https://sketchfab.com/3d-models/c0b36c1dc2b345418c3c190c5be7a359',
    },
  ],
  'mitsubishi-evo-ix': [
    {
      uid: 'c8cba408321440c7aeec40f2288334f0',
      name: 'Mitsubishi Lancer Evolution',
      author: 'Sketchfab 3D',
      likeCount: 198,
      viewerUrl: 'https://sketchfab.com/3d-models/c8cba408321440c7aeec40f2288334f0',
    },
  ],
  'suzuki-swift-sport': [
    {
      uid: '218c3c0c6afd4d0eb343bd50d8868fd0',
      name: 'Suzuki Swift Sport',
      author: 'Sketchfab 3D',
      likeCount: 74,
      viewerUrl: 'https://sketchfab.com/3d-models/218c3c0c6afd4d0eb343bd50d8868fd0',
    },
  ],
  'lexus-is300h': [
    {
      uid: '281a547f226543d680e4f27ae0304278',
      name: 'Lexus IS300 F-Sport',
      author: 'Sketchfab 3D',
      likeCount: 89,
      viewerUrl: 'https://sketchfab.com/3d-models/281a547f226543d680e4f27ae0304278',
    },
  ],
  'porsche-911-carrera': [
    {
      uid: 'd01b254483794de3819786d93e0e1ebf',
      name: 'Porsche 911 Carrera 4S',
      author: 'Sketchfab 3D',
      likeCount: 3610,
      viewerUrl: 'https://sketchfab.com/3d-models/d01b254483794de3819786d93e0e1ebf',
    },
    {
      uid: '78d5c47ab2554c2592b7e499179a0792',
      name: 'Porsche 911 GT3',
      author: 'Sketchfab 3D',
      likeCount: 412,
      viewerUrl: 'https://sketchfab.com/3d-models/78d5c47ab2554c2592b7e499179a0792',
      variantTag: 'clubsport',
    },
  ],
};

export function filterSketchfabCarResults(raw: SketchfabApiRawResult[]): SketchfabCarModel[] {
  return raw
    .filter((item) => {
      const lower = (item.name || '').toLowerCase();
      if (!lower) return false;
      return !EXCLUDED_KEYWORDS.some((bad) => lower.includes(bad));
    })
    .map((item) => ({
      uid: item.uid,
      name: item.name,
      author: item.user?.displayName || item.user?.username || 'Sketchfab 3D',
      likeCount: item.likeCount ?? 0,
      viewerUrl: item.viewerUrl || `https://sketchfab.com/3d-models/${item.uid}`,
    }));
}

export function buildSketchfabSearchQuery(vehicle: VehicleModel): string {
  const cleanModel = vehicle.model.replace(/\(.*?\)/g, '').trim();
  const shortModel = cleanModel.split(/\s+/).slice(0, 3).join(' ');
  return `${vehicle.brand} ${shortModel}`.trim();
}

export function buildSketchfabEmbedUrl(uid: string): string {
  return `https://sketchfab.com/models/${encodeURIComponent(uid)}/embed?autostart=1&preload=1&transparent=1&ui_theme=dark&ui_infos=0&ui_watermark=0&ui_stop=0&ui_help=0&ui_hint=0&ui_settings=0&ui_vr=0&ui_ar=0&ui_share=0&ui_annotations=0&ui_controls=0&ui_fullscreen=0&ui_inspector=0&dnt=1`;
}

export function getPreferredModelIndex(
  models: SketchfabCarModel[],
  visualMods?: VisualModsConfig,
): number {
  if (!visualMods || models.length <= 1) return 0;
  if (visualMods.exhaustStyle === 'r32_center') {
    const idx = models.findIndex(
      (m) => m.variantTag === 'r32' || m.name.toLowerCase().includes('r32'),
    );
    if (idx >= 0) return idx;
  }
  if (visualMods.spoiler || visualMods.lowered) {
    const idx = models.findIndex(
      (m) =>
        m.variantTag === 'clubsport' ||
        m.name.toLowerCase().includes('clubsport') ||
        m.name.toLowerCase().includes('widebody') ||
        m.name.toLowerCase().includes('stance'),
    );
    if (idx >= 0) return idx;
  }
  return 0;
}

export async function searchSketchfabModelsForVehicle(
  vehicle: VehicleModel,
): Promise<{ models: SketchfabCarModel[]; fromApi: boolean }> {
  const curated = CURATED_SKETCHFAB_MODELS[vehicle.id] ?? [];
  const cacheKey = `${CACHE_PREFIX}${vehicle.id}`;

  try {
    const cachedRaw = localStorage.getItem(cacheKey);
    if (cachedRaw) {
      const parsed = JSON.parse(cachedRaw) as SketchfabCacheEntry;
      if (Date.now() - parsed.timestamp < CACHE_TTL_MS && parsed.models.length > 0) {
        return { models: parsed.models, fromApi: true };
      }
    }
  } catch {
    // Ignore storage error
  }

  try {
    const query = buildSketchfabSearchQuery(vehicle);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 5000);
    // Ordina per rilevanza esatta del modello/generazione (non per likeCount generico)
    const url = `https://api.sketchfab.com/v3/search?type=models&categories=cars-vehicles&q=${encodeURIComponent(query)}&count=10`;
    const res = await fetch(url, { signal: controller.signal });
    window.clearTimeout(timeout);

    if (!res.ok) {
      return { models: curated, fromApi: false };
    }

    const data = (await res.json()) as { results?: SketchfabApiRawResult[] };
    const modelTokens = buildSketchfabSearchQuery(vehicle)
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length >= 2);
    const apiFiltered = filterSketchfabCarResults(data.results ?? []).filter((item) => {
      const n = item.name.toLowerCase();
      return modelTokens.some((tok) => n.includes(tok));
    });

    const seen = new Set(curated.map((c) => c.uid));
    const merged = [...curated];
    for (const item of apiFiltered) {
      if (!seen.has(item.uid)) {
        seen.add(item.uid);
        merged.push(item);
      }
    }

    const finalModels = merged.slice(0, 4);
    if (finalModels.length > 0) {
      try {
        localStorage.setItem(
          cacheKey,
          JSON.stringify({ timestamp: Date.now(), models: finalModels } satisfies SketchfabCacheEntry),
        );
      } catch {
        // Ignore quota error
      }
    }

    return { models: finalModels, fromApi: apiFiltered.length > 0 };
  } catch {
    return { models: curated, fromApi: false };
  }
}

export interface SketchfabViewerApi {
  start: () => void;
  addEventListener: (event: string, cb: () => void) => void;
  getMaterialList: (cb: (err: unknown, materials: SketchfabMaterial[]) => void) => void;
  setMaterial: (mat: SketchfabMaterial, cb?: () => void) => void;
  setBackground?: (opts: { color?: [number, number, number]; enable?: string }, cb?: () => void) => void;
  setCameraLookAt: (
    position: [number, number, number],
    target: [number, number, number],
    duration?: number,
    cb?: () => void,
  ) => void;
  getCameraLookAt: (
    cb: (err: unknown, camera: { position: [number, number, number]; target: [number, number, number] }) => void,
  ) => void;
}

export interface SketchfabMaterial {
  name: string;
  channels: Record<
    string,
    {
      enable?: boolean;
      color?: [number, number, number];
      factor?: number;
      texture?: unknown;
    }
  >;
}

interface SketchfabGlobalCtor {
  new (version: string, iframe: HTMLIFrameElement): {
    init: (
      uid: string,
      opts: {
        success: (api: SketchfabViewerApi) => void;
        error: () => void;
        autostart?: number;
        preload?: number;
        transparent?: number;
        ui_theme?: string;
        ui_infos?: number;
        ui_watermark?: number;
        ui_stop?: number;
        ui_help?: number;
        ui_hint?: number;
        ui_settings?: number;
        ui_vr?: number;
        ui_ar?: number;
        ui_share?: number;
        ui_annotations?: number;
        ui_controls?: number;
        ui_fullscreen?: number;
        ui_inspector?: number;
      },
    ) => void;
  };
}

let sdkPromise: Promise<SketchfabGlobalCtor | null> | null = null;

export function loadSketchfabViewerSdk(): Promise<SketchfabGlobalCtor | null> {
  const win = window as unknown as { Sketchfab?: SketchfabGlobalCtor };
  if (win.Sketchfab) return Promise.resolve(win.Sketchfab);
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://static.sketchfab.com/api/sketchfab-viewer-1.12.1.js';
    script.async = true;
    script.onload = () => resolve(win.Sketchfab ?? null);
    script.onerror = () => resolve(null);
    document.head.appendChild(script);
  });

  return sdkPromise;
}

export function hexToLinearRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '').trim();
  const num = parseInt(clean.length === 3 ? clean.replace(/(.)/g, '$1$1') : clean, 16);
  if (Number.isNaN(num)) return [0.15, 0.35, 0.85];
  const r = ((num >> 16) & 255) / 255;
  const g = ((num >> 8) & 255) / 255;
  const b = (num & 255) / 255;
  return [Math.pow(r, 2.2), Math.pow(g, 2.2), Math.pow(b, 2.2)];
}
