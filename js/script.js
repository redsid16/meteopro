// تهيئة التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    initApp();
});

function initApp() {
    // تفعيل وضع الظلام/الفاتح
    setupThemeToggle();
    
    // تهيئة الخريطة
    initMap();
    
    // إعداد البحث
    setupSearch();
    
    // جلب بيانات الطقس الأولية (للموقع الافتراضي)
    fetchInitialWeather();
}

// وظيفة تبديل الوضع المظلم/الفاتح
function setupThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    
    // التحقق من تفضيلات النظام
    if (prefersDarkScheme.matches || localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
        updateThemeIcon(true);
    }
    
    themeToggle.addEventListener('click', () => {
        const isDarkMode = document.body.classList.toggle('dark-mode');
        updateThemeIcon(isDarkMode);
        saveThemePreference(isDarkMode);
    });
}

function updateThemeIcon(isDarkMode) {
    const icon = document.querySelector('#theme-toggle i');
    if (isDarkMode) {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    } else {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
    }
}

function saveThemePreference(isDarkMode) {
    localStorage.setItem('darkMode', isDarkMode);
}

// وظيفة الخريطة
function initMap() {
    const map = L.map('weather-map').setView([46.2044, 6.1432], 10);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    L.circle([46.2044, 6.1432], {
        color: 'blue',
        fillColor: '#30f',
        fillOpacity: 0.2,
        radius: 10000
    }).addTo(map).bindPopup("Genève - Ensoleillé");
}

// وظيفة البحث
function setupSearch() {
    const searchBtn = document.getElementById('search-btn');
    const searchInput = document.getElementById('search-input');
    
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') handleSearch();
    });
}

function handleSearch() {
    const searchInput = document.getElementById('search-input');
    const city = searchInput.value.trim();
    
    if (city) {
        fetchWeatherData(city);
    } else {
        showError('Veuillez entrer un nom de ville');
    }
}

function showError(message) {
    const errorElement = document.createElement('div');
    errorElement.className = 'weather-alert';
    errorElement.innerHTML = `
        <div class="alert-icon">
            <i class="fas fa-exclamation-circle"></i>
        </div>
        <div class="alert-message">${message}</div>
    `;
    
    document.querySelector('.container').insertBefore(errorElement, document.querySelector('.current-weather'));
    
    setTimeout(() => {
        errorElement.remove();
    }, 3000);
}

// وظائف جلب بيانات الطقس
async function fetchInitialWeather() {
    fetchWeatherData('Genève');
}

async function fetchWeatherData(city) {
    try {
        showLoading(true);
        
        const apiKey = 'ff25f6e242221186cc9d4f8803fb1437';
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}&lang=fr`);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Ville non trouvée');
        }
        
        const data = await response.json();
        
        // جلب بيانات التوقعات لمدة 5 أيام
        const forecastResponse = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${apiKey}&lang=fr`);
        const forecastData = await forecastResponse.json();
        
        const weatherInfo = {
            city: data.name,
            country: data.sys.country,
            temperature: Math.round(data.main.temp),
            description: data.weather[0].description,
            icon: getWeatherIcon(data.weather[0].id),
            feelsLike: Math.round(data.main.feels_like),
            humidity: data.main.humidity,
            wind: Math.round(data.wind.speed * 3.6), // تحويل من m/s إلى km/h
            pressure: data.main.pressure,
            uv: 'N/A', // يحتاج API منفصل لبيانات UV
            visibility: (data.visibility / 1000).toFixed(1) + ' km',
            alert: data.weather[0].main === 'Extreme' ? 'Alerte météo: Conditions extrêmes' : null,
            lat: data.coord.lat,
            lon: data.coord.lon,
            forecast: parseForecastData(forecastData)
        };
        
        updateWeatherUI(weatherInfo);
        
    } catch (error) {
        showError(error.message || 'Erreur lors de la récupération des données météo');
        console.error(error);
    } finally {
        showLoading(false);
    }
}

function parseForecastData(forecastData) {
    const dailyForecast = {};
    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    
    forecastData.list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const dateKey = date.toLocaleDateString('fr-FR');
        
        if (!dailyForecast[dateKey]) {
            dailyForecast[dateKey] = {
                date: date,
                temps: [],
                descriptions: [],
                icons: []
            };
        }
        
        dailyForecast[dateKey].temps.push(item.main.temp);
        dailyForecast[dateKey].descriptions.push(item.weather[0].description);
        dailyForecast[dateKey].icons.push(item.weather[0].id);
    });
    
    return Object.values(dailyForecast).map(day => {
        return {
            date: day.date,
            dayName: days[day.date.getDay()],
            high: Math.round(Math.max(...day.temps)),
            low: Math.round(Math.min(...day.temps)),
            icon: getWeatherIcon(day.icons[0]),
            description: day.descriptions[0]
        };
    });
}

