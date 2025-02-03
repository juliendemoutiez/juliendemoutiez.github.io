<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import L from 'leaflet';
import { useGrist } from '@/composables/useGrist';
import { useBaseMap } from '@/composables/useBaseMap';
import BaseLegend from '@/components/BaseLegend.vue';

const QUERIES = {
  pilotCities: `
    SELECT Code_INSEE_geographique, Libelle, Code_INSEE_departement, 
           Typologie, Latitude, Longitude 
    FROM COLLECTIVITES 
    WHERE Groupe_pilote = true
  `,
  organisations: `
    SELECT Nom, Departements, ProConnecte 
    FROM ORGANISATIONS
  `,
  departments: `
    SELECT id, Code_INSEE_geographique 
    FROM COLLECTIVITES 
    WHERE Typologie = 'Département'
  `,
  departmentsGeoJSON: `
    SELECT id, geoJSON_departements 
    FROM COLLECTIVITES 
    WHERE Typologie = 'Pays'
  `
};

const CONFIG = {
  mapSettings: {
    defaultViewCoords: [46.603354, 1.888334],
    defaultZoom: 6,
    tileLayer: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '© OpenStreetMap contributors'
  },
  colors: {
    blue: '#3b82f6',
    green: '#22c55e',
    yellow: '#fbbf24',
    transparent: 'transparent'
  },
  markers: {
    radius: 7,
    weight: 4,
    opacity: 1,
    fillOpacity: 0.7,
    highlightFillOpacity: 0.55
  }
};

// State
const cities = ref(null);
const departments = ref(null);
const departmentsGeoJSON = ref(null);
const organisations = ref(null);

// Map layers
const citiesLayer = ref(null);
const organisationsLayer = ref(null);

// Composables
const { executeQuery, fetchAttachment, setupSubscriptions, initializeGrist } = useGrist();
const { map, mapContainer, legendScale, initializeMap } = useBaseMap(CONFIG.mapSettings);

// Methods
const loadDepartments = async () => {
  try {
    departments.value = await executeQuery(QUERIES.departments);
  } catch (err) {
    console.error('Failed to load departments:', err);
  }
};

const loadDepartmentsGeoJSON = async () => {
  try {
    const records = await executeQuery(QUERIES.departmentsGeoJSON);
    const attachmentId = JSON.parse(records[0].fields.geoJSON_departements)[0];
    const response = await fetchAttachment(attachmentId);
    departmentsGeoJSON.value = await response.json();
  } catch (err) {
    console.error('Failed to load GeoJSON:', err);
  }
};

const loadCities = async () => {
  try {
    cities.value = await executeQuery(QUERIES.pilotCities);
  } catch (err) {
    console.error('Failed to load pilot cities:', err);
  }
};

const loadOrganisations = async () => {
  try {
    organisations.value = await executeQuery(QUERIES.organisations);
  } catch (err) {
    console.error('Failed to load organisations:', err);
  }
};

const getOrganisationStyle = (feature) => {
  const departmentId = findDepartmentId(feature.properties.CODE);
  const relatedOrganisations = findRelatedOrganisations(departmentId);

  if (!relatedOrganisations.length) {
    return {
      color: CONFIG.colors.transparent,
      weight: 0,
      opacity: 0,
      fillOpacity: 0,
    };
  }

  return {
    color: relatedOrganisations.some(org => org.fields.ProConnecte)
      ? CONFIG.colors.green
      : CONFIG.colors.yellow,
    weight: 2,
    opacity: 1,
    fillOpacity: 0.3,
  };
};

const getOrganisationTooltip = (feature) => {
  const departmentId = findDepartmentId(feature.properties.CODE);
  const relatedOrganisations = findRelatedOrganisations(departmentId);

  if (!relatedOrganisations.length) return null;

  return relatedOrganisations.map(org => `
    <div class="bg-white p-2">
      <p class="font-bold text-base text-slate-800">${org.fields.Nom}</p>
      ${org.fields.ProConnecte ? '<p class="text-sm text-slate-600">✅ ProConnecté</p>' : ''}
    </div>
  `).join('');
};

const getCityTooltip = (city) => {
  return `
    <div class="bg-white p-2">
      <p class="font-bold text-base text-slate-800">
        ${city.fields.Libelle} (${city.fields.Code_INSEE_departement})
      </p>
    </div>
  `;
};

const renderOrganisationsLayer = () => {
  if (!map.value || !departmentsGeoJSON.value) return;

  // Remove existing layer if present
  if (organisationsLayer.value) {
    map.value.removeLayer(organisationsLayer.value);
  }

  // Create new layer
  const newLayer = L.geoJSON(departmentsGeoJSON.value, {
    style: getOrganisationStyle,
    onEachFeature: bindDepartmentEvents
  });

  // Add to map
  newLayer.addTo(map.value);
  organisationsLayer.value = newLayer;
};

