import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2xUrl from 'leaflet/dist/images/marker-icon-2x.png?url';
import markerIconUrl from 'leaflet/dist/images/marker-icon.png?url';
import markerShadowUrl from 'leaflet/dist/images/marker-shadow.png?url';
import './MapView.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
	iconRetinaUrl: markerIcon2xUrl,
	iconUrl: markerIconUrl,
	shadowUrl: markerShadowUrl,
});

function MapUpdater({ center }) {
	const map = useMap();

	useEffect(() => {
		if (center) {
			map.setView([center.lat, center.lon], 15, { animate: true });
		}
	}, [center, map]);

	return null;
}

function MapView({ center, pois, isLoading }) {
	if (!center) {
		return (
			<div className="map-view map-view__placeholder">
				<p>Search for a place to load the map.</p>
			</div>
		);
	}

	return (
		<div className="map-view">
			<MapContainer center={[center.lat, center.lon]} zoom={15} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
				<MapUpdater center={center} />
				<TileLayer
					attribution="&copy; OpenStreetMap contributors"
					url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
				/>
				<Marker position={[center.lat, center.lon]}>
					<Popup>
						<strong>Search center</strong>
						<br />
						{center.label}
					</Popup>
				</Marker>
				{pois.map((poi) => (
					<Marker key={poi.id} position={[poi.lat, poi.lon]}>
						<Popup>
							<strong>{poi.name}</strong>
							<br />
							{poi.category}
							<br />
							{poi.distance < 1000
								? `${poi.distance.toFixed(0)} m`
								: `${(poi.distance / 1000).toFixed(2)} km`} from center
							{poi.address && (
								<>
									<br />
									{poi.address}
								</>
							)}
						</Popup>
					</Marker>
				))}
			</MapContainer>
			{isLoading && (
				<div className="map-view__overlay">
					<p>Loading map data...</p>
				</div>
			)}
		</div>
	);
}

export default MapView;
