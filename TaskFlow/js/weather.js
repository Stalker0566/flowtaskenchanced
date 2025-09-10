(() => {
  const cityEl = document.getElementById('weather-city');
  const tempEl = document.getElementById('weather-temp');
  const descEl = document.getElementById('weather-desc');
  const windEl = document.getElementById('weather-wind');
  const iconEl = document.getElementById('weather-icon');

  if (!cityEl || !tempEl) return;

  const state = { lat: null, lon: null };

  function iconFor(code) {
    // Open-Meteo weathercode mapping simplified
    if ([0].includes(code)) return '☀️';
    if ([1,2].includes(code)) return '🌤️';
    if ([3].includes(code)) return '⛅';
    if ([45,48].includes(code)) return '🌫️';
    if ([51,53,55,56,57].includes(code)) return '🌦️';
    if ([61,63,65,66,67,80,81,82].includes(code)) return '🌧️';
    if ([71,73,75,77,85,86].includes(code)) return '❄️';
    if ([95,96,99].includes(code)) return '⛈️';
    return '⛅';
  }

  function describe(code) {
    const map = {
      0: 'Clear', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
      45: 'Fog', 48: 'Fog', 51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle',
      56: 'Light freezing drizzle', 57: 'Heavy freezing drizzle', 61: 'Light rain', 63: 'Rain', 65: 'Heavy rain',
      66: 'Freezing rain', 67: 'Heavy freezing rain', 71: 'Light snow', 73: 'Snow', 75: 'Heavy snow',
      77: 'Snow grains', 80: 'Rain showers', 81: 'Heavy rain showers', 82: 'Very heavy rain showers', 85: 'Snow showers', 86: 'Heavy snow showers',
      95: 'Thunderstorm', 96: 'Thunderstorm with hail', 99: 'Heavy thunderstorm with hail',
    };
    return map[code] || 'Weather conditions';
  }

  async function fetchWeather(lat, lon) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('weather request failed');
    return res.json();
  }

  async function reverseGeocode(lat, lon) {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      return data.address?.city || data.address?.town || data.address?.village || data.display_name || 'Your location';
    } catch (_) {
      return 'Your location';
    }
  }

  function render(current, place) {
    const t = Math.round(current.temperature);
    const w = current.windspeed;
    const code = current.weathercode;
    tempEl.textContent = `${t}°`;
    descEl.textContent = describe(code);
    windEl.textContent = `Ветер ${Math.round(w)} м/с`;
    cityEl.textContent = place;
    if (iconEl) iconEl.textContent = iconFor(code);
  }

  function onLocation(lat, lon) {
    Promise.all([fetchWeather(lat, lon), reverseGeocode(lat, lon)])
      .then(([w, place]) => {
        render(w.current_weather, place);
      })
      .catch(() => {
        descEl.textContent = 'Не удалось получить погоду';
      });
  }

  function requestGeo() {
    if (!navigator.geolocation) {
      descEl.textContent = 'Геолокация недоступна';
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => onLocation(pos.coords.latitude, pos.coords.longitude),
      () => {
        descEl.textContent = 'Доступ к гео отклонён';
      },
      { timeout: 8000 }
    );
  }

  requestGeo();
})();


