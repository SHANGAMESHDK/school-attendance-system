import React, { useState, useEffect } from 'react';
import emailjs from '@emailjs/browser';
import { Save, Clock, Server, Usb, Database, AlertTriangle } from 'lucide-react';
import { useSerial } from '../context/SerialContext';
import { db } from '../utils/db';

const Settings = () => {
  const [config, setConfig] = useState({
    schoolStartTime: '08:00'
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  const { isOpen, connect, disconnect, writeToSerial, serialLogs, setSerialLogs } = useSerial();

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = () => {
    try {
      const data = db.getConfig();
      setConfig(data);
    } catch (error) {
      console.error('Failed to fetch config:', error);
    }
  };

  const resetAttendance = async () => {
    if (confirm("Are you sure you want to close today's attendance? This will send 'absent' emails to all students who did not tap in today, and then clear the logs.")) {
      try {
        const students = db.getStudents();
        const logs = db.getAttendance();
        const today = new Date().toDateString();

        const absentStudents = students.filter(student => {
          return !logs.some(log => log.studentUid === student.uid && new Date(log.timestamp).toDateString() === today);
        });

        for (const student of absentStudents) {
          if (student.parentEmail) {
            const now = new Date();
            const scanTimeFormatted = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) + ', ' + now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            
            await emailjs.send(
              import.meta.env.VITE_EMAILJS_SERVICE_ID,
              import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
              {
                studentName: student.name,
                parentEmail: student.parentEmail,
                scanTime: scanTimeFormatted,
                statusText: 'been marked absent'
              },
              import.meta.env.VITE_EMAILJS_PUBLIC_KEY
            ).catch(err => console.error("Failed to email absent student:", err));
          }
        }

        db.clearAttendance();
        alert(`Attendance reset! Sent 'absent' emails to ${absentStudents.length} student(s).`);
      } catch (err) {
        console.error(err);
        alert("Failed to reset attendance logs.");
      }
    }
  };

  const clearStudents = () => {
    if (confirm("WARNING: This will permanently delete ALL registered students. Proceed?")) {
      try {
        db.clearStudents();
        alert("All students deleted.");
      } catch (err) {
        alert("Failed to delete students.");
      }
    }
  };

  const fetchPorts = async () => {
    try {
      const res = await axios.get(`${API_BASE}/ports`);
      setPorts(res.data);
      if (res.data.length > 0 && !selectedPort) {
        setSelectedPort(res.data[0].path);
      }
    } catch (error) {
      console.error('Failed to fetch ports:', error);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveStatus('');
    try {
      db.saveConfig(config);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      setSaveStatus('error');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="animate-slide-in">
      <header className="mb-8">
        <h2 className="text-3xl font-bold">System Settings</h2>
        <p className="text-slate-400">Configure ESP32 device parameters and system thresholds.</p>
      </header>

      <div className="max-w-2xl">
        <form onSubmit={handleSave} className="space-y-6">

          <div className="glass-card overflow-hidden">
            <div className="p-4 border-b border-slate-700/50 bg-slate-800/30 flex items-center gap-2">
              <Clock size={18} className="text-emerald-400" />
              <h3 className="font-semibold text-lg">Attendance Rules</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">School Start Time</label>
                <p className="text-xs text-slate-500 mb-2">Students arriving after this time will be marked as "LATE".</p>
                <input
                  type="time"
                  className="input-field w-full md:w-1/2"
                  value={config.schoolStartTime}
                  onChange={e => setConfig({ ...config, schoolStartTime: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          <div className="glass-card overflow-hidden">
            <div className="p-4 border-b border-slate-700/50 bg-slate-800/30 flex items-center gap-2">
              <Server size={18} className="text-slate-400" />
              <h3 className="font-semibold text-lg">Serial Connection Status</h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-400 mb-4">
                Connect directly to your hardware scanner using the Chrome USB interface. Keep this tab open to process attendance.
              </p>

              <div className="flex items-end gap-3 mb-4">
                <button
                  type="button"
                  onClick={isOpen ? disconnect : connect}
                  className={`flex-1 h-[42px] flex items-center justify-center gap-2 font-medium transition-colors ${isOpen ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'} rounded-lg`}
                >
                  <Usb size={18} />
                  {isOpen ? 'Disconnect Scanner' : 'Connect USB Scanner'}
                </button>
              </div>

              <div className="flex items-center gap-3 mt-4 p-3 bg-slate-900/50 rounded-lg">
                <span className="flex h-3 w-3 relative">
                  <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${isOpen ? 'bg-emerald-500 animate-ping' : 'bg-red-500'}`}></span>
                  <span className={`relative inline-flex rounded-full h-3 w-3 ${isOpen ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                </span>
                <span className="text-slate-300 text-sm font-medium tracking-wide">
                  {isOpen
                    ? `Connected & Listening`
                    : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>

          <div className="glass-card overflow-hidden">
            <div className="p-4 border-b border-slate-700/50 bg-slate-800/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server size={18} className="text-slate-400" />
                <h3 className="font-semibold text-lg">Live Serial Monitor</h3>
              </div>
              <button type="button" onClick={() => setSerialLogs([])} className="text-xs text-slate-400 hover:text-slate-200">
                Clear
              </button>
            </div>
            <div className="bg-[#0f172a] p-4 h-64 overflow-y-auto font-mono text-xs text-slate-300 flex flex-col gap-1">
              {serialLogs.length === 0 ? (
                <span className="text-slate-500 italic">Waiting for serial data...</span>
              ) : (
                serialLogs.map((log, i) => (
                  <div key={i} className="flex gap-3 border-b border-slate-800/50 pb-1">
                    <span className="text-blue-400 shrink-0">[{log.type}]</span>
                    <span className={log.type === 'ERROR' ? 'text-red-400' : 'text-slate-300'}>{log.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="glass-card overflow-hidden border-red-500/30">
            <div className="p-4 border-b border-red-500/20 bg-red-500/10 flex items-center gap-2">
              <Database size={18} className="text-red-400" />
              <h3 className="font-semibold text-lg text-red-200">Database Management</h3>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-400 mb-4 flex items-center gap-2">
                <AlertTriangle size={16} className="text-yellow-500" />
                Warning: These actions are irreversible and will permanently delete data from the system.
              </p>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={resetAttendance}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-lg transition-colors text-sm font-medium"
                >
                  Reset Attendance (Send Absent Emails)
                </button>
                <button
                  type="button"
                  onClick={clearStudents}
                  className="px-4 py-2 bg-red-900/50 hover:bg-red-800/80 text-red-200 border border-red-800 rounded-lg transition-colors text-sm font-medium"
                >
                  Delete All Students
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-4">
            {saveStatus === 'success' && (
              <span className="text-emerald-400 text-sm animate-pulse-fast">Settings saved successfully!</span>
            )}
            {saveStatus === 'error' && (
              <span className="text-red-400 text-sm">Failed to save settings.</span>
            )}
            <button
              type="submit"
              className="btn-primary flex items-center gap-2"
              disabled={isSaving}
            >
              <Save size={18} />
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;
