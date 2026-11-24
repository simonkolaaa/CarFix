import { useCallback, useEffect, useState } from 'react';
import {
  DEFAULT_VISUAL_MODS,
  type CarPhoto,
  type CommunityBuild,
  type GarageCar,
  type MaintenanceLogEntry,
  type ModEntry,
  type VisualModsConfig,
} from '../core/types';
import { COMMUNITY_SEED } from '../data/communitySeed';
import { CATALOG_BY_ID } from '../data/catalog';
import { MODS_BY_ID } from '../data/modsCatalog';

const GARAGE_STORAGE_KEY = 'carfix_garage_v1';
const COMMUNITY_STORAGE_KEY = 'carfix_community_v2';
const ACTIVE_SHOWROOM_KEY = 'carfix_active_showroom_v5';

interface ShowroomSelectionState {
  vehicleId: string | null;
  paintHex: string;
  paintAppliedNonce: number;
  visualMods: VisualModsConfig;
  viewMode: 'sketchfab' | 'user_photo';
}

function safeReadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function deriveVisualModsFromEntries(mods: ModEntry[]): VisualModsConfig {
  const result: VisualModsConfig = { ...DEFAULT_VISUAL_MODS };
  for (const entry of mods) {
    if (entry.modSpecId && MODS_BY_ID[entry.modSpecId]?.visualPatch) {
      Object.assign(result, MODS_BY_ID[entry.modSpecId].visualPatch);
    }
    const lower = entry.title.toLowerCase();
    if (lower.includes('r32')) result.exhaustStyle = 'r32_center';
    if (lower.includes('coilover') || lower.includes('assetto')) result.lowered = true;
    if (lower.includes('brembo') || lower.includes('312')) result.bremboCalipers = true;
    if (lower.includes('spoiler') || lower.includes('ala')) result.spoiler = true;
  }
  return result;
}

