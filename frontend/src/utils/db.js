const DB_KEYS = {
  STUDENTS: 'attendance_students',
  ATTENDANCE: 'attendance_logs',
  CONFIG: 'attendance_config'
};

const DEFAULT_CONFIG = {
  schoolStartTime: '08:00'
};

export const db = {
  // Config
  getConfig: () => {
    const data = localStorage.getItem(DB_KEYS.CONFIG);
    return data ? JSON.parse(data) : DEFAULT_CONFIG;
  },
  saveConfig: (config) => {
    localStorage.setItem(DB_KEYS.CONFIG, JSON.stringify(config));
  },

  // Students
  getStudents: () => {
    const data = localStorage.getItem(DB_KEYS.STUDENTS);
    return data ? JSON.parse(data) : [];
  },
  saveStudents: (students) => {
    localStorage.setItem(DB_KEYS.STUDENTS, JSON.stringify(students));
  },
  clearStudents: () => {
    localStorage.setItem(DB_KEYS.STUDENTS, JSON.stringify([]));
  },

  // Attendance
  getAttendance: () => {
    const data = localStorage.getItem(DB_KEYS.ATTENDANCE);
    return data ? JSON.parse(data) : [];
  },
  saveAttendance: (logs) => {
    localStorage.setItem(DB_KEYS.ATTENDANCE, JSON.stringify(logs));
  },
  addAttendanceLog: (log) => {
    const logs = db.getAttendance();
    logs.push(log);
    db.saveAttendance(logs);
    // Dispatch event for UI reactivity
    window.dispatchEvent(new Event('attendanceUpdated'));
  },
  clearAttendance: () => {
    localStorage.setItem(DB_KEYS.ATTENDANCE, JSON.stringify([]));
    window.dispatchEvent(new Event('attendanceUpdated'));
  }
};
