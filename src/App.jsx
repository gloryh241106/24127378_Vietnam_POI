import { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import LocationForm from './components/LocationForm.jsx';
import MapView from './components/MapView.jsx';
import TranslationPopup from './components/TranslationPopup.jsx';
import AuthPanel from './components/AuthPanel.jsx';
import { auth } from './firebaseConfig.js';
import './App.css';

const NOMINATIM_ENDPOINT = 'https://nominatim.openstreetmap.org/search';
const OVERPASS_ENDPOINT = 'https://overpass-api.de/api/interpreter';
const WEATHER_ENDPOINT = 'https://api.open-meteo.com/v1/forecast';
const normalizeBaseUrl = (rawUrl) => {
	if (typeof rawUrl !== 'string') {
		return '';
	}
	return rawUrl.endsWith('/') ? rawUrl.slice(0, -1) : rawUrl;
};

const TRANSLATION_API_BASE_URL = normalizeBaseUrl(import.meta.env.VITE_TRANSLATION_API_BASE_URL);
const TRANSLATION_ENDPOINT = TRANSLATION_API_BASE_URL ? `${TRANSLATION_API_BASE_URL}/translate` : '';

const haversineDistance = (lat1, lon1, lat2, lon2) => {
	const toRad = (value) => (value * Math.PI) / 180;
	const R = 6371e3;
	const φ1 = toRad(lat1);
	const φ2 = toRad(lat2);
	const Δφ = toRad(lat2 - lat1);
	const Δλ = toRad(lon2 - lon1);
	const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return R * c;
};

const buildPoiLabel = (tags = {}) => {
	if (tags.name) {
		return tags.name;
	}
	if (tags['name:vi']) {
		return tags['name:vi'];
	}
	if (tags['name:en']) {
		return tags['name:en'];
	}
		if (tags.amenity) {
			return tags.amenity;
		}
		if (tags.tourism) {
			return tags.tourism;
		}
		if (tags.leisure) {
			return tags.leisure;
		}
		return 'Point of interest';
};

const buildCategory = (tags = {}) => {
	const candidates = ['tourism', 'amenity', 'historic', 'leisure', 'shop'];
	const key = candidates.find((field) => tags[field]);
		return key ? `${key}: ${tags[key]}` : 'Other';
};

const describeWeatherCode = (code) => {
	const lookup = {
		0: 'Clear sky',
		1: 'Mainly clear',
		2: 'Partly cloudy',
		3: 'Overcast',
		45: 'Fog',
		48: 'Depositing rime fog',
		51: 'Light drizzle',
		53: 'Moderate drizzle',
		55: 'Dense drizzle',
		56: 'Light freezing drizzle',
		57: 'Dense freezing drizzle',
		61: 'Slight rain',
		63: 'Moderate rain',
		65: 'Heavy rain',
		66: 'Light freezing rain',
		67: 'Heavy freezing rain',
		71: 'Slight snow fall',
		73: 'Moderate snow fall',
		75: 'Heavy snow fall',
		77: 'Snow grains',
		80: 'Rain showers: slight',
		81: 'Rain showers: moderate',
		82: 'Rain showers: violent',
		85: 'Snow showers: slight',
		86: 'Snow showers: heavy',
		95: 'Thunderstorm',
		96: 'Thunderstorm with slight hail',
		99: 'Thunderstorm with heavy hail',
	};
	return lookup[code] || 'Weather data unavailable';
};

function App() {
	const [isLoading, setIsLoading] = useState(false);
		const [errorMessage, setErrorMessage] = useState('');
		const [selectedPlace, setSelectedPlace] = useState(null);
		const [pois, setPois] = useState([]);
	const [weatherInfo, setWeatherInfo] = useState(null);
	const [isTranslatorOpen, setIsTranslatorOpen] = useState(false);
	const [isTranslating, setIsTranslating] = useState(false);
	const [translationResult, setTranslationResult] = useState('');
	const [translationError, setTranslationError] = useState('');
	const [currentUser, setCurrentUser] = useState(null);
	const [authLoading, setAuthLoading] = useState(true);

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
			setCurrentUser(firebaseUser);
			setAuthLoading(false);
		});
		return unsubscribe;
	}, []);

	useEffect(() => {
		if (!currentUser) {
			setIsTranslatorOpen(false);
		}
	}, [currentUser]);

	const handleSignOut = async () => {
		try {
			await signOut(auth);
		} catch (error) {
			console.error('Failed to sign out', error);
		}
	};

	const handleSearch = async (userQuery) => {
		if (!currentUser) {
			setErrorMessage('Vui lòng đăng nhập để tìm kiếm địa điểm.');
			return;
		}
		const trimmed = userQuery.trim();
		if (!trimmed) {
			setErrorMessage('Please enter a location name.');
			return;
		}

		setIsLoading(true);
		setErrorMessage('');
		setPois([]);
		setWeatherInfo(null);

		try {
			const geocodeUrl = `${NOMINATIM_ENDPOINT}?format=json&addressdetails=1&limit=1&countrycodes=vn&q=${encodeURIComponent(trimmed)}`;
			const geocodeResponse = await fetch(geocodeUrl, {
				headers: {
					'Accept-Language': 'vi',
					'User-Agent': 'poi-map-student-project/1.0 (contact: student-project@example.com)',
				},
			});

			if (!geocodeResponse.ok) {
			throw new Error('Unable to locate the place, please try again.');
			}

			const geocodeData = await geocodeResponse.json();

			if (!Array.isArray(geocodeData) || geocodeData.length === 0) {
			throw new Error('No matching location found in Vietnam.');
			}

			const { lat, lon, display_name: displayName } = geocodeData[0];
			const latitude = parseFloat(lat);
			const longitude = parseFloat(lon);

			setSelectedPlace({
				lat: latitude,
				lon: longitude,
				label: displayName,
			});

			const weatherUrl = `${WEATHER_ENDPOINT}?latitude=${latitude}&longitude=${longitude}&current_weather=true&timezone=auto`;

			const overpassQuery = `
				[out:json][timeout:25];
				(
					node(around:2000, ${latitude}, ${longitude})["tourism"];
					node(around:2000, ${latitude}, ${longitude})["amenity"];
					node(around:2000, ${latitude}, ${longitude})["historic"];
					node(around:2000, ${latitude}, ${longitude})["leisure"];
					way(around:2000, ${latitude}, ${longitude})["tourism"];
					way(around:2000, ${latitude}, ${longitude})["amenity"];
					way(around:2000, ${latitude}, ${longitude})["historic"];
					way(around:2000, ${latitude}, ${longitude})["leisure"];
				);
				out center;
			`;

			const [weatherResponse, poiResponse] = await Promise.all([
				fetch(weatherUrl),
				fetch(OVERPASS_ENDPOINT, {
					method: 'POST',
					headers: {
						'Content-Type': 'text/plain;charset=UTF-8',
					},
					body: overpassQuery,
				}),
			]);

			if (!poiResponse.ok) {
				throw new Error('Unable to fetch nearby points of interest.');
			}

			if (weatherResponse.ok) {
				const weatherJson = await weatherResponse.json();
				if (weatherJson?.current_weather) {
					const { temperature, windspeed, winddirection, weathercode, time: observationTime } = weatherJson.current_weather;
					setWeatherInfo({
						temperature,
						windSpeed: windspeed,
						windDirection: winddirection,
						description: describeWeatherCode(weathercode),
						observationTime,
					});
				} else {
					setWeatherInfo(null);
				}
			} else {
				setWeatherInfo(null);
			}

			const poiData = await poiResponse.json();
			const elements = Array.isArray(poiData.elements) ? poiData.elements : [];

			const formatted = elements
				.map((element) => {
					const { tags = {}, id, lat: nodeLat, lon: nodeLon, center } = element;
					const resultLat = typeof nodeLat === 'number' ? nodeLat : center?.lat;
					const resultLon = typeof nodeLon === 'number' ? nodeLon : center?.lon;

					if (typeof resultLat !== 'number' || typeof resultLon !== 'number') {
						return null;
					}

					const distance = haversineDistance(latitude, longitude, resultLat, resultLon);

					return {
						id,
						name: buildPoiLabel(tags),
						category: buildCategory(tags),
						lat: resultLat,
						lon: resultLon,
						distance,
						address: tags['addr:street'] || tags['addr:full'] || null,
					};
				})
				.filter(Boolean)
				.sort((a, b) => a.distance - b.distance)
				.slice(0, 5);

					if (formatted.length === 0) {
						setErrorMessage('No notable places found within 2km of this location.');
					}

			setPois(formatted);
		} catch (error) {
			setErrorMessage(error.message || 'Something went wrong, please try again.');
		} finally {
			setIsLoading(false);
		}
	};

	const handleTranslate = async (englishText) => {
		if (!currentUser) {
			setTranslationError('Bạn cần đăng nhập trước khi sử dụng công cụ dịch.');
			return;
		}
		const trimmed = englishText.trim();
		if (!trimmed) {
			setTranslationError('Please enter an English sentence to translate.');
			setTranslationResult('');
			return;
		}
		if (!TRANSLATION_ENDPOINT) {
			setTranslationError('Translation service is not configured. Please set VITE_TRANSLATION_API_BASE_URL.');
			setTranslationResult('');
			return;
		}

		setIsTranslating(true);
		setTranslationError('');
		setTranslationResult('');

		try {
				const response = await fetch(TRANSLATION_ENDPOINT, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Accept: 'application/json',
					},
					body: JSON.stringify({
						text: trimmed,
						source_lang: 'en',
						target_lang: 'vi',
					}),
				});

			if (!response.ok) {
					const fallback = `Translation service returned status ${response.status}.`;
					const errorText = await response.text();
					let detail = '';
					try {
						const parsed = JSON.parse(errorText || '{}');
						if (typeof parsed?.detail === 'string') {
							detail = parsed.detail;
						} else if (typeof parsed?.error === 'string') {
							detail = parsed.error;
						}
					} catch {
						/* ignore malformed payloads */
					}
					throw new Error(detail || fallback);
			}

				const data = await response.json();
				const translatedText = typeof data?.translated_text === 'string' ? data.translated_text.trim() : '';
			if (!translatedText) {
					throw new Error('Translation service did not return any translated text.');
			}

				setTranslationResult(translatedText);
		} catch (error) {
			setTranslationError(error.message || 'Unable to translate this sentence.');
		} finally {
			setIsTranslating(false);
		}
	};

	useEffect(() => {
		if (!isTranslatorOpen) {
			setTranslationResult('');
			setTranslationError('');
			setIsTranslating(false);
		}
	}, [isTranslatorOpen]);

	const weatherDate = weatherInfo?.observationTime ? new Date(weatherInfo.observationTime) : null;
	const weatherTimeLabel = weatherDate && !Number.isNaN(weatherDate.getTime())
		? weatherDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
		: 'Unknown time';

	if (authLoading) {
		return (
			<div className="app app--loading">
				<main className="app__auth-loading">
					<p>Đang kiểm tra phiên đăng nhập...</p>
				</main>
			</div>
		);
	}

	return (
		<div className="app">
			<header className="app__header">
				<div className="app__header-top">
					{currentUser && (
						<div className="app__userbar">
							<span className="app__userbar-email">{currentUser.email}</span>
							<button type="button" className="app__signout-btn" onClick={handleSignOut}>
								Đăng xuất
							</button>
						</div>
					)}
				</div>
						<h1>Vietnam Points of Interest</h1>
						<p>
							Enter a place in Vietnam to discover five nearby points of interest on the OpenStreetMap
							base map.
						</p>
			</header>
			<main className={currentUser ? 'app__content' : 'app__content app__content--locked'}>
				<LocationForm isLoading={isLoading} onSearch={handleSearch} isDisabled={!currentUser} />
				{errorMessage && <p className="app__error">{errorMessage}</p>}
				<div className="app__layout">
					<MapView center={selectedPlace} pois={pois} isLoading={isLoading} />
					<section className="app__sidebar">
							{weatherInfo && (
								<section className="app__weather">
									<h2>Current weather</h2>
									<p className="app__weather-temp">{weatherInfo.temperature.toFixed(1)}°C</p>
									<p>{weatherInfo.description}</p>
									<p>Wind: {weatherInfo.windSpeed.toFixed(1)} km/h</p>
									<p>Wind direction: {Math.round(weatherInfo.windDirection)}°</p>
									<p>Updated at {weatherTimeLabel}</p>
								</section>
							)}
									<h2>Results</h2>
									{isLoading && <p>Loading data...</p>}
									{!isLoading && selectedPlace && pois.length === 0 && !errorMessage && (
										<p>No matching points of interest in this area.</p>
						)}
						<ul className="app__poi-list">
							{pois.map((poi) => (
								<li key={poi.id}>
									<h3>{poi.name}</h3>
									<p>{poi.category}</p>
														<p>
															{poi.distance < 1000
																? `${poi.distance.toFixed(0)} m`
																: `${(poi.distance / 1000).toFixed(2)} km`}
															{' '}from the search center
														</p>
									{poi.address && <p>{poi.address}</p>}
								</li>
							))}
						</ul>
					</section>
				</div>
			</main>
			<footer className="app__footer">
			<small>Powered by OpenStreetMap, Overpass API, and HuggingFace translation.</small>
			</footer>
			<button
				type="button"
				className="app__translator-fab"
				onClick={() => currentUser && setIsTranslatorOpen(true)}
				disabled={!currentUser}
			>
				Translate EN &gt; VI
			</button>
			<TranslationPopup
				isOpen={isTranslatorOpen}
				onClose={() => setIsTranslatorOpen(false)}
				onTranslate={handleTranslate}
				isLoading={isTranslating}
				result={translationResult}
				error={translationError}
			/>
			{!currentUser && <AuthPanel />}
		</div>
	);
}

export default App;
