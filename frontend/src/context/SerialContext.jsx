import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import emailjs from '@emailjs/browser';
import { useNavigate } from 'react-router-dom';
import { db } from '../utils/db';
const SerialContext = createContext(null);

export const useSerial = () => useContext(SerialContext);

export const SerialProvider = ({ children }) => {
  const navigate = useNavigate();
  const [port, setPort] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [serialLogs, setSerialLogs] = useState([]);

  const portRef = useRef(null);
  const writerRef = useRef(null);
  const readerRef = useRef(null);

  const addLog = (type, message) => {
    setSerialLogs(prev => [{ type, message }, ...prev].slice(0, 50));
  };

  const connect = async () => {
    try {
      if (!('serial' in navigator)) {
        alert("Web Serial API not supported in this browser. Please use Chrome/Edge.");
        return;
      }

      const newPort = await navigator.serial.requestPort();
      await newPort.open({ baudRate: 115200 });

      portRef.current = newPort;
      setPort(newPort);
      setIsOpen(true);
      addLog('SYS', 'Connected to hardware scanner.');

      readLoop(newPort);
    } catch (err) {
      console.error(err);
      addLog('ERROR', err.message);
    }
  };

  const disconnect = async () => {
    try {
      if (readerRef.current) {
        await readerRef.current.cancel();
      }
      if (writerRef.current) {
        writerRef.current.releaseLock();
      }
      if (portRef.current) {
        await portRef.current.close();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPort(null);
      setIsOpen(false);
      portRef.current = null;
      addLog('SYS', 'Disconnected from hardware scanner.');
    }
  };

  const writeToSerial = async (data) => {
    if (!portRef.current) return;
    try {
      if (!writerRef.current) {
        const textEncoder = new TextEncoderStream();
        const writableStreamClosed = textEncoder.readable.pipeTo(portRef.current.writable);
        writerRef.current = textEncoder.writable.getWriter();
      }
      await writerRef.current.write(data);
      addLog('TX', data.trim());
    } catch (err) {
      console.error(err);
      addLog('ERROR', 'Write failed: ' + err.message);
    }
  };

  const handleScan = (uid) => {
    try {
      const students = db.getStudents();
      const student = students.find(s => s.uid === uid);

      const config = db.getConfig();
      const now = new Date();
      const today = now.toDateString();

      let action = 'UNKNOWN\n';
      let scanType = 'UNKNOWN';

      if (student) {
        // Prevent duplicate scans for the same day
        const logs = db.getAttendance();
        const hasTappedIn = logs.some(l => l.studentUid === student.uid && new Date(l.timestamp).toDateString() === today);

        if (hasTappedIn) {
          action = `MSG:${student.name},${student.parentEmail},ALREADY_IN\n`;
          scanType = 'DUPLICATE';
          // We optionally could still ping the UI with an error, but let's just log it locally to the console
          addLog('ERROR', `${student.name} already checked in today!`);
        } else {
          const [startHour, startMin] = config.schoolStartTime.split(':').map(Number);
          const isLate = (now.getHours() > startHour) || (now.getHours() === startHour && now.getMinutes() > startMin);
          const status = isLate ? 'LATE' : 'ON_TIME';

          const newLog = {
            id: Date.now().toString(),
            studentUid: student.uid,
            studentName: student.name,
            rollNo: student.rollNo,
            timestamp: now.toISOString(),
            status: status
          };

          scanType = 'SUCCESS';
          db.addAttendanceLog(newLog);
          action = `MSG:${student.name},${student.parentEmail},${status}\n`;

          // Trigger EmailJS Email
          const statusText = status === 'LATE' ? 'arrived late' : 'arrived on time';

          emailjs.send(
            import.meta.env.VITE_EMAILJS_SERVICE_ID,
            import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
            {
              studentName: student.name,
              parentEmail: student.parentEmail,
              statusText: statusText,
              scanTime: now.toLocaleTimeString()
            },
            import.meta.env.VITE_EMAILJS_PUBLIC_KEY
          ).then((result) => {
            console.log('Email successfully sent!', result.text);
          }, (error) => {
            console.error('Failed to send email:', error.text);
          });
        }
      }

      writeToSerial(action);

      // Notify the UI about the exact scan result
      window.dispatchEvent(new CustomEvent('scanResult', { detail: { type: scanType, uid } }));

      // If it's unknown, automatically redirect to register page after showing the red animation
      if (scanType === 'UNKNOWN') {
        setTimeout(() => {
          navigate('/register', { state: { uid } });
        }, 2000);
      }
    } catch (error) {
      console.error("Scan error", error);
      addLog('ERROR', 'Processing scan failed');
    }
  };

  const readLoop = async (activePort) => {
    const textDecoder = new TextDecoderStream();
    const readableStreamClosed = activePort.readable.pipeTo(textDecoder.writable);
    readerRef.current = textDecoder.readable.getReader();

    let buffer = '';

    try {
      while (true) {
        const { value, done } = await readerRef.current.read();
        if (done) {
          readerRef.current.releaseLock();
          break;
        }
        if (value) {
          buffer += value;
          let lines = buffer.split('\n');
          // Keep the last part as buffer if it didn't end with a newline
          buffer = lines.pop();

          for (let line of lines) {
            line = line.trim();
            if (line) {
              addLog('RX', line);
              if (line.startsWith('UID:')) {
                const uid = line.substring(4);
                handleScan(uid);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Serial read error:", error);
      addLog('ERROR', 'Read error: ' + error.message);
    } finally {
      disconnect();
    }
  };

  return (
    <SerialContext.Provider value={{ port, isOpen, connect, disconnect, writeToSerial, serialLogs, setSerialLogs }}>
      {children}
    </SerialContext.Provider>
  );
};
buffer = lines.pop();

for (let line of lines) {
  line = line.trim();
  if (line) {
    addLog('RX', line);
    if (line.startsWith('UID:')) {
      const uid = line.substring(4);
      handleScan(uid);
    }
  }
}
        }
      }
    } catch (error) {
  console.error("Serial read error:", error);
  addLog('ERROR', 'Read error: ' + error.message);
} finally {
  disconnect();
}
  };

return (
  <SerialContext.Provider value={{ port, isOpen, connect, disconnect, writeToSerial, serialLogs, setSerialLogs }}>
    {children}
  </SerialContext.Provider>
);
};
