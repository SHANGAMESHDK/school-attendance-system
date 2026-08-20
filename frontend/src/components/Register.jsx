import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ScanFace, UserPlus, Save, ArrowLeft } from 'lucide-react';
import { useSerial } from '../context/SerialContext';
import { db } from '../utils/db';

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isOpen } = useSerial();
  
  const [scannedUID, setScannedUID] = useState(location.state?.uid || null);
  
  const [formData, setFormData] = useState({
    rollNo: '',
    name: '',
    parentEmail: ''
  });

  useEffect(() => {
    if (location.state?.uid) {
      setScannedUID(location.state.uid);
    }
  }, [location.state]);

  const handleSave = (e) => {
    e.preventDefault();
    if (!scannedUID) return;

    try {
      const students = db.getStudents();
      students.push({
        uid: scannedUID,
        ...formData
      });
      db.saveStudents(students);
      
      // Navigate back to students directory after successful save
      navigate('/students');
    } catch (error) {
      console.error(error);
      alert('Failed to save student.');
    }
  };

  return (
    <div className="animate-slide-in max-w-3xl mx-auto">
      <header className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('/students')} className="p-2 text-slate-400 hover:text-slate-200 transition-colors bg-slate-800/50 rounded-lg">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-3xl font-bold">Register Student</h2>
          <p className="text-slate-400">Scan an unregistered RFID card to begin.</p>
        </div>
      </header>

      {!scannedUID ? (
        <div className="glass-card flex flex-col items-center justify-center p-16 text-center min-h-[400px]">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>
            <div className="bg-slate-800 p-6 rounded-full relative z-10 border border-slate-700/50 shadow-xl">
              <ScanFace size={64} className="text-primary" />
            </div>
          </div>
          <h3 className="text-2xl font-semibold mb-2">Waiting for Scan...</h3>
          <p className="text-slate-400 max-w-md">
            {!isOpen 
              ? "Scanner disconnected! Please go to Settings to connect your USB scanner."
              : "Please tap a new RFID card on the hardware scanner. The system will automatically detect it."}
          </p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="p-6 border-b border-slate-700/50 bg-slate-800/30 flex items-center gap-3">
            <div className="bg-emerald-500/20 p-2 rounded-lg">
              <UserPlus size={24} className="text-emerald-400" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Card Detected!</h3>
              <p className="text-sm text-slate-400 font-mono">UID: {scannedUID}</p>
            </div>
          </div>
          
          <form onSubmit={handleSave} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">RFID UID</label>
                <input 
                  type="text" 
                  className="input-field w-full opacity-50 cursor-not-allowed font-mono" 
                  value={scannedUID} 
                  disabled 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Roll Number</label>
                <input 
                  required 
                  type="text" 
                  className="input-field w-full" 
                  placeholder="e.g. 101"
                  value={formData.rollNo} 
                  onChange={e => setFormData({...formData, rollNo: e.target.value})} 
                  autoFocus
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
                <input 
                  required 
                  type="text" 
                  className="input-field w-full" 
                  placeholder="John Doe"
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-1">Parent's Email Address</label>
                <input 
                  required 
                  type="email" 
                  className="input-field w-full" 
                  placeholder="parent@example.com" 
                  value={formData.parentEmail} 
                  onChange={e => setFormData({...formData, parentEmail: e.target.value})} 
                />
              </div>
            </div>
            
            <div className="pt-4 flex justify-end gap-3 border-t border-slate-700/50 mt-6">
              <button 
                type="button" 
                onClick={() => setScannedUID(null)} 
                className="btn-secondary"
              >
                Cancel & Scan Again
              </button>
              <button type="submit" className="btn-primary flex items-center gap-2">
                <Save size={18} />
                Save Student
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Register;
