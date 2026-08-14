import { useEffect, useMemo, useState } from 'react';
import type { DayRecord } from './types';
import { getAllDays, upsertDays, deleteDay, clearAllDays } from './lib/db';
import { computeStats } from './lib/stats';
import { formatCompact, formatGrams } from './lib/numeric';
import { StatTile } from './components/StatTile';
import { CaloriesTrendChart } from './components/CaloriesTrendChart';
import { MacroCompositionChart } from './components/MacroCompositionChart';
import { DayList } from './components/DayList';
import { DataTable } from './components/DataTable';
import { ImportPanel } from './components/ImportPanel';
import { ExportPanel } from './components/ExportPanel';
import { DayDetail } from './components/DayDetail';
import { AllItemsView } from './components/AllItemsView';
import { DashboardIcon, DaysIcon, ImportIcon, TableIcon } from './components/icons';

type Tab = 'dashboard' | 'days' | 'import' | 'table';
type Overlay = { type: 'day'; key: string } | { type: 'items'; filter?: string } | null;

const TABS: { id: Tab; label: string; icon: () => JSX.Element }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
  { id: 'days', label: 'Days', icon: DaysIcon },
  { id: 'import', label: 'Import', icon: ImportIcon },
  { id: 'table', label: 'Data', icon: TableIcon },
];

export default function App() {
  const [days, setDays] = useState<DayRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('dashboard');
  const [overlay, setOverlay] = useState<Overlay>(null);

  useEffect(() => {
    getAllDays().then((d) => {
      setDays(d);
      setLoading(false);
      if (d.length === 0) setTab('import');
    });
  }, []);

  const stats = useMemo(() => computeStats(days), [days]);

  async function handleImport(newDays: DayRecord[]) {
    await upsertDays(newDays);
    setDays(await getAllDays());
    setTab('dashboard');
  }

  async function handleDeleteDay(key: string) {
    await deleteDay(key);
    setDays(await getAllDays());
    setOverlay(null);
  }

  async function handleDeleteItem(dayKey: string, itemIndex: number) {
    const day = days.find((d) => d.key === dayKey);
    if (!day) return;

    const remaining = day.items.filter((_, i) => i !== itemIndex);
    if (remaining.length === 0) {
      await handleDeleteDay(dayKey);
      return;
    }

    const totals = remaining.reduce(
      (acc, it) => ({
        calories: acc.calories + (it.caloriesG ?? 0),
        carbs: acc.carbs + (it.carbsG ?? 0),
        protein: acc.protein + (it.proteinG ?? 0),
      }),
      { calories: 0, carbs: 0, protein: 0 },
    );

    await upsertDays([{ ...day, items: remaining, totals }]);
    setDays(await getAllDays());
  }

  async function handleClearAll() {
    if (!window.confirm('Delete all imported days from this device? This cannot be undone.')) return;
    await clearAllDays();
    setDays([]);
    setOverlay(null);
    setTab('import');
  }

  function switchTab(id: Tab) {
    setOverlay(null);
    setTab(id);
  }

  const caloriesTrend = stats.plottable.slice(-14).map((d) => d.calories);
  const overlayDay = overlay?.type === 'day' ? days.find((d) => d.key === overlay.key) : undefined;

  return (
    <>
      <header className="app-header">
        <h1>Calorie Tracker</h1>
        <p>Your macros, day to day — stored only on this device.</p>
      </header>

      <main className="app-main">
        {loading ? null : overlay?.type === 'day' && overlayDay ? (
          <DayDetail day={overlayDay} onBack={() => setOverlay(null)} onDeleteDay={handleDeleteDay} onDeleteItem={handleDeleteItem} />
        ) : overlay?.type === 'items' ? (
          <AllItemsView
            days={days}
            initialFilter={overlay.filter}
            onBack={() => setOverlay(null)}
            onSelectDay={(key) => setOverlay({ type: 'day', key })}
          />
        ) : tab === 'dashboard' ? (
          days.length === 0 ? (
            <div className="empty-state">
              <div className="icon">📊</div>
              <h2>No data to show yet</h2>
              <p>Import a diet log JSON to see your stats and charts.</p>
              <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => switchTab('import')}>
                Go to Import
              </button>
            </div>
          ) : (
            <>
              <div className="section">
                <h2 className="section-title">Overview</h2>
                <div className="stat-grid">
                  <StatTile label="Days logged" value={String(stats.daysLogged)} />
                  <StatTile label="Current streak" value={String(stats.currentStreak)} unit={stats.currentStreak === 1 ? 'day' : 'days'} />
                  <StatTile label="Avg calories / day" value={formatCompact(stats.avgCalories)} trend={caloriesTrend} />
                  <StatTile label="Avg protein / day" value={formatGrams(stats.avgProtein)} />
                  <StatTile label="Avg carbs / day" value={formatGrams(stats.avgCarbs)} />
                  <StatTile label="Items logged" value={String(stats.totalItemsLogged)} onClick={() => setOverlay({ type: 'items' })} />
                </div>
              </div>

              <div className="section">
                <h2 className="section-title">Calories over time</h2>
                <CaloriesTrendChart data={stats.plottable} avg={stats.avgCalories} />
              </div>

              <div className="section">
                <h2 className="section-title">Calorie composition per day</h2>
                <MacroCompositionChart data={stats.plottable} />
              </div>

              <div className="section">
                <h2 className="section-title">Highs &amp; lows</h2>
                <div className="stat-grid">
                  {stats.highestCalorieDay && (
                    <StatTile
                      label={`Highest · ${stats.highestCalorieDay.label}`}
                      value={formatCompact(stats.highestCalorieDay.calories)}
                      unit="cal"
                      onClick={() => setOverlay({ type: 'day', key: stats.highestCalorieDay!.key })}
                    />
                  )}
                  {stats.lowestCalorieDay && (
                    <StatTile
                      label={`Lowest · ${stats.lowestCalorieDay.label}`}
                      value={formatCompact(stats.lowestCalorieDay.calories)}
                      unit="cal"
                      onClick={() => setOverlay({ type: 'day', key: stats.lowestCalorieDay!.key })}
                    />
                  )}
                </div>
              </div>

              {stats.topFoods.length > 0 && (
                <div className="section">
                  <h2 className="section-title">Frequently logged</h2>
                  <div className="card">
                    <ul className="top-foods-list">
                      {stats.topFoods.map((f) => (
                        <li key={f.name}>
                          <button onClick={() => setOverlay({ type: 'items', filter: f.name })}>
                            <span>{f.name}</span>
                            <span className="count">×{f.count}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </>
          )
        ) : tab === 'days' ? (
          <DayList days={days} onSelect={(key) => setOverlay({ type: 'day', key })} />
        ) : tab === 'import' ? (
          <ImportPanel onImport={handleImport} />
        ) : (
          <>
            <DataTable days={days} onSelect={(key) => setOverlay({ type: 'day', key })} />
            <ExportPanel days={days} />
            {days.length > 0 && (
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <button className="btn btn-danger" onClick={handleClearAll}>
                  Clear all data
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <nav className="tab-bar">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} className={tab === id && !overlay ? 'active' : ''} onClick={() => switchTab(id)}>
            <Icon />
            {label}
          </button>
        ))}
      </nav>
    </>
  );
}
