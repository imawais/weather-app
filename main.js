const locationInput = document.getElementById('locationInput');
const suggestionsDiv = document.getElementById('suggestions');
const errorDiv = document.getElementById('error');
const weatherContainer = document.getElementById('weatherContainer');

// Debounce function to limit API calls
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Fetch location suggestions from Open-Meteo Geocoding API
async function fetchSuggestions(query) {
    if (query.length < 2) {
        suggestionsDiv.innerHTML = '';
        suggestionsDiv.classList.add('d-none');
        return;
    }
    try {
        const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`);
        const data = await response.json();
        suggestionsDiv.innerHTML = '';
        suggestionsDiv.classList.remove('d-none');
        if (data.results && data.results.length > 0) {
            data.results
                .filter(result => result.country === 'Germany')
                .forEach(result => {
                    const div = document.createElement('a');
                    div.className = 'list-group-item list-group-item-action suggestion';
                    div.textContent = `${result.name}, ${result.admin1 || ''}`;
                    div.onclick = () => {
                        locationInput.value = result.name;
                        suggestionsDiv.classList.add('d-none');
                        fetchWeatherByCoords(result.latitude, result.longitude, result.name);
                    };
                    suggestionsDiv.appendChild(div);
                });
        } else {
            suggestionsDiv.innerHTML = '<a class="list-group-item text-muted">No results found</a>';
        }
    } catch (error) {
        console.error('Error fetching suggestions:', error);
    }
}

// Fetch weather data from Open-Meteo Forecast API
async function fetchWeatherByCoords(lat, lon, city) {
    try {
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max&timezone=Europe/Berlin`);
        const data = await response.json();
        displayWeather(data, city);
        errorDiv.classList.add('d-none');
    } catch (error) {
        errorDiv.textContent = 'Error fetching weather data. Please try again.';
        errorDiv.classList.remove('d-none');
        console.error('Error fetching weather:', error);
    }
}

// Fetch weather based on input
async function fetchWeather() {
    const query = locationInput.value.trim();
    if (!query) {
        errorDiv.textContent = 'Please enter a city name.';
        errorDiv.classList.remove('d-none');
        return;
    }
    try {
        const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`);
        const data = await response.json();
        if (data.results && data.results.length > 0 && data.results[0].country === 'Germany') {
            const { latitude, longitude, name } = data.results[0];
            fetchWeatherByCoords(latitude, longitude, name);
        } else {
            errorDiv.textContent = 'Please enter a valid city in Germany.';
            errorDiv.classList.remove('d-none');
        }
    } catch (error) {
        errorDiv.textContent = 'Error finding location. Please try again.';
        errorDiv.classList.remove('d-none');
        console.error('Error fetching location:', error);
    }
}

// Display weather data
function displayWeather(data, city) {
    weatherContainer.innerHTML = '';
    const dates = data.daily.time;
    const tempMax = data.daily.temperature_2m_max;
    const tempMin = data.daily.temperature_2m_min;
    const precipitation = data.daily.precipitation_sum;
    const windSpeed = data.daily.wind_speed_10m_max;

    weatherContainer.innerHTML = `<h2 class="col-12 mb-4 fw-bold">7-Day Forecast for ${city}</h2>`;
    dates.forEach((date, i) => {
        const card = document.createElement('div');
        card.className = 'col';
        card.innerHTML = `
            <div class="weather-card card h-100">
                <div class="card-body">
                    <h5 class="card-title">${new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</h5>
                    <p class="card-text"><i class="fas fa-thermometer-half"></i> Max: ${tempMax[i]}°C / Min: ${tempMin[i]}°C</p>
                    <p class="card-text"><i class="fas fa-umbrella"></i> Precipitation: ${precipitation[i]} mm</p>
                    <p class="card-text"><i class="fas fa-wind"></i> Wind: ${windSpeed[i]} km/h</p>
                </div>
            </div>
        `;
        weatherContainer.appendChild(card);
    });
}

// Event listeners
locationInput.addEventListener('input', debounce(() => fetchSuggestions(locationInput.value.trim()), 300));
locationInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') fetchWeather();
});
