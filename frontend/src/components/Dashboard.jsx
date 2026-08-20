import React, { useState, useEffect } from 'react';
import { Users, Clock, AlertTriangle, Activity, ScanFace, Download } from 'lucide-react';
import { format } from 'date-fns';
import { db } from '../utils/db';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState({ total: 0, present: 0, late: 0 });
  const [liveStream, setLiveStream] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [scanState, setScanState] = useState({ active: false, type: 'IDLE' });

  useEffect(() => {
    fetchData();

    const handleAttendanceUpdate = () => fetchData();
    window.addEventListener('attendanceUpdated', handleAttendanceUpdate);

    const handleScanResult = (e) => {
      setScanState({ active: true, type: e.detail.type });
      setTimeout(() => setScanState({ active: false, type: 'IDLE' }), 2500);
    };
    window.addEventListener('scanResult', handleScanResult);
    
    return () => {
      window.removeEventListener('attendanceUpdated', handleAttendanceUpdate);
      window.removeEventListener('scanResult', handleScanResult);
    };
  }, []);

  const fetchData = async () => {
    try {
      const students = db.getStudents();
      const logs = db.getAttendance();

      const today = new Date().toDateString();
      const todaysLogs = logs.filter(log => new Date(log.timestamp).toDateString() === today);
      
      const lateCount = todaysLogs.filter(log => log.status === 'LATE').length;
      
      setStats({
        total: students.length,
        present: todaysLogs.length,
        late: lateCount
      });

      // Simple mock chart data grouping by hour
      const hourlyData = Array.from({ length: 9 }, (_, i) => ({
        time: `${i + 7}:00`,
        count: Math.floor(Math.random() * 10) // Mock historical for UI wow factor
      }));
      setChartData(hourlyData);
      
      setLiveStream(todaysLogs.slice(-5).reverse());
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  const downloadCSV = () => {
    const logs = db.getAttendance();
    const today = new Date().toDateString();
    const todaysLogs = logs.filter(log => new Date(log.timestamp).toDateString() === today);
    
    if (todaysLogs.length === 0) {
      return alert("No attendance records for today to download.");
    }

    const headers = ["Time", "UID", "Name", "Roll No", "Status"];
    const csvRows = todaysLogs.map(log => [
      new Date(log.timestamp).toLocaleTimeString(),
      log.studentUid,
      `"${log.studentName}"`,
      log.rollNo,
      log.status
    ].join(","));

    const csvContent = headers.join(",") + "\n" + csvRows.join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Attendance_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="animate-slide-in">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold mb-2">Real-time Overview</h2>
          <p className="text-slate-400">Live school attendance monitoring system.</p>
        </div>
        <button onClick={downloadCSV} className="btn-secondary flex items-center gap-2">
          <Download size={18} />
          Export Today's CSV
        </button>
      </header>

      {/* Reactive Scanner Animation */}
      <div className={`mb-8 p-6 rounded-2xl border transition-all duration-500 overflow-hidden relative ${
        !scanState.active ? 'bg-slate-800/30 border-slate-700/50 shadow-[0_0_15px_rgba(59,130,246,0.1)]' :
        scanState.type === 'SUCCESS' ? 'bg-emerald-500/20 border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.3)]' :
        scanState.type === 'DUPLICATE' ? 'bg-amber-500/20 border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.3)]' :
        'bg-red-500/20 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.3)]'
      }`}>
        <div className="absolute top-[-20px] right-[-20px] p-4 opacity-5 transform rotate-12">
          <ScanFace size={160} />
        </div>
        <div className="flex items-center gap-6 relative z-10">
          <div className="relative">
            {!scanState.active && (
              <div className="absolute inset-[-15px] border-2 border-blue-500/30 rounded-full animate-[ping_3s_linear_infinite]"></div>
            )}
            {scanState.active && (
              <>
                <div className={`absolute inset-0 rounded-full animate-ping opacity-75 ${
                  scanState.type === 'SUCCESS' ? 'bg-emerald-400' : scanState.type === 'DUPLICATE' ? 'bg-amber-400' : 'bg-red-400'
                }`}></div>
                <div className={`absolute inset-[-10px] rounded-full animate-pulse ${
                  scanState.type === 'SUCCESS' ? 'bg-emerald-500/30' : scanState.type === 'DUPLICATE' ? 'bg-amber-500/30' : 'bg-red-500/30'
                }`}></div>
              </>
            )}
            <div className={`p-5 rounded-full relative z-10 transition-colors duration-500 text-white ${
              !scanState.active ? 'bg-blue-600' :
              scanState.type === 'SUCCESS' ? 'bg-emerald-500' : 
              scanState.type === 'DUPLICATE' ? 'bg-amber-500' : 
              'bg-red-500'
            }`}>
              <ScanFace size={36} />
            </div>
          </div>
          <div>
            <h2 className={`text-3xl font-bold transition-colors duration-500 ${
              !scanState.active ? 'text-blue-400' :
              scanState.type === 'SUCCESS' ? 'text-emerald-400' : 
              scanState.type === 'DUPLICATE' ? 'text-amber-400' : 
              'text-red-400'
            }`}>
              {!scanState.active && 'Scanner is Active'}
              {scanState.type === 'SUCCESS' && 'Card Detected & Logged!'}
              {scanState.type === 'DUPLICATE' && 'Already Scanned!'}
              {scanState.type === 'UNKNOWN' && 'Unregistered Card!'}
            </h2>
            <p className="text-slate-400 text-lg mt-1">
              {!scanState.active && 'Waiting for student RFID card tap on the hardware scanner...'}
              {scanState.type === 'SUCCESS' && 'Attendance recorded successfully in the database.'}
              {scanState.type === 'DUPLICATE' && 'This student has already checked in today.'}
              {scanState.type === 'UNKNOWN' && 'Card not found. Redirecting to registration page...'}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard icon={<Users />} title="Total Students" value={stats.total} color="text-blue-400" bg="bg-blue-400/10" />
        <StatCard icon={<Clock />} title="Present Today" value={stats.present} color="text-emerald-400" bg="bg-emerald-400/10" />
        <StatCard icon={<AlertTriangle />} title="Late Arrivals" value={stats.late} color="text-amber-400" bg="bg-amber-400/10" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Chart */}
        <div className="lg:col-span-2 glass-card p-6">
          <h3 className="text-lg font-semibold mb-6">Attendance Activity</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="time" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
                <Area type="monotone" dataKey="count" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Feed */}
        <div className="glass-card p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold">Live Feed</h3>
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {liveStream.length === 0 ? (
              <p className="text-slate-500 text-sm text-center mt-10">No check-ins yet today.</p>
            ) : (
              liveStream.map((log) => (
                <div key={log.id} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50 animate-slide-in flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-200">{log.studentName}</p>
                    <p className="text-xs text-slate-400">Roll: {log.rollNo}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{format(new Date(log.timestamp), 'HH:mm:ss')}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      log.status === 'LATE' ? 'bg-amber-400/20 text-amber-400' : 'bg-emerald-400/20 text-emerald-400'
                    }`}>
                      {log.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, title, value, color, bg }) => (
  <div className="glass-card p-6 flex items-center gap-4">
    <div className={`p-4 rounded-xl ${bg} ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-slate-400 text-sm">{title}</p>
      <h4 className="text-3xl font-bold mt-1">{value}</h4>
    </div>
  </div>
);

export default Dashboard;
