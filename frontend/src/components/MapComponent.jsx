import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

// Fix default Leaflet icon issue by providing custom SVG DivIcons
const createModeIcon = (mode, label) => {
  let bgColor = '#2563eb'; // Road blue
  let iconSvg = `<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"/></svg>`;

  if (mode === 'TRAIN' || mode === 'RAIL') {
    bgColor = '#059669'; // Rail green
    iconSvg = `<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"/></svg>`;
  } else if (mode === 'VESSEL' || mode === 'SEA') {
    bgColor = '#0284c7'; // Sea cyan
    iconSvg = `<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>`;
  } else if (mode === 'WAREHOUSE') {
    bgColor = '#d97706'; // Amber warehouse
    iconSvg = `<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>`;
  }

  return L.divIcon({
    className: 'custom-map-marker',
    html: `
      <div style="background-color: ${bgColor}; border: 2px solid white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2);" class="w-8 h-8 rounded-full flex items-center justify-center relative cursor-pointer hover:scale-110 transition-transform">
        ${iconSvg}
        <span class="absolute -bottom-5 whitespace-nowrap text-[10px] font-bold px-1.5 py-0.5 bg-slate-900 text-white rounded shadow-sm opacity-90">${label}</span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18]
  });
};

export default function MapComponent({
  fleetList = [],
  warehouses = [],
  activeShipment = null,
  center = [23.5, 72.0],
  zoom = 5,
  height = '500px'
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const routesLayerRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: center,
        zoom: zoom,
        zoomControl: true,
      });

      // CartoDB Positron clean map tiles (professional light-grey theme)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      routesLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      // Don't destroy on every re-render, keep instance intact
    };
  }, []);

  // Update Markers & Polylines when fleet, warehouses, or shipment changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const markersGroup = markersLayerRef.current;
    const routesGroup = routesLayerRef.current;
    markersGroup.clearLayers();
    routesGroup.clearLayers();

    // 1. Draw Static Multimodal Corridors
    // Road Highway Corridor (Delhi -> Jaipur -> Ahmedabad -> Mumbai)
    const roadPoints = [
      [28.6139, 77.2090], [26.9124, 75.7873], [24.5854, 73.7125],
      [23.0225, 72.5714], [21.1702, 72.8311], [18.9553, 72.8447]
    ];
    L.polyline(roadPoints, {
      color: '#3b82f6',
      weight: 3,
      opacity: 0.7,
      dashArray: '4, 4'
    }).bindTooltip("National Highway 48 Freight Corridor (Road)", { sticky: true }).addTo(routesGroup);

    // Rail Dedicated Freight Corridor (Dadri -> Ajmer -> Palanpur -> Sanand -> JNPT)
    const railPoints = [
      [28.5355, 77.5615], [26.4499, 74.6399], [24.2676, 72.4388],
      [23.0039, 72.3812], [18.9499, 72.9511]
    ];
    L.polyline(railPoints, {
      color: '#059669',
      weight: 3.5,
      opacity: 0.85,
      dashArray: '8, 6'
    }).bindTooltip("Western Dedicated Freight Rail Corridor (Rail)", { sticky: true }).addTo(routesGroup);

    // Sea Container Corridor (Mumbai JNPT -> Arabian Sea -> Gulf of Oman -> Jebel Ali Dubai)
    const seaPoints = [
      [18.9500, 72.9500], [19.2000, 70.0000], [21.0000, 66.0000],
      [23.5000, 61.0000], [25.2048, 55.2708]
    ];
    L.polyline(seaPoints, {
      color: '#0284c7',
      weight: 3,
      opacity: 0.8,
      dashArray: '6, 6'
    }).bindTooltip("Arabian Sea Maritime Container Shipping Lane", { sticky: true }).addTo(routesGroup);

    // 2. Render Warehouses
    warehouses.forEach(wh => {
      const icon = createModeIcon('WAREHOUSE', wh.code);
      const marker = L.marker([wh.lat, wh.lng], { icon }).addTo(markersGroup);
      marker.bindPopup(`
        <div class="p-1">
          <div class="flex items-center space-x-1.5 text-amber-700 font-bold text-xs mb-1">
            <span>🏢 WAREHOUSE & TERMINAL</span>
          </div>
          <h4 class="font-bold text-sm text-slate-800">${wh.name}</h4>
          <p class="text-xs text-slate-600">${wh.city}, ${wh.country}</p>
          <div class="mt-2 text-xs border-t pt-1 space-y-0.5 text-slate-700">
            <div>Capacity: <b>${(wh.total_capacity_sqft / 1000).toFixed(0)}k sq.ft</b></div>
            <div>Occupancy: <b>${wh.utilization_percent || 64}%</b></div>
            <div>Cold Room Temp: <b class="text-blue-600">${wh.cold_storage_temp_celsius || 3.2}°C</b></div>
          </div>
        </div>
      `);
    });

    // 3. Render Fleet Entities (Road, Rail, Sea)
    fleetList.forEach(f => {
      const lat = f.current_lat || f.lat;
      const lng = f.current_lng || f.lng;
      if (!lat || !lng) return;

      const icon = createModeIcon(f.fleet_type || f.type, f.code);
      const marker = L.marker([lat, lng], { icon }).addTo(markersGroup);

      const isRoad = f.fleet_type === 'TRUCK';
      const isRail = f.fleet_type === 'TRAIN';
      const isSea = f.fleet_type === 'VESSEL';

      marker.bindPopup(`
        <div class="p-1.5 min-w-[200px]">
          <div class="flex items-center justify-between mb-1">
            <span class="font-bold text-xs px-2 py-0.5 rounded ${
              isRoad ? 'bg-blue-100 text-blue-800' :
              isRail ? 'bg-emerald-100 text-emerald-800' : 'bg-cyan-100 text-cyan-800'
            }">
              ${f.fleet_type || 'FLEET'}
            </span>
            <span class="text-[10px] font-semibold text-emerald-600 flex items-center">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse"></span>
              LIVE SIMULATED
            </span>
          </div>
          <h4 class="font-bold text-sm text-slate-900">${f.name}</h4>
          <div class="text-xs text-slate-500 font-mono mb-2">${f.code} • ${f.operator_name || f.driver_name || f.captain || 'Assigned Operator'}</div>

          <div class="grid grid-cols-2 gap-1.5 text-xs bg-slate-50 p-2 rounded border border-slate-200">
            <div>Speed: <b class="text-slate-800">${f.current_speed || f.speed_kmh || 0} km/h</b></div>
            <div>Heading: <b class="text-slate-800">${Math.round(f.heading || 0)}°</b></div>
            <div>Health: <b class="text-emerald-700">${f.health_score || 95}%</b></div>
            <div>Fuel/Power: <b class="text-blue-700">${f.fuel_level || f.fuel_percent || 80}%</b></div>
          </div>
        </div>
      `);
    });

  }, [fleetList, warehouses, activeShipment]);

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-white">
      {/* Map Header Overlay */}
      <div className="absolute top-3 left-3 z-[1000] bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-lg shadow-md border border-slate-200/80 flex items-center space-x-3 text-xs">
        <div className="flex items-center space-x-1">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span>
          <span className="font-semibold text-slate-700">Road</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block"></span>
          <span className="font-semibold text-slate-700">Rail</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-600 inline-block"></span>
          <span className="font-semibold text-slate-700">Sea</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-600 inline-block"></span>
          <span className="font-semibold text-slate-700">Terminals</span>
        </div>
        <div className="border-l pl-2 text-slate-500 font-mono text-[11px]">
          [SIMULATION MODE ACTIVE]
        </div>
      </div>

      <div ref={mapContainerRef} style={{ width: '100%', height }} />
    </div>
  );
}