const renderCitiesLayer = () => {
  if (!map.value || !cities.value) return;

  // Remove existing markers
  if (citiesLayer.value) {
    citiesLayer.value.clearLayers();
  } else {
    citiesLayer.value = L.featureGroup().addTo(map.value);
  }

  // Add new markers
  cities.value.forEach(city => {
    if (city.fields.Latitude === null || city.fields.Longitude === null) {
      return
    }
    const marker = L.circleMarker(
      [city.fields.Latitude, city.fields.Longitude],
      {
        radius: CONFIG.markers.radius,
        fillColor: CONFIG.colors.blue,
        color: CONFIG.colors.blue,
        weight: CONFIG.markers.weight,
        opacity: CONFIG.markers.opacity,
        fillOpacity: CONFIG.markers.fillOpacity,
      }
    );
    marker.bindTooltip(getCityTooltip(city), { permanent: false });
    citiesLayer.value.addLayer(marker);
  });
};

const bindDepartmentEvents = (feature, layer) => {
  layer.on({
    mouseover: highlightDepartment,
    mouseout: resetHighlightDepartment,
  });

  const tooltipContent = getOrganisationTooltip(feature);
  if (tooltipContent) {
    layer.bindTooltip(tooltipContent, { permanent: false });
  }
};

const highlightDepartment = (e) => {
  const layer = e.target;
  layer.setStyle({
    fillOpacity: CONFIG.markers.highlightFillOpacity,
  });
  layer.bringToFront();
  citiesLayer.value?.bringToFront();
};

const resetHighlightDepartment = (e) => {
  organisationsLayer.value?.resetStyle(e.target);
  citiesLayer.value?.bringToFront();
};

const findDepartmentId = (code) => {
  return departments.value?.find(d =>
    d.fields.Code_INSEE_geographique === code
  )?.fields.id;
};

const findRelatedOrganisations = (departmentId) => {
  if (!departmentId || !organisations.value) return [];

  return organisations.value.filter(org => {
    try {
      return JSON.parse(org.fields.Departements).includes(departmentId);
    } catch {
      return false;
    }
  });
};

const loadData = async () => {
  try {
    // Load data
    await Promise.all([
      loadCities(),
      loadOrganisations()
    ]);

    // Update layers
    await Promise.all([
      renderCitiesLayer(),
      renderOrganisationsLayer(),
    ]);

    citiesLayer.value.bringToFront();

  } catch (err) {
    console.error('Failed to load data:', err);
  }
};

// Initialize map layers
const initializeLayers = () => {
  citiesLayer.value = L.featureGroup().addTo(map.value);
  organisationsLayer.value = L.featureGroup().addTo(map.value);
};

// Cleanup layers
const cleanupLayers = () => {
  if (citiesLayer.value) {
    citiesLayer.value.remove();
    citiesLayer.value = null;
  }
  if (organisationsLayer.value) {
    organisationsLayer.value.remove();
    organisationsLayer.value = null;
  }
};

onBeforeUnmount(() => {
  cleanupLayers();
});

// Lifecycle
onMounted(async () => {
  try {
    // Initialize Grist and get token
    await initializeGrist();

    // Initialize the map and layers
    await initializeMap();
    initializeLayers();

    // Load the data
    await Promise.all([
      loadDepartments(),
      loadDepartmentsGeoJSON()
    ]);

    setupSubscriptions(() => {
      loadData();
    });

    await loadData();
  } catch (err) {
    console.error('Initialization error:', err);
  }
});
</script>

<template>
  <div class="h-full w-full relative" ref="mapContainer">
    <BaseLegend :scale="legendScale" position="bottom-right">
      <p class="font-bold text-2xl text-slate-800 mb-4">Groupe pilote</p>
      <div class="space-y-2">
        <div class="flex flex-row items-center">
          <div class="w-4 flex items-center justify-center mr-3">
            <div class="w-2 h-2 rounded-full bg-blue-500/70 ring-4 ring-blue-500"></div>
          </div>
          <p class="text-base text-slate-500">Commune</p>
        </div>
        <div class="flex flex-row items-center">
          <div class="w-4 flex items-center justify-center mr-3">
            <div class="w-4 h-4 rounded-md bg-green-500/30 ring-2 ring-green-500"></div>
          </div>
          <p class="text-base text-slate-500">Département couvert par un OPSN ProConnecté</p>
        </div>
        <div class="flex flex-row items-center">
          <div class="w-4 flex items-center justify-center mr-3">
            <div class="w-4 h-4 rounded-md bg-yellow-500/30 ring-2 ring-yellow-500"></div>
          </div>
          <p class="text-base text-slate-500">Département non couvert par un OPSN ProConnecté</p>
        </div>
      </div>
    </BaseLegend>
  </div>
</template>