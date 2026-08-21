(async () => {
  try {
    const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: 'service_1plijby',
        template_id: 'template_rndkg8b',
        user_id: 'hflce1V3NAmkd6USn',
        accessToken: 'f38DzC4aoPwb1-7ZJ97Vw',
        template_params: {
          studentName: 'Shang',
          parentEmail: 'shangameshdkss@gmail.com',
          scanTime: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) + ', ' + new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          timeLabel: 'SCAN TIME',
          statusLabel: 'Late',
          statusColor: '#e8a33d',
          statusIconColor: '#151b30',
          statusIcon: '!',
          eyebrowText: 'Late Arrival Flagged',
          headerSub: 'Checked in late',
          messageVerb: 'has checked in late at the school gate',
          noteBg: '#f4f1ea',
          noteTextColor: '#8a93a8',
          noteText: "Repeated late arrivals can affect your child's attendance record. If there's something we should know, please let the school administration office know.",
          ctaTextColor: '#151b30',
          ctaLabel: 'Contact School Admin →'
        }
      })
    });
    const text = await res.text();
    console.log('Status:', res.status);
    console.log('Response:', text);
  } catch (err) {
    console.error('Error:', err);
  }
})();
