import type {
  CategoryMaintenanceTask,
  EngineWiki,
  GarageCar,
  MaintenanceCategory,
  MaintenanceLogEntry,
  MaintenanceMilestone,
  VehicleModel,
} from './types';
import { BASE_MAINTENANCE_TASKS, MAINTENANCE_CATEGORIES } from '../data/maintenanceCatalog';

export interface MaintenanceAlertReport {
  status: 'critical' | 'attention' | 'ok';
  headline: string;
  overdue: MaintenanceMilestone[];
  upcoming: MaintenanceMilestone[];
  future: MaintenanceMilestone[];
}

export interface EvaluatedCategoryTask {
  task: CategoryMaintenanceTask;
  source: 'base' | 'engine_specific';
  status: 'overdue' | 'upcoming' | 'ok';
  nextDueKm: number;
  remainingKm: number;
  lastCompleted?: MaintenanceLogEntry;
}

export interface CategoryHealthSummary {
  category: MaintenanceCategory;
  label: string;
  shortLabel: string;
  description: string;
  healthPct: number;
  overdueCount: number;
  upcomingCount: number;
  tasks: EvaluatedCategoryTask[];
}

export interface CategorizedMaintenanceReport {
  overallHealthPct: number;
  totalOverdue: number;
  totalUpcoming: number;
  totalSpentEur: number;
  categories: CategoryHealthSummary[];
  allTasks: EvaluatedCategoryTask[];
}

const UPCOMING_WINDOW_KM = 15000;

export function evaluateMaintenanceAlerts(
  currentKm: number,
  engine: EngineWiki,
): MaintenanceAlertReport {
  const safeKm = Math.max(0, Number.isFinite(currentKm) ? currentKm : 0);
  const sorted = [...engine.milestones].sort((a, b) => a.kmThreshold - b.kmThreshold);

  const overdue: MaintenanceMilestone[] = [];
  const upcoming: MaintenanceMilestone[] = [];
  const future: MaintenanceMilestone[] = [];

  for (const milestone of sorted) {
    if (safeKm >= milestone.kmThreshold) {
      overdue.push(milestone);
    } else if (milestone.kmThreshold - safeKm <= UPCOMING_WINDOW_KM) {
      upcoming.push(milestone);
    } else {
      future.push(milestone);
    }
  }

  const hasCriticalOverdue = overdue.some((m) => m.severity === 'critical');

  if (hasCriticalOverdue || overdue.length >= 2) {
    const first = overdue[overdue.length - 1];
    return {
      status: 'critical',
      headline: `A ${safeKm.toLocaleString('it-IT')} km sul ${engine.code} hai superato la soglia critica: ${first.componentName} (${first.kmThreshold.toLocaleString('it-IT')} km).`,
      overdue,
      upcoming,
      future,
    };
  }

  if (overdue.length === 1 || upcoming.length > 0) {
    const target = overdue[0] ?? upcoming[0];
    const diff = target.kmThreshold - safeKm;
    const msg =
      diff <= 0
        ? `A ${safeKm.toLocaleString('it-IT')} km è il momento di verificare ${target.componentName}.`
        : `Mancano circa ${diff.toLocaleString('it-IT')} km a: ${target.componentName}.`;

    return {
      status: 'attention',
      headline: msg,
      overdue,
      upcoming,
      future,
    };
  }

  return {
    status: 'ok',
    headline: `A ${safeKm.toLocaleString('it-IT')} km sei in zona verde sul ${engine.code}. Continua con tagliandi puntuali!`,
    overdue,
    upcoming,
    future,
  };
}

