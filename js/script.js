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
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenWeatherMap</a> contributors'
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
        
        // في تطبيق حقيقي، استخدم API مثل OpenWeatherMap
        // const apiKey = 'ff25f6e242221186cc9d4f8803fb1437';
        // const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}&lang=fr`);
        
        // لمثالنا، سنستخدم بيانات وهمية
        const mockData = getMockWeatherData(city);
        updateWeatherUI(mockData);
        
    } catch (error) {
        showError('Erreur lors de la récupération des données météo');
        console.error(error);
    } finally {
        showLoading(false);
    }
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
    document.querySelector('.weather-description').textContent = data.description;
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
    
    // تحديث الخريطة
    updateMap(data.lat, data.lon, data.city, data.description);
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
    const map = L.map('weather-map').setView([lat, lon], 10);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    L.circle([lat, lon], {
        color: 'blue',
        fillColor: '#30f',
        fillOpacity: 0.2,
        radius: 10000
    }).addTo(map).bindPopup(`${city} - ${description}`);
}

function getCurrentDateTime() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return now.toLocaleDateString('fr-FR', options);
}

// بيانات وهمية للطقس (ستستبدلها بAPI حقيقي)
function getMockWeatherData(city) {
    const weatherData = {
        'Genève': {
            city: 'Genève',
            country: 'Suisse',
            temperature: 18,
            description: 'Ensoleillé',
            icon: 'fa-sun',
            feelsLike: 17,
            humidity: 65,
            wind: 10,
            pressure: 1015,
            uv: '4 (Modéré)',
            visibility: '10 km',
            alert: 'Alerte météo: Orages prévus dans la région ce soir à partir de 20h00.',
            lat: 46.2044,
            lon: 6.1432
        },
        'Paris': {
            city: 'Paris',
            country: 'France',
            temperature: 15,
            description: 'Nuageux',
            icon: 'fa-cloud',
            feelsLike: 14,
            humidity: 70,
            wind: 12,
            pressure: 1012,
            uv: '3 (Modéré)',
            visibility: '8 km',
            alert: null,
            lat: 48.8566,
            lon: 2.3522
        },
        'Londres': {
            city: 'Londres',
            country: 'Royaume-Uni',
            temperature: 12,
            description: 'Pluie légère',
            icon: 'fa-cloud-rain',
            feelsLike: 10,
            humidity: 85,
            wind: 15,
            pressure: 1005,
            uv: '2 (Faible)',
            visibility: '5 km',
            alert: 'Avertissement: Pluies continues prévues toute la journée',
            lat: 51.5074,
            lon: -0.1278
        }
    };
    
    return weatherData[city] || weatherData['Genève'];
}