import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { Wifi, WifiOff, Trash2, Download, RotateCcw, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ToolLayout from '@components/layout/ToolLayout';
import Card from '@components/ui/Card';
import Tabs from '@components/ui/Tabs';
import useLocalStorage from '@hooks/useLocalStorage';
import { SecondaryButton } from '@components/ui/Button';
import { downloadFile } from '@lib/download-utils';

const tabList = [
  { id: 'history', label: 'Connection History' },
  { id: 'statistics', label: 'Statistics' },
];

export default function NetworkStatusPage() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [history, setHistory] = useLocalStorage('networkHistory', []);
  const [stats, setStats] = useLocalStorage('networkStats', {
    totalConnections: 0,
    totalDisconnections: 0,
    sessionStartTime: Date.now(),
    totalOnlineTime: 0,
    totalOfflineTime: 0,
    longestOfflineTime: 0,
  });
  const [settings, setSettings] = useLocalStorage('networkMonitorSettings', {
    notifications: true,
    sound: true,
    autoTest: true,
  });

  const [activeTab, setActiveTab] = useState('history');
  const [filter, setFilter] = useState('all');
  const [testing, setTesting] = useState(false);
  const [pingResult, setPingResult] = useState('Not tested');
  const [speedResult, setSpeedResult] = useState('Not tested');
  const [dnsResult, setDnsResult] = useState('Not tested');
  const [testProgress, setTestProgress] = useState(0);

  const autoTestRef = useRef(null);
  const offlineStartRef = useRef(null);
  const onlineStartRef = useRef(isOnline ? Date.now() : null);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  // Connection Info
  const [connInfo, setConnInfo] = useState({});
  const updateConnInfo = useCallback(() => {
    const conn = navigator.connection;
    if (conn) {
      setConnInfo({
        type: conn.type || 'Unknown',
        effectiveType: conn.effectiveType || 'Unknown',
        downlink: conn.downlink ? `${conn.downlink} Mbps` : 'Unknown',
        rtt: conn.rtt ? `${conn.rtt} ms` : 'Unknown',
      });
    } else {
      setConnInfo({ type: 'N/A', effectiveType: 'N/A', downlink: 'N/A', rtt: 'N/A' });
    }
  }, []);

  const addToHistory = useCallback((type, message) => {
    setHistory((prev) => [{ type, message, time: new Date().toLocaleString() }, ...prev].slice(0, 100));
  }, [setHistory]);

  const playSound = useCallback((type) => {
    if (!settingsRef.current.sound) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
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

  // Online/offline handlers
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (offlineStartRef.current) {
        const offlineTime = Date.now() - offlineStartRef.current;
        setStats((prev) => ({
          ...prev,
          totalConnections: prev.totalConnections + 1,
          totalOfflineTime: prev.totalOfflineTime + offlineTime,
          longestOfflineTime: Math.max(prev.longestOfflineTime, offlineTime),
        }));
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
        setStats((prev) => ({
          ...prev,
          totalDisconnections: prev.totalDisconnections + 1,
          totalOnlineTime: prev.totalOnlineTime + onlineTime,
        }));
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
    setTesting(true);
    setTestProgress(0);
    setPingResult('Testing...'); setSpeedResult('Testing...'); setDnsResult('Testing...');
    try {
      // Ping
      setTestProgress(33);
      try {
        const start = Date.now();
        await fetch('/favicon.ico', { method: 'HEAD', cache: 'no-cache', mode: 'no-cors' });
        setPingResult(`${Date.now() - start}ms`);
      } catch { setPingResult('Failed'); }

      // Speed
      setTestProgress(66);
      try {
        const start = Date.now();
        const res = await fetch('/icon.png', { cache: 'no-cache' });
        const blob = await res.blob();
        const dur = (Date.now() - start) / 1000;
        setSpeedResult(`${((blob.size * 8) / dur / 1000000).toFixed(2)} Mbps`);
      } catch { setSpeedResult('Failed'); }

      // DNS
      setTestProgress(100);
      try {
        const start = Date.now();
        await fetch('https://dns.google/resolve?name=google.com&type=A', { cache: 'no-cache' });
        setDnsResult(`${Date.now() - start}ms`);
      } catch {
        try {
          const start = Date.now();
          await fetch('https://www.google.com', { method: 'HEAD', cache: 'no-cache', mode: 'no-cors' });
          setDnsResult(`${Date.now() - start}ms`);
        } catch { setDnsResult('Failed'); }
      }
    } finally {
      setTimeout(() => { setTesting(false); testingRef.current = false; setTestProgress(0); }, 1000);
    }
  }, []);

  // Auto test
  useEffect(() => {
    if (settings.autoTest) {
      autoTestRef.current = setInterval(() => runTest(), 30000);
    }
    return () => { if (autoTestRef.current) clearInterval(autoTestRef.current); };
  }, [settings.autoTest, runTest]);

  const filteredHistory = filter === 'all' ? history : history.filter((e) => {
    if (filter === 'errors') return e.type === 'error' || e.message.includes('failed');
    return e.type === filter;
  });

  // Computed stats
  const uptimePercent = (() => {
    let totalOn = stats.totalOnlineTime;
    let totalOff = stats.totalOfflineTime;
    if (isOnline && onlineStartRef.current) totalOn += Date.now() - onlineStartRef.current;
    if (!isOnline && offlineStartRef.current) totalOff += Date.now() - offlineStartRef.current;
    const total = totalOn + totalOff;
    return total > 0 ? ((totalOn / total) * 100).toFixed(1) : '100.0';
  })();

  const avgConnTime = stats.totalConnections > 0
    ? ((stats.totalOnlineTime + (isOnline && onlineStartRef.current ? Date.now() - onlineStartRef.current : 0)) / stats.totalConnections / 1000).toFixed(0)
    : '0';

  const updateSetting = (key, val) => setSettings((prev) => ({ ...prev, [key]: val }));

  const handleExport = () => {
    const data = { history, statistics: stats, exportTime: new Date().toISOString() };
    downloadFile(
      JSON.stringify(data, null, 2),
      `network-log-${new Date().toISOString().split('T')[0]}.json`,
      'application/json'
    );
  };

  const handleReset = () => {
    if (confirm('Reset all settings and clear data?')) {
      setHistory([]);
      setStats({ totalConnections: 0, totalDisconnections: 0, sessionStartTime: Date.now(), totalOnlineTime: 0, totalOfflineTime: 0, longestOfflineTime: 0 });
      setSettings({ notifications: true, sound: true, autoTest: true });
      toast.success('Settings reset');
    }
  };

  return (
    <ToolLayout
      title="Network Status Monitor"
      tagline="Monitor your network connection status in real-time"
      metaDescription="Monitor your network connection status in real-time with visual indicators and connection quality metrics."
    >
      {/* Banner */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="mb-6 bg-red-500 text-white rounded-xl p-4 flex items-center gap-3 shadow-lg">
            <WifiOff size={20} /><span className="font-semibold">You are offline</span>
          </motion.div>
        )}
      </AnimatePresence>

      <Card>
        <div className="p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-5">
            {/* Current Status */}
            <div className="bg-slate-50 rounded-lg border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-700">Current Status</h3>
                <div className={`flex items-center gap-2 text-sm font-semibold ${isOnline ? 'text-green-600' : 'text-red-500'}`}>
                  <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                  {isOnline ? 'Online' : 'Offline'}
                </div>
              </div>
              <div className="space-y-2.5 text-sm">
                {Object.entries({ 'Connection Type': connInfo.type, 'Effective Type': connInfo.effectiveType, Downlink: connInfo.downlink, RTT: connInfo.rtt, 'Last Updated': new Date().toLocaleTimeString() }).map(([k, v]) => (
                  <div key={k} className="flex justify-between"><span className="text-slate-500">{k}:</span><span className="font-medium text-slate-700">{v}</span></div>
                ))}
              </div>
            </div>

            {/* Connection Test */}
            <div className="bg-slate-50 rounded-lg border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-700">Connection Test</h3>
                <button onClick={runTest} disabled={testing} className="px-4 py-1.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-hover transition disabled:opacity-50">
                  {testing ? 'Testing...' : 'Test Now'}
                </button>
              </div>
              <div className="space-y-2.5 text-sm">
                {[['Ping Test', pingResult], ['Speed Test', speedResult], ['DNS Resolution', dnsResult]].map(([label, val]) => (
                  <div key={label} className="flex justify-between"><span className="text-slate-500">{label}:</span>
                    <span className={`font-medium ${val === 'Failed' ? 'text-red-500' : String(val).includes('Testing') ? 'text-amber-500' : 'text-green-600'}`}>{val}</span>
                  </div>
                ))}
              </div>
              {testing && (
                <div className="mt-3 w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <motion.div className="h-full bg-primary rounded-full" animate={{ width: `${testProgress}%` }} />
                </div>
              )}
            </div>
          </div>

          {/* Settings */}
          <div className="grid md:grid-cols-2 gap-5">
            <div className="bg-slate-50 rounded-lg border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-700 mb-3">Notification Settings</h3>
              <div className="space-y-3">
                {[['notifications', 'Enable status notifications'], ['sound', 'Enable sound alerts'], ['autoTest', 'Auto-test every 30s']].map(([key, label]) => (
                  <label key={key} className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={settings[key]} onChange={(e) => updateSetting(key, e.target.checked)} className="w-4 h-4 accent-primary" />
                    <span className="text-sm text-slate-600">{label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="bg-slate-50 rounded-lg border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-700 mb-3">Actions</h3>
              <div className="flex flex-wrap gap-2">
                <SecondaryButton onClick={() => { if (confirm('Clear history?')) { setHistory([]); toast.success('Cleared'); } }}><Trash2 size={14} /> Clear History</SecondaryButton>
                <SecondaryButton onClick={handleExport}><Download size={14} /> Export Log</SecondaryButton>
                <SecondaryButton onClick={handleReset}><RotateCcw size={14} /> Reset</SecondaryButton>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* History/Statistics */}
      <Card>
        <Tabs tabs={tabList} activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="p-6">
          {activeTab === 'history' && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <select value={filter} onChange={(e) => setFilter(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20">
                  <option value="all">All Events</option>
                  <option value="online">Online Events</option>
                  <option value="offline">Offline Events</option>
                  <option value="errors">Connection Errors</option>
                </select>
                <SecondaryButton onClick={updateConnInfo}><RefreshCw size={14} /> Refresh</SecondaryButton>
              </div>
              {filteredHistory.length === 0 ? (
                <p className="text-sm text-slate-400 italic py-8 text-center">No events recorded yet.</p>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {filteredHistory.map((e, i) => (
                    <div key={i} className={`flex items-center justify-between p-3 rounded-lg text-sm ${e.type === 'online' ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'}`}>
                      <div className="flex items-center gap-2">
                        {e.type === 'online' ? <Wifi size={14} className="text-green-500" /> : <WifiOff size={14} className="text-red-500" />}
                        <span className={e.type === 'online' ? 'text-green-700' : 'text-red-700'}>{e.message}</span>
                      </div>
                      <span className="text-xs text-slate-400">{e.time}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'statistics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  [uptimePercent + '%', 'Uptime'],
                  [stats.totalDisconnections, 'Disconnections'],
                  [avgConnTime + 's', 'Avg Connection Time'],
                  [(stats.longestOfflineTime / 1000).toFixed(0) + 's', 'Longest Offline'],
                ].map(([val, label]) => (
                  <div key={label} className="bg-slate-50 rounded-lg border border-slate-200 p-4 text-center">
                    <div className="text-2xl font-bold text-primary">{val}</div>
                    <div className="text-xs text-slate-500 mt-1">{label}</div>
                  </div>
                ))}
              </div>
              <div className="bg-slate-50 rounded-lg border border-slate-200 p-5">
                <h3 className="font-semibold text-slate-700 mb-2">Connection Timeline</h3>
                <p className="text-sm text-slate-400 italic">Data will be visualized as events are recorded.</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Info */}
      <Card hover={false} className="bg-slate-50 border-slate-200">
        <div className="p-7">
          <h2 className="text-xl font-bold text-slate-800 border-b border-slate-200 pb-3 mb-5">About Network Monitoring</h2>
          <p className="text-slate-500 leading-relaxed mb-5">
            This tool monitors your network connection using the browser's Network Information API and online/offline event listeners.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              ['🌐 Real-time Monitoring', 'Continuously monitors your connection and provides instant feedback.'],
              ['📊 Connection Metrics', 'Displays type, speed, and round-trip time when available.'],
              ['🔔 Smart Notifications', 'Get notified on status changes with visual and audio alerts.'],
              ['📈 Historical Data', 'Track history and view statistics about uptime and quality.'],
            ].map(([title, desc]) => (
              <div key={title} className="bg-white rounded-lg p-4 shadow-sm border border-slate-100">
                <h3 className="font-semibold text-slate-700 mb-1">{title}</h3>
                <p className="text-sm text-slate-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </ToolLayout>
  );
}