export function evaluateCategorizedMaintenance(
  currentKm: number,
  _vehicle: VehicleModel,
  engine: EngineWiki,
  transmission: GarageCar['transmission'],
  logs: MaintenanceLogEntry[] = [],
): CategorizedMaintenanceReport {
  const safeKm = Math.max(0, Number.isFinite(currentKm) ? currentKm : 0);

  const logByTaskId = new Map<string, MaintenanceLogEntry>();
  let totalSpentEur = 0;
  for (const log of logs) {
    if (typeof log.costEur === 'number' && Number.isFinite(log.costEur)) {
      totalSpentEur += log.costEur;
    }
    const prev = logByTaskId.get(log.taskId);
    if (!prev || log.completedAtKm >= prev.completedAtKm) {
      logByTaskId.set(log.taskId, log);
    }
  }

  const applicableBaseTasks = BASE_MAINTENANCE_TASKS.filter((task) => {
    if (task.appliesToFuels && !task.appliesToFuels.includes(engine.fuelType)) return false;
    if (task.appliesToTransmissions && !task.appliesToTransmissions.includes(transmission)) {
      return false;
    }
    return true;
  });

  // Converte anche le milestone specifiche del codice motore in task della categoria engine_timing
  const engineSpecificTasks: CategoryMaintenanceTask[] = engine.milestones.map((m) => ({
    id: `eng-${engine.id}-${m.id}`,
    category: 'engine_timing',
    title: `${m.componentName} (${engine.code})`,
    intervalKm: m.kmThreshold,
    severity: m.severity,
    whatItIs: m.whatItIs,
    symptoms: m.symptoms,
    ifIgnored: `Possibile guasto critico sul ${engine.code} oltre i ${m.kmThreshold.toLocaleString('it-IT')} km.`,
    estimatedCostEur: m.estimatedCostEur,
    preventionTip: m.preventionAndMods,
  }));

  const evaluateTask = (
    task: CategoryMaintenanceTask,
    source: 'base' | 'engine_specific',
  ): EvaluatedCategoryTask => {
    const lastCompleted = logByTaskId.get(task.id);
    let nextDueKm: number;

    if (lastCompleted) {
      nextDueKm = lastCompleted.completedAtKm + task.intervalKm;
    } else if (source === 'engine_specific') {
      nextDueKm = task.intervalKm;
    } else {
      // Per voci ricorrenti (es. olio ogni 15.000 km) senza log pregressi:
      // se sei entro un intervallo dalla prima soglia, usa task.intervalKm; altrimenti scaduto/prossimo ciclo.
      nextDueKm =
        safeKm <= task.intervalKm
          ? task.intervalKm
          : Math.floor(safeKm / task.intervalKm) * task.intervalKm;
    }

    const remainingKm = nextDueKm - safeKm;
    const windowThreshold = Math.min(UPCOMING_WINDOW_KM, Math.round(task.intervalKm * 0.25));

    let status: EvaluatedCategoryTask['status'] = 'ok';
    if (remainingKm <= 0) {
      status = 'overdue';
    } else if (remainingKm <= Math.max(3000, windowThreshold)) {
      status = 'upcoming';
    }

    return {
      task,
      source,
      status,
      nextDueKm,
      remainingKm,
      lastCompleted,
    };
  };

  const allTasks: EvaluatedCategoryTask[] = [
    ...engineSpecificTasks.map((t) => evaluateTask(t, 'engine_specific')),
    ...applicableBaseTasks.map((t) => evaluateTask(t, 'base')),
  ];

  const categories: CategoryHealthSummary[] = MAINTENANCE_CATEGORIES.map((cat) => {
    const tasks = allTasks
      .filter((t) => t.task.category === cat.id)
      .sort((a, b) => a.remainingKm - b.remainingKm);
    const overdueCount = tasks.filter((t) => t.status === 'overdue').length;
    const upcomingCount = tasks.filter((t) => t.status === 'upcoming').length;

    const total = Math.max(1, tasks.length);
    const penalty = overdueCount * 32 + upcomingCount * 12;
    const healthPct = Math.max(12, Math.min(100, Math.round(100 - (penalty / total) * 1.4)));

    return {
      category: cat.id,
      label: cat.label,
      shortLabel: cat.shortLabel,
      description: cat.description,
      healthPct,
      overdueCount,
      upcomingCount,
      tasks,
    };
  });

  const totalOverdue = allTasks.filter((t) => t.status === 'overdue').length;
  const totalUpcoming = allTasks.filter((t) => t.status === 'upcoming').length;
  const overallHealthPct = Math.round(
    categories.reduce((acc, c) => acc + c.healthPct, 0) / Math.max(1, categories.length),
  );

  return {
    overallHealthPct,
    totalOverdue,
    totalUpcoming,
    totalSpentEur,
    categories,
    allTasks,
  };
}