function getWeatherIcon(weatherId) {
    // رموز Font Awesome بناء على كود الطقس من OpenWeatherMap
    if (weatherId >= 200 && weatherId < 300) return 'fa-bolt'; // عواصف رعدية
    if (weatherId >= 300 && weatherId < 400) return 'fa-cloud-rain'; // رذاذ
    if (weatherId >= 500 && weatherId < 600) return 'fa-cloud-showers-heavy'; // مطر
    if (weatherId >= 600 && weatherId < 700) return 'fa-snowflake'; // ثلج
    if (weatherId >= 700 && weatherId < 800) return 'fa-smog'; // ضباب
    if (weatherId === 800) return 'fa-sun'; // صافي
    if (weatherId > 800) return 'fa-cloud'; // غائم
    return 'fa-cloud';
}

function showLoading(isLoading) {
    const spinner = document.querySelector('.loading-spinner');
    if (isLoading) {
        if (!spinner) {
            const loadingDiv = document.createElement('div');
            loadingDiv.className = 'loading-spinner active';
            loadingDiv.innerHTML = '<div class="spinner"></div>';
            document.body.appendChild(loadingDiv);
        } else {
            spinner.classList.add('active');
        }
    } else {
        if (spinner) spinner.classList.remove('active');
    }
}

function updateWeatherUI(data) {
    // تحديث الموقع والوقت
    document.querySelector('.location').textContent = `${data.city}, ${data.country}`;
    document.querySelector('.time').textContent = getCurrentDateTime();
    
    // تحديث الطقس الحالي
    document.querySelector('.temperature').textContent = `${data.temperature}°C`;
    document.querySelector('.weather-description').textContent = capitalizeFirstLetter(data.description);
    document.querySelector('.weather-icon i').className = `fas ${data.icon}`;
    
    // تحديث التفاصيل
    document.querySelectorAll('.detail-value')[0].textContent = `${data.feelsLike}°C`;
    document.querySelectorAll('.detail-value')[1].textContent = `${data.humidity}%`;
    document.querySelectorAll('.detail-value')[2].textContent = `${data.wind} km/h`;
    document.querySelectorAll('.detail-value')[3].textContent = `${data.pressure} hPa`;
    document.querySelectorAll('.detail-value')[4].textContent = data.uv;
    document.querySelectorAll('.detail-value')[5].textContent = data.visibility;
    
    // تحديث التنبيهات
    updateWeatherAlert(data.alert);
    
    // تحديث التوقعات اليومية
    updateDailyForecast(data.forecast);
    
    // تحديث الخريطة
    updateMap(data.lat, data.lon, data.city, data.description);
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function updateDailyForecast(forecast) {
    const forecastContainer = document.querySelector('.daily-forecast');
    forecastContainer.innerHTML = '';
    
    forecast.slice(0, 7).forEach((day, index) => {
        const dayCard = document.createElement('div');
        dayCard.className = 'day-card';
        
        const dayName = index === 0 ? 'Aujourd\'hui' : day.dayName;
        const dateStr = day.date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
        
        dayCard.innerHTML = `
            <div class="day-header">
                <div class="day-name">${dayName}</div>
                <div class="day-date">${dateStr}</div>
            </div>
            <div class="day-weather">
                <div class="day-icon"><i class="fas ${day.icon}"></i></div>
                <div class="day-temps">
                    <div class="day-high">${day.high}°C</div>
                    <div class="day-low">${day.low}°C</div>
                </div>
            </div>
            <div class="day-details">
                <div>${capitalizeFirstLetter(day.description)}</div>
            </div>
        `;
        
        forecastContainer.appendChild(dayCard);
    });
}

function updateWeatherAlert(alert) {
    const alertContainer = document.querySelector('.weather-alert');
    if (alert) {
        alertContainer.innerHTML = `
            <div class="alert-icon">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <div class="alert-message">${alert}</div>
        `;
        alertContainer.style.display = 'flex';
    } else {
        alertContainer.style.display = 'none';
    }
}

function updateMap(lat, lon, city, description) {
    // إعادة تهيئة الخريطة إذا كانت موجودة بالفعل
    if (window.weatherMap) {
        window.weatherMap.remove();
    }
    
    window.weatherMap = L.map('weather-map').setView([lat, lon], 10);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(window.weatherMap);

    L.circle([lat, lon], {
        color: 'blue',
        fillColor: '#30f',
        fillOpacity: 0.2,
        radius: 10000
    }).addTo(window.weatherMap).bindPopup(`${city} - ${description}`);
}

function getCurrentDateTime() {
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: 'Europe/Paris'
    };
    return now.toLocaleDateString('fr-FR', options);
}