export function useCarFixStore() {
  const [garageCars, setGarageCars] = useState<GarageCar[]>(() =>
    safeReadJson<GarageCar[]>(GARAGE_STORAGE_KEY, []),
  );

  const [communityBuilds, setCommunityBuilds] = useState<CommunityBuild[]>(() =>
    safeReadJson<CommunityBuild[]>(COMMUNITY_STORAGE_KEY, COMMUNITY_SEED),
  );

  const [showroomState, setShowroomState] = useState<ShowroomSelectionState>(() =>
    safeReadJson<ShowroomSelectionState>(ACTIVE_SHOWROOM_KEY, {
      vehicleId: 'vw-golf-5-r32',
      paintHex: '#1e3a8a',
      paintAppliedNonce: 0,
      visualMods: { ...DEFAULT_VISUAL_MODS, exhaustStyle: 'r32_center' },
      viewMode: 'sketchfab',
    }),
  );

  useEffect(() => {
    try {
      localStorage.setItem(GARAGE_STORAGE_KEY, JSON.stringify(garageCars));
    } catch {
      // Ignore quota errors
    }
  }, [garageCars]);

  useEffect(() => {
    try {
      localStorage.setItem(COMMUNITY_STORAGE_KEY, JSON.stringify(communityBuilds));
    } catch {
      // Ignore quota errors
    }
  }, [communityBuilds]);

  useEffect(() => {
    try {
      localStorage.setItem(ACTIVE_SHOWROOM_KEY, JSON.stringify(showroomState));
    } catch {
      // Ignore quota errors
    }
  }, [showroomState]);

  const applyShowroomVehicle = useCallback(
    (
      vehicleId: string,
      paintHex?: string,
      visualPatch?: Partial<VisualModsConfig>,
      preferredMode?: 'sketchfab' | 'user_photo',
    ) => {
      const model = CATALOG_BY_ID[vehicleId];
      setShowroomState({
        vehicleId,
        paintHex: paintHex ?? model?.defaultColor ?? '#1e3a8a',
        paintAppliedNonce: paintHex && paintHex !== model?.defaultColor ? 1 : 0,
        visualMods: {
          ...DEFAULT_VISUAL_MODS,
          ...(vehicleId === 'vw-golf-5-r32' || vehicleId === 'vw-golf-4-r32'
            ? { exhaustStyle: 'r32_center' }
            : {}),
          ...(visualPatch ?? {}),
        },
        viewMode: preferredMode ?? 'sketchfab',
      });
    },
    [],
  );

  const setShowroomPaint = useCallback((paintHex: string) => {
    setShowroomState((prev) => ({
      ...prev,
      paintHex,
      paintAppliedNonce: prev.paintAppliedNonce + 1,
      viewMode: 'sketchfab',
    }));
  }, []);

  const setShowroomViewMode = useCallback((viewMode: 'sketchfab' | 'user_photo') => {
    setShowroomState((prev) => ({ ...prev, viewMode }));
  }, []);

  const updateShowroomVisualMods = useCallback((patch: Partial<VisualModsConfig>) => {
    setShowroomState((prev) => ({
      ...prev,
      viewMode: 'sketchfab',
      visualMods: { ...prev.visualMods, ...patch },
    }));
  }, []);

  const addCarToGarage = useCallback(
    (payload: {
      vehicleId: string;
      nickname?: string;
      customColorHex?: string;
      currentKm?: number;
      transmission?: GarageCar['transmission'];
    }): GarageCar => {
      const model = CATALOG_BY_ID[payload.vehicleId];
      const newCar: GarageCar = {
        id: `gar-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        vehicleId: payload.vehicleId,
        nickname: payload.nickname?.trim() || model?.model || 'La mia Auto',
        customColorHex: payload.customColorHex || model?.defaultColor || '#1e3a8a',
        currentKm: payload.currentKm ?? 115000,
        transmission: payload.transmission ?? 'Manuale',
        visualMods: {
          ...DEFAULT_VISUAL_MODS,
          ...(payload.vehicleId === 'vw-golf-5-r32' || payload.vehicleId === 'vw-golf-4-r32'
            ? { exhaustStyle: 'r32_center' }
            : {}),
        },
        maintenanceLogs: [],
        mods: [],
        photos: [],
        createdAt: new Date().toISOString().slice(0, 10),
      };
      setGarageCars((prev) => [newCar, ...prev]);
      return newCar;
    },
    [],
  );

  const updateGarageCar = useCallback((carId: string, patch: Partial<GarageCar>) => {
    setGarageCars((prev) => prev.map((c) => (c.id === carId ? { ...c, ...patch } : c)));
  }, []);

  const removeGarageCar = useCallback((carId: string) => {
    setGarageCars((prev) => prev.filter((c) => c.id !== carId));
  }, []);

  const addModToGarageCar = useCallback(
    (carId: string, mod: Omit<ModEntry, 'id' | 'createdAt'>) => {
      const entry: ModEntry = {
        ...mod,
        id: `mod-${Date.now()}`,
        createdAt: new Date().toISOString().slice(0, 10),
      };
      setGarageCars((prev) =>
        prev.map((c) => (c.id === carId ? { ...c, mods: [entry, ...c.mods] } : c)),
      );
    },
    [],
  );

  const removeModFromGarageCar = useCallback((carId: string, modId: string) => {
    setGarageCars((prev) =>
      prev.map((c) => (c.id === carId ? { ...c, mods: c.mods.filter((m) => m.id !== modId) } : c)),
    );
  }, []);

  const updateGarageCarVisualMods = useCallback(
    (carId: string, patch: Partial<VisualModsConfig>) => {
      setGarageCars((prev) =>
        prev.map((c) =>
          c.id === carId
            ? { ...c, visualMods: { ...DEFAULT_VISUAL_MODS, ...(c.visualMods ?? {}), ...patch } }
            : c,
        ),
      );
    },
    [],
  );

  const logGarageMaintenance = useCallback(
    (
      carId: string,
      payload: Omit<MaintenanceLogEntry, 'id' | 'completedDate'> & { completedDate?: string },
    ) => {
      const entry: MaintenanceLogEntry = {
        ...payload,
        id: `mnt-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        completedDate: payload.completedDate ?? new Date().toISOString().slice(0, 10),
      };
      setGarageCars((prev) =>
        prev.map((c) =>
          c.id === carId
            ? { ...c, maintenanceLogs: [entry, ...(c.maintenanceLogs ?? [])] }
            : c,
        ),
      );
    },
    [],
  );

  const removeGarageMaintenanceLog = useCallback((carId: string, logId: string) => {
    setGarageCars((prev) =>
      prev.map((c) =>
        c.id === carId
          ? {
              ...c,
              maintenanceLogs: (c.maintenanceLogs ?? []).filter((l) => l.id !== logId),
            }
          : c,
      ),
    );
  }, []);

  const addPhotoToGarageCar = useCallback(
    (carId: string, photo: Omit<CarPhoto, 'id' | 'createdAt'>) => {
      const item: CarPhoto = {
        ...photo,
        id: `pic-${Date.now()}`,
        createdAt: new Date().toISOString().slice(0, 10),
      };
      setGarageCars((prev) =>
        prev.map((c) => {
          if (c.id !== carId) return c;
          const prevVisual = { ...DEFAULT_VISUAL_MODS, ...(c.visualMods ?? {}) };
          const nextVisual: VisualModsConfig = {
            ...prevVisual,
            ...(photo.detectedRimFinish ? { rimFinish: photo.detectedRimFinish } : {}),
            ...(photo.detectedRimStyle ? { rimStyle: photo.detectedRimStyle } : {}),
            ...(photo.detectedStance === 'lowered' ? { lowered: true } : {}),
          };
          return {
            ...c,
            customColorHex: photo.dominantColorHex ?? c.customColorHex,
            visualMods: nextVisual,
            photos: [item, ...c.photos],
            primaryPhotoId: item.id,
          };
        }),
      );
      return item;
    },
    [],
  );

  const setPrimaryPhotoForGarageCar = useCallback((carId: string, photoId: string | undefined) => {
    setGarageCars((prev) =>
      prev.map((c) => (c.id === carId ? { ...c, primaryPhotoId: photoId } : c)),
    );
  }, []);

  const removePhotoFromGarageCar = useCallback((carId: string, photoId: string) => {
    setGarageCars((prev) =>
      prev.map((c) => {
        if (c.id !== carId) return c;
        const remaining = c.photos.filter((p) => p.id !== photoId);
        const nextPrimary =
          c.primaryPhotoId === photoId ? remaining[0]?.id : c.primaryPhotoId;
        return { ...c, photos: remaining, primaryPhotoId: nextPrimary };
      }),
    );
  }, []);

  const toggleUpvoteBuild = useCallback((buildId: string) => {
    setCommunityBuilds((prev) =>
      prev.map((b) => {
        if (b.id !== buildId) return b;
        const nextVoted = !b.userUpvoted;
        return {
          ...b,
          userUpvoted: nextVoted,
          upvotes: b.upvotes + (nextVoted ? 1 : -1),
        };
      }),
    );
  }, []);

  const addCommentToBuild = useCallback((buildId: string, author: string, text: string) => {
    if (!text.trim()) return;
    setCommunityBuilds((prev) =>
      prev.map((b) => {
        if (b.id !== buildId) return b;
        return {
          ...b,
          comments: [
            ...b.comments,
            {
              id: `cmt-${Date.now()}`,
              author: author.trim() || '@appassionato_carfix',
              text: text.trim(),
              createdAt: new Date().toISOString().slice(0, 10),
            },
          ],
        };
      }),
    );
  }, []);

  const publishGarageBuild = useCallback(
    (payload: {
      garageCar: GarageCar;
      authorHandle: string;
      title: string;
      summary: string;
      powerLabel: string;
    }) => {
      const model = CATALOG_BY_ID[payload.garageCar.vehicleId];
      const modIds = payload.garageCar.mods
        .map((m) => m.modSpecId)
        .filter((id): id is string => Boolean(id));
      const newBuild: CommunityBuild = {
        id: `build-${Date.now()}`,
        authorHandle: payload.authorHandle.trim() || '@garage_driver',
        vehicleId: payload.garageCar.vehicleId,
        title: payload.title.trim() || `${model?.brand ?? ''} ${payload.garageCar.nickname}`,
        summary: payload.summary.trim() || 'Build pubblicata direttamente dal Garage CarFix.',
        powerLabel: payload.powerLabel.trim() || `${model?.powerHp ?? 150} CV`,
        kmOnClock: payload.garageCar.currentKm,
        mods:
          payload.garageCar.mods.length > 0
            ? payload.garageCar.mods.map((m) => m.title)
            : ['Manutenzione certificata', 'Assetto stradale'],
        modIds,
        visualMods: deriveVisualModsFromEntries(payload.garageCar.mods),
        upvotes: 1,
        userUpvoted: true,
        tags: [model?.group ?? 'EU', model?.brand ?? 'Custom', 'Garage Build'],
        comments: [],
        createdAt: new Date().toISOString().slice(0, 10),
      };
      setCommunityBuilds((prev) => [newBuild, ...prev]);
    },
    [],
  );

  const exportGarageBackupJson = useCallback(() => {
    return JSON.stringify(
      {
        app: 'CarFix',
        exportedAt: new Date().toISOString(),
        garageCars,
      },
      null,
      2,
    );
  }, [garageCars]);

  const importGarageBackupJson = useCallback((jsonText: string): boolean => {
    try {
      const parsed = JSON.parse(jsonText) as { garageCars?: GarageCar[] };
      if (!Array.isArray(parsed.garageCars)) return false;
      setGarageCars(parsed.garageCars);
      return true;
    } catch {
      return false;
    }
  }, []);

  return {
    garageCars,
    communityBuilds,
    showroomState,
    applyShowroomVehicle,
    setShowroomPaint,
    setShowroomViewMode,
    updateShowroomVisualMods,
    addCarToGarage,
    updateGarageCar,
    updateGarageCarVisualMods,
    removeGarageCar,
    logGarageMaintenance,
    removeGarageMaintenanceLog,
    addModToGarageCar,
    removeModFromGarageCar,
    addPhotoToGarageCar,
    setPrimaryPhotoForGarageCar,
    removePhotoFromGarageCar,
    toggleUpvoteBuild,
    addCommentToBuild,
    publishGarageBuild,
    exportGarageBackupJson,
    importGarageBackupJson,
  };
}
