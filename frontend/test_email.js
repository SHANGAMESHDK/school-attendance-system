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
          statusText: 'arrived late'
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
