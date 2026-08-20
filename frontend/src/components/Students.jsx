import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UserPlus, Edit2, Trash2, X, Check } from 'lucide-react';
import { db } from '../utils/db';

const Students = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  
  const [formData, setFormData] = useState({
    uid: '',
    rollNo: '',
    name: '',
    parentEmail: ''
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = () => {
    try {
      const data = db.getStudents();
      setStudents(data);
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    try {
      let updatedStudents = [...students];
      if (editingStudent) {
        updatedStudents = updatedStudents.map(s => s.uid === editingStudent.uid ? formData : s);
      } else {
        updatedStudents.push(formData);
      }
      db.saveStudents(updatedStudents);
      setStudents(updatedStudents);
      setShowModal(false);
      setFormData({ uid: '', rollNo: '', name: '', parentEmail: '' });
    } catch (error) {
      console.error("Error saving student:", error);
    }
  };

  const handleDelete = (uid) => {
    if (confirm('Are you sure you want to delete this student?')) {
      try {
        const updatedStudents = students.filter(s => s.uid !== uid);
        db.saveStudents(updatedStudents);
        setStudents(updatedStudents);
      } catch (error) {
        console.error("Error deleting student:", error);
      }
    }
  };

  const openModal = (student = null) => {
    if (student) {
      setEditingStudent(student);
      setFormData(student);
    } else {
      setEditingStudent(null);
      setFormData({ uid: '', rollNo: '', name: '', parentEmail: '' });
    }
    setShowModal(true);
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.rollNo.includes(search)
  );

  return (
    <div className="animate-slide-in">
      <header className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold">Students Directory</h2>
        <button onClick={() => navigate('/register')} className="btn-primary flex items-center gap-2">
          <UserPlus size={18} />
          Add Student
        </button>
      </header>

      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-slate-700/50 flex items-center gap-3">
          <Search size={18} className="text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by name or roll number..." 
            className="bg-transparent border-none focus:outline-none text-slate-200 w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800/50 text-slate-400 text-sm">
                <th className="p-4 font-medium">Roll No</th>
                <th className="p-4 font-medium">Name</th>
                <th className="p-4 font-medium">RFID UID</th>
                <th className="p-4 font-medium">Parent's Email</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map(student => (
                <tr key={student.uid} className="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors">
                  <td className="p-4 text-slate-300">{student.rollNo}</td>
                  <td className="p-4 font-medium text-slate-200">{student.name}</td>
                  <td className="p-4 text-slate-400 font-mono text-sm">{student.uid}</td>
                  <td className="p-4 text-slate-300">{student.parentEmail}</td>
                  <td className="p-4 text-right">
                    <button onClick={() => openModal(student)} className="p-2 text-slate-400 hover:text-blue-400 transition-colors">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(student.uid)} className="p-2 text-slate-400 hover:text-red-400 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredStudents.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              No students found.
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-card w-full max-w-md p-6 animate-slide-in">
            <h3 className="text-xl font-bold mb-4">{editingStudent ? 'Edit Student' : 'Add New Student'}</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">RFID UID</label>
                <input required type="text" className="input-field w-full uppercase font-mono" value={formData.uid} onChange={e => setFormData({...formData, uid: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Roll Number</label>
                <input required type="text" className="input-field w-full" value={formData.rollNo} onChange={e => setFormData({...formData, rollNo: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Full Name</label>
                <input required type="text" className="input-field w-full" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Parent's Email Address</label>
                <input required type="email" className="input-field w-full" placeholder="parent@example.com" value={formData.parentEmail} onChange={e => setFormData({...formData, parentEmail: e.target.value})} />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Save Student</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;
