import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { Wifi, WifiOff, Trash2, Download, RotateCcw, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import ToolLayout from '@components/layout/ToolLayout';
import Checkbox from '@components/ui/Checkbox';
import SegmentedControl from '@components/ui/SegmentedControl';
import Button from '@components/ui/Button';
import { EmptyState, Panel, ResultRows } from '@components/workspace';
import useLocalStorage from '@hooks/useLocalStorage';
import useUrlOptions from '@hooks/useUrlOptions';
import { opt } from '@lib/url-state';
import { downloadFile } from '@lib/download-utils';

const schema = {
  tab: opt.oneOf(['history', 'statistics'] as const, 'history'),
  filter: opt.oneOf(['all', 'online', 'offline', 'errors'] as const, 'all'),
};

interface NetworkStats {
  totalConnections: number;
  totalDisconnections: number;
  sessionStartTime: number;
  totalOnlineTime: number;
  totalOfflineTime: number;
  longestOfflineTime: number;
}

interface NetworkSettings {
  notifications: boolean;
  sound: boolean;
  autoTest: boolean;
}

interface HistoryEntry {
  type: string;
  message: string;
  time: string;
}

interface ConnectionInfo {
  type?: string;
  effectiveType?: string;
  downlink?: string;
  rtt?: string;
}

export default function NetworkStatusPage() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [history, setHistory] = useLocalStorage<HistoryEntry[]>('networkHistory', []);
  const [stats, setStats] = useLocalStorage<NetworkStats>('networkStats', {
    totalConnections: 0, totalDisconnections: 0, sessionStartTime: Date.now(),
    totalOnlineTime: 0, totalOfflineTime: 0, longestOfflineTime: 0,
  });
  const [settings, setSettings] = useLocalStorage<NetworkSettings>('networkMonitorSettings', {
    notifications: true, sound: true, autoTest: true,
  });

  const [o, setO] = useUrlOptions(schema);
  const activeTab = o.tab;
  const filter = o.filter;
  const [testing, setTesting] = useState(false);
  const [pingResult, setPingResult] = useState('Not tested');
  const [speedResult, setSpeedResult] = useState('Not tested');
  const [dnsResult, setDnsResult] = useState('Not tested');
  const [testProgress, setTestProgress] = useState(0);

  const autoTestRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const offlineStartRef = useRef<number | null>(null);
  const onlineStartRef = useRef<number | null>(isOnline ? Date.now() : null);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const [connInfo, setConnInfo] = useState<ConnectionInfo>({});
  const updateConnInfo = useCallback(() => {
    const conn = navigator.connection;
    if (conn) {
      setConnInfo({
        type: conn.type || 'Unknown', effectiveType: conn.effectiveType || 'Unknown',
        downlink: conn.downlink ? `${conn.downlink} Mbps` : 'Unknown', rtt: conn.rtt ? `${conn.rtt} ms` : 'Unknown',
      });
    } else {
      setConnInfo({ type: 'N/A', effectiveType: 'N/A', downlink: 'N/A', rtt: 'N/A' });
    }
  }, []);

  const addToHistory = useCallback((type: string, message: string) => {
    setHistory((prev) => [{ type, message, time: new Date().toLocaleString() }, ...prev].slice(0, 100));
  }, [setHistory]);

  const playSound = useCallback((type: string) => {
    if (!settingsRef.current.sound) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext!)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      if (type === 'online') { osc.frequency.setValueAtTime(800, ctx.currentTime); osc.frequency.setValueAtTime(1000, ctx.currentTime + 0.1); }
      else { osc.frequency.setValueAtTime(400, ctx.currentTime); osc.frequency.setValueAtTime(300, ctx.currentTime + 0.1); }
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.2);
    } catch {}
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (offlineStartRef.current) {
        const offlineTime = Date.now() - offlineStartRef.current;
        setStats((prev) => ({ ...prev, totalConnections: prev.totalConnections + 1, totalOfflineTime: prev.totalOfflineTime + offlineTime, longestOfflineTime: Math.max(prev.longestOfflineTime, offlineTime) }));
        offlineStartRef.current = null;
      }
      onlineStartRef.current = Date.now();
      addToHistory('online', 'Connection restored');
      playSound('online');
      if (settingsRef.current.notifications) toast.success('You are back online');
    };
    const handleOffline = () => {
      setIsOnline(false);
      if (onlineStartRef.current) {
        const onlineTime = Date.now() - onlineStartRef.current;
        setStats((prev) => ({ ...prev, totalDisconnections: prev.totalDisconnections + 1, totalOnlineTime: prev.totalOnlineTime + onlineTime }));
        onlineStartRef.current = null;
      }
      offlineStartRef.current = Date.now();
      addToHistory('offline', 'Connection lost');
      playSound('offline');
      if (settingsRef.current.notifications) toast.error('You are currently offline');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    if (navigator.connection) navigator.connection.addEventListener('change', updateConnInfo);
    updateConnInfo();
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (navigator.connection) navigator.connection.removeEventListener('change', updateConnInfo);
    };
  }, [addToHistory, playSound, setStats, updateConnInfo]);

  const testingRef = useRef(false);

  const runTest = useCallback(async () => {
    if (testingRef.current) return;
    testingRef.current = true;
    setTesting(true); setTestProgress(0);
    setPingResult('Testing...'); setSpeedResult('Testing...'); setDnsResult('Testing...');
    try {
      setTestProgress(33);
      try { const start = Date.now(); await fetch('/favicon.ico', { method: 'HEAD', cache: 'no-cache', mode: 'no-cors' }); setPingResult(`${Date.now() - start}ms`); } catch { setPingResult('Failed'); }
      setTestProgress(66);
      try { const start = Date.now(); const res = await fetch('/icon.png', { cache: 'no-cache' }); const blob = await res.blob(); const dur = (Date.now() - start) / 1000; setSpeedResult(`${((blob.size * 8) / dur / 1000000).toFixed(2)} Mbps`); } catch { setSpeedResult('Failed'); }
      setTestProgress(100);
      try { const start = Date.now(); await fetch('https://dns.google/resolve?name=google.com&type=A', { cache: 'no-cache' }); setDnsResult(`${Date.now() - start}ms`); } catch {
        try { const start = Date.now(); await fetch('https://www.google.com', { method: 'HEAD', cache: 'no-cache', mode: 'no-cors' }); setDnsResult(`${Date.now() - start}ms`); } catch { setDnsResult('Failed'); }
      }
    } finally { setTimeout(() => { setTesting(false); testingRef.current = false; setTestProgress(0); }, 1000); }
  }, []);

  useEffect(() => {
    if (settings.autoTest) { autoTestRef.current = setInterval(() => runTest(), 30000); }
    return () => { if (autoTestRef.current) clearInterval(autoTestRef.current); };
  }, [settings.autoTest, runTest]);

  const filteredHistory = filter === 'all' ? history : history.filter((e) => {
    if (filter === 'errors') return e.type === 'error' || e.message.includes('failed');
    return e.type === filter;
  });

  const uptimePercent = (() => {
    let totalOn = stats.totalOnlineTime; let totalOff = stats.totalOfflineTime;
    if (isOnline && onlineStartRef.current) totalOn += Date.now() - onlineStartRef.current;
    if (!isOnline && offlineStartRef.current) totalOff += Date.now() - offlineStartRef.current;
    const total = totalOn + totalOff;
    return total > 0 ? ((totalOn / total) * 100).toFixed(1) : '100.0';
  })();

  const avgConnTime = stats.totalConnections > 0
    ? ((stats.totalOnlineTime + (isOnline && onlineStartRef.current ? Date.now() - onlineStartRef.current : 0)) / stats.totalConnections / 1000).toFixed(0) : '0';

  const updateSetting = (key: keyof NetworkSettings, val: boolean) => setSettings((prev) => ({ ...prev, [key]: val }));

  const handleExport = () => {
    const data = { history, statistics: stats, exportTime: new Date().toISOString() };
    downloadFile(JSON.stringify(data, null, 2), `network-log-${new Date().toISOString().split('T')[0]}.json`, 'application/json');
  };

  const handleReset = () => {
    toast('Reset all settings and clear data?', {
      action: {
        label: 'Confirm',
        onClick: () => {
          setHistory([]); setStats({ totalConnections: 0, totalDisconnections: 0, sessionStartTime: Date.now(), totalOnlineTime: 0, totalOfflineTime: 0, longestOfflineTime: 0 });
          setSettings({ notifications: true, sound: true, autoTest: true }); toast.success('Settings reset');
        },
      },
    });
  };

  return (
    <ToolLayout
      seoTitle="Network Status Monitor – Online/Offline, Latency & Speed"
      tagline="Watch your connection status in real time, test latency and log outages"
      metaDescription="Monitor your network connection status in real-time with visual indicators and connection quality metrics."
      about={
        <ul className="grid gap-3 md:grid-cols-2">
          <li><strong className="text-text">How it works.</strong> The browser’s online/offline events and the Network Information API (where supported) report connection changes as they happen.</li>
          <li><strong className="text-text">Tests.</strong> “Test now” measures a round trip and a small download against public endpoints. It sends no personal data; results are rough indicators.</li>
          <li><strong className="text-text">Alerts.</strong> Optional browser notifications and a short beep tell you when the connection drops or returns.</li>
          <li><strong className="text-text">History.</strong> Events and statistics are kept in this browser only, and you can export them as a log file.</li>
        </ul>
      }
    >
      {!isOnline && (
        <div role="alert" className="mb-4 flex items-center gap-3 rounded-lg border border-error/40 bg-error/10 p-3 text-error">
          <WifiOff size={18} aria-hidden="true" /><span className="font-medium">You are offline</span>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 mb-4 items-start">
        <Panel
          title="Current status"
          actions={
            <span role="status" className={`inline-flex items-center gap-2 text-sm font-medium ${isOnline ? 'text-success' : 'text-error'}`}>
              <span aria-hidden="true" className={`w-2 h-2 rounded-full ${isOnline ? 'bg-success' : 'bg-error'}`} />
              {isOnline ? 'Online' : 'Offline'}
            </span>
          }
        >
          <ResultRows
            labelWidth="sm:w-36"
            rows={[
              { label: 'Connection type', value: connInfo.type ?? 'Unknown', copy: false, mono: false },
              { label: 'Effective type', value: connInfo.effectiveType ?? 'Unknown', copy: false, mono: false },
              { label: 'Downlink', value: connInfo.downlink ?? 'Unknown', copy: false, mono: false },
              { label: 'Round-trip time', value: connInfo.rtt ?? 'Unknown', copy: false, mono: false },
            ]}
          />
        </Panel>

        <Panel
          title="Connection test"
          actions={<Button size="sm" onClick={runTest} disabled={testing}>{testing ? 'Testing…' : 'Test now'}</Button>}
        >
          <ResultRows
            labelWidth="sm:w-36"
            rows={[['Ping', pingResult], ['Download speed', speedResult], ['DNS resolution', dnsResult]].map(([label, val]) => ({
              label,
              value: String(val),
              copy: false,
              mono: false,
              display: <span className={val === 'Failed' ? 'text-error' : String(val).includes('Testing') ? 'text-warning' : val === 'Not tested' ? 'text-text-muted' : 'text-success'}>{val}</span>,
            }))}
          />
          {testing && (
            <div className="mt-3 w-full bg-border rounded-full h-1.5 overflow-hidden" role="progressbar" aria-valuenow={testProgress} aria-valuemin={0} aria-valuemax={100} aria-label="Test progress">
              <motion.div className="h-full bg-primary rounded-full" animate={{ width: `${testProgress}%` }} />
            </div>
          )}
        </Panel>

        <Panel title="Alerts" bodyClassName="p-4 space-y-3">
          {([['notifications', 'Browser notifications on status changes'], ['sound', 'Sound alerts'], ['autoTest', 'Auto-test every 30 s']] as const).map(([key, label]) => (
            <Checkbox key={key} checked={settings[key]} onChange={(val) => updateSetting(key, val)} label={label} />
          ))}
        </Panel>

        <Panel title="Data" bodyClassName="p-4 flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => { toast('Clear all connection history?', { action: { label: 'Confirm', onClick: () => { setHistory([]); toast.success('Cleared'); } } }); }}><Trash2 size={14} aria-hidden="true" /> Clear history</Button>
          <Button variant="secondary" size="sm" onClick={handleExport}><Download size={14} aria-hidden="true" /> Export log</Button>
          <Button variant="secondary" size="sm" onClick={handleReset}><RotateCcw size={14} aria-hidden="true" /> Reset statistics</Button>
        </Panel>
      </div>

      <Panel
        title={activeTab === 'history' ? 'Connection history' : 'Statistics'}
        bodyClassName="p-4"
        actions={<SegmentedControl ariaLabel="View" options={[{ id: 'history', label: 'History' }, { id: 'statistics', label: 'Statistics' }]} value={activeTab} onChange={(v) => setO({ tab: v as typeof activeTab })} />}
      >
        {activeTab === 'history' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <select aria-label="Filter events" value={filter} onChange={(e) => setO({ filter: e.target.value as typeof filter })} className="h-8 pl-2.5 pr-8 rounded-md bg-surface-alt border border-border-strong text-sm text-text focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25">
                <option value="all">All events</option>
                <option value="online">Online events</option>
                <option value="offline">Offline events</option>
                <option value="errors">Connection errors</option>
              </select>
              <Button variant="ghost" size="sm" onClick={updateConnInfo}><RefreshCw size={14} aria-hidden="true" /> Refresh</Button>
            </div>
            {filteredHistory.length === 0 ? (
              <EmptyState icon={Wifi} title="No events recorded yet" />
            ) : (
              <ul className="space-y-1.5 max-h-80 overflow-y-auto">
                {filteredHistory.map((e, i) => (
                  <li key={i} className={`flex items-center justify-between gap-3 p-2.5 rounded-md text-sm border ${e.type === 'online' ? 'bg-success/10 border-success/25' : 'bg-error/10 border-error/25'}`}>
                    <span className="flex items-center gap-2">
                      {e.type === 'online' ? <Wifi size={14} aria-hidden="true" className="text-success" /> : <WifiOff size={14} aria-hidden="true" className="text-error" />}
                      <span className={e.type === 'online' ? 'text-success' : 'text-error'}>{e.message}</span>
                    </span>
                    <span className="text-xs text-text-muted">{e.time}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {activeTab === 'statistics' && (
          <dl className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              [uptimePercent + '%', 'Uptime'],
              [stats.totalDisconnections, 'Disconnections'],
              [avgConnTime + 's', 'Avg connection time'],
              [(stats.longestOfflineTime / 1000).toFixed(0) + 's', 'Longest offline'],
            ].map(([val, label]) => (
              <div key={label} className="flex flex-col-reverse rounded-md border border-border bg-surface-alt p-4 text-center">
                <dt className="mt-1 text-xs text-text-muted">{label}</dt>
                <dd className="text-2xl font-semibold text-text tabular-nums">{val}</dd>
              </div>
            ))}
          </dl>
        )}
      </Panel>
    </ToolLayout>
  );
}
