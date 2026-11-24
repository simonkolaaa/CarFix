import { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import type { AppRoute, EuroClass, VisualModsConfig } from './core/types';
import { useCarFixStore } from './state/useCarFixStore';
import { CinematicGolfIntro } from './components/CinematicGolfIntro';
import { Navbar } from './components/Navbar';
import { ShowroomView } from './features/showroom/ShowroomView';
import { GarageView } from './features/garage/GarageView';
import { SimulatorView } from './features/simulator/SimulatorView';
import { WikiView } from './features/wiki/WikiView';
import { EuroGuideView } from './features/euro/EuroGuideView';
import { CommunityView } from './features/community/CommunityView';

const VALID_ROUTES = new Set<AppRoute>([
  'showroom',
  'garage',
  'simulator',
  'wiki',
  'euro',
  'community',
]);

function parseHashRoute(): AppRoute {
  const clean = window.location.hash.replace('#', '').trim() as AppRoute;
  return VALID_ROUTES.has(clean) ? clean : 'showroom';
}

export function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [route, setRoute] = useState<AppRoute>(() => parseHashRoute());
  const [wikiFocus, setWikiFocus] = useState<{
    engineId: string | null;
    vehicleId: string | null;
  }>({ engineId: null, vehicleId: null });
  const [focusedEuro, setFocusedEuro] = useState<EuroClass | null>(null);
  const [simulatorVehicleId, setSimulatorVehicleId] = useState<string | null>(null);

  const {
    garageCars,
    communityBuilds,
    showroomState,
    applyShowroomVehicle,
    addCarToGarage,
    updateGarageCar,
    updateGarageCarVisualMods,
    removeGarageCar,
    logGarageMaintenance,
    removeGarageMaintenanceLog,
    addModToGarageCar,
    removeModFromGarageCar,
    toggleUpvoteBuild,
    addCommentToBuild,
    publishGarageBuild,
    exportGarageBackupJson,
    importGarageBackupJson,
  } = useCarFixStore();

  useEffect(() => {
    const onHashChange = () => setRoute(parseHashRoute());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = (nextRoute: AppRoute) => {
    setRoute(nextRoute);
    window.location.hash = `#${nextRoute}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenInShowroom = (
    vehicleId: string,
    paintHex?: string,
    visualPatch?: Partial<VisualModsConfig>,
    preferredMode?: 'sketchfab' | 'user_photo',
  ) => {
    applyShowroomVehicle(vehicleId, paintHex, visualPatch, preferredMode);
    navigate('showroom');
  };

  const handleOpenWikiEngine = (engineId: string, vehicleId?: string) => {
    setWikiFocus({ engineId, vehicleId: vehicleId ?? null });
    navigate('wiki');
  };

  const handleOpenEuro = (euroId: EuroClass) => {
    setFocusedEuro(euroId);
    navigate('euro');
  };

  const handleOpenSimulator = (vehicleId: string) => {
    setSimulatorVehicleId(vehicleId);
    navigate('simulator');
  };

  return (
    <div className="min-h-screen bg-[#08080b] text-zinc-100">
      <AnimatePresence>
        {showIntro && <CinematicGolfIntro onComplete={() => setShowIntro(false)} />}
      </AnimatePresence>

      {!showIntro && (
        <>
          <Navbar
            activeRoute={route}
            onNavigate={navigate}
            garageCount={garageCars.length}
          />

          <main>
            {route === 'showroom' && (
              <ShowroomView
                activeVehicleId={showroomState.vehicleId}
                paintHex={showroomState.paintHex}
                paintAppliedNonce={showroomState.paintAppliedNonce}
                visualMods={showroomState.visualMods}
                onApplyVehicle={applyShowroomVehicle}
                onSaveToGarage={(vehicle, paintHex) =>
                  addCarToGarage({
                    vehicleId: vehicle.id,
                    nickname: vehicle.model,
                    customColorHex: paintHex,
                  })
                }
                onOpenWikiEngine={handleOpenWikiEngine}
                onOpenEuroGuide={handleOpenEuro}
                onOpenSimulator={handleOpenSimulator}
              />
            )}

            {route === 'garage' && (
              <GarageView
                garageCars={garageCars}
                onAddCar={addCarToGarage}
                onUpdateCar={updateGarageCar}
                onUpdateCarVisualMods={updateGarageCarVisualMods}
                onRemoveCar={removeGarageCar}
                onLogMaintenance={logGarageMaintenance}
                onRemoveMaintenanceLog={removeGarageMaintenanceLog}
                onAddMod={addModToGarageCar}
                onRemoveMod={removeModFromGarageCar}
                onOpenInShowroom={handleOpenInShowroom}
                onOpenWiki={handleOpenWikiEngine}
                onOpenSimulator={handleOpenSimulator}
                onPublishToCommunity={(payload) => {
                  publishGarageBuild(payload);
                  navigate('community');
                }}
                onExportJson={exportGarageBackupJson}
                onImportJson={importGarageBackupJson}
              />
            )}

            {route === 'simulator' && (
              <SimulatorView initialVehicleId={simulatorVehicleId} />
            )}

            {route === 'wiki' && (
              <WikiView
                focusedEngineId={wikiFocus.engineId}
                focusedVehicleId={wikiFocus.vehicleId}
                onOpenInShowroom={handleOpenInShowroom}
              />
            )}

            {route === 'euro' && (
              <EuroGuideView
                focusedEuro={focusedEuro}
                onOpenEngineWiki={(engineId) => handleOpenWikiEngine(engineId)}
              />
            )}

            {route === 'community' && (
              <CommunityView
                builds={communityBuilds}
                onToggleUpvote={toggleUpvoteBuild}
                onAddComment={addCommentToBuild}
                onOpenInShowroom={handleOpenInShowroom}
              />
            )}
          </main>
        </>
      )}
    </div>
  );
}
export default App;
