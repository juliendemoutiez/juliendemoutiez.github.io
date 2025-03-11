<template>
  <div class="h-full w-full relative" ref="mapContainer"></div>
  <BaseLegend :scale="legendScale" position="top-right">
    <div class="bg-white p-4 rounded-xl shadow-lg relative">
      <p class="text-slate-800 mb-2 text-base font-medium">Rechercher une collectivité</p>
      <MultiselectDropdown id="quicknav" :fetchSuggestions="fetchCommunities" v-model:selected="selectedCommunity"
        displayField="Libelle_complet" placeholder="Région, département ou commune" :required="false"
        :onSelect="handleQuickNav" />
    </div>
  </BaseLegend>
  <BaseLegend :scale="legendScale" position="bottom-left">
    <div class="bg-white rounded-xl shadow-lg p-6">
      <div v-if="selectedAreas[currentLevel]">
        <div v-if="Object.values(selectedAreas).length > 1" class="flex items-center mb-2">
          <a v-if="currentLevel === 'region'" @click="getBackLevel('country', '00')" class="cursor-pointer">
            <p class="text-base text-slate-500 hover:text-slate-800 flex flex-row items-center">
              <Undo2 class="mr-2" />
              France
            </p>
          </a>
          <a v-if="currentLevel === 'department' && selectedAreas['region']"
            @click="getBackLevel('region', selectedAreas['region'].Code_INSEE_geographique)" class="cursor-pointer">
            <p class="text-base text-slate-500 hover:text-slate-800 flex flex-row items-center text-ellipsis">
              <Undo2 class="mr-2" />
              {{ selectedAreas['region'].Libelle }}
            </p>
          </a>
          <a v-if="currentLevel === 'epci' && selectedAreas['department']"
            @click="getBackLevel('department', selectedAreas['department'].Code_INSEE_geographique)"
            class="cursor-pointer">
            <p class="text-base text-slate-500 hover:text-slate-800 flex flex-row items-center text-ellipsis">
              <Undo2 class="mr-2" />
              {{ selectedAreas['department'].Libelle }}
            </p>
          </a>
        </div>
        <p class="font-bold text-3xl text-slate-800 mb-2">{{ selectedAreas[currentLevel].Libelle }}</p>
        <div class="flex flex-row items-center space-x-4 mb-4 border-b pb-4 border-slate-200"
          v-if="currentLevel === 'department'">
          <p class="text-base text-slate-500">Afficher les</p>
          <a v-for="view in ['city', 'epci']" :key="view"
            class="cursor-pointer text-base text-slate-500 hover:text-slate-800 bg-slate-100 rounded-md px-2 py-1"
            @click="departmentView = view"
            :class="{ 'bg-slate-600 text-white hover:text-white': departmentView === view }">
            {{ view === 'city' ? 'Communes' : 'EPCI' }}
          </a>
        </div>
        <p class="text-lg text-slate-500 mb-4">{{ formatNumber(selectedAreas[currentLevel].Nombre_de_communes) }}
          communes
        </p>
        <div class="space-y-4">
          <div v-for="score in ['3', '2', '1', '0']" :key="score" class="relative">
            <div class="flex justify-between text-sm text-slate-600 mb-1">
              <span>
                {{ formatNumber(getValueForPeriod(selectedAreas[currentLevel].Communes_par_score, period)[score]) }}
                ({{ Math.round(getValueForPeriod(selectedAreas[currentLevel].Communes_par_score, period)[score] /
                  selectedAreas[currentLevel].Nombre_de_communes * 100) }}%)
              </span>
            </div>
            <div class="h-3 bg-slate-200 rounded-full w-full">
              <transition name="bar" appear>
                <div class="h-full rounded-full transition-[width] duration-1000 ease-ease" :style="{
                  width: dataIsLoaded ? `${(Math.round(getValueForPeriod(selectedAreas[currentLevel].Communes_par_score, period)[score] / selectedAreas[currentLevel].Nombre_de_communes * 100))}%` : '0%',
                  backgroundColor: getColor(parseInt(score))
                }">
                </div>
              </transition>
            </div>
          </div>
        </div>
      </div>
      <div v-else>
        <div class="animate-pulse">
          <div v-if="currentLevel !== 'country'" class="h-5 bg-slate-100 rounded w-1/2 mb-4"></div>
          <div class="h-12 bg-slate-100 rounded w-3/4 mb-4" :class="{ 'h-16': currentLevel !== 'country' }"></div>
          <div class="h-5 bg-slate-100 rounded w-1/2 mb-4"></div>
          <div class="space-y-4">
            <div v-for="i in 4" :key="i">
              <div class="h-4 bg-slate-100 rounded-full w-1/5 mb-1"></div>
              <div class="h-4 bg-slate-100 rounded-full w-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-4 bg-white rounded-xl p-6 text-slate-500 hover:text-slate-800"
      v-if="currentLevel == 'department' || currentLevel == 'epci'">
      <div v-if="selectedAreas['city']">
        <p class="font-bold text-2xl text-slate-800 mb-2">{{ selectedAreas['city'].Libelle }}</p>
        <div>
          <div class="flex items-center mb-1">
            <span class="w-5 h-5 mr-2 rounded-full flex items-center justify-center"
              :style="{ backgroundColor: getColor(getValueForPeriod(selectedAreas['city'].Composants_score, period).indexOf('TLD OK') < 0 ? 0 : 3) }">
              <span class="text-white leading-3">{{ getValueForPeriod(selectedAreas['city'].Composants_score,
                period).indexOf('TLD OK') < 0 ? '×' : '✓' }}</span>
              </span>
              <span class="text-slate-800">Domaine et extension conformes</span>
          </div>
          <div class="flex items-center mb-1">
            <span class="w-5 h-5 mr-2 rounded-full flex items-center justify-center"
              :style="{ backgroundColor: getColor(getValueForPeriod(selectedAreas['city'].Composants_score, period).indexOf('PROP') < 0 ? 0 : 3) }">
              <span class="text-white leading-3">{{ getValueForPeriod(selectedAreas['city'].Composants_score,
                period).indexOf('PROP') < 0 ? '×' : '✓' }}</span>
              </span>
              <span class="text-slate-800">Propriété du domaine</span>
          </div>
          <div class="flex items-center mb-1">
            <span class="w-5 h-5 mr-2 rounded-full flex items-center justify-center"
              :style="{ backgroundColor: getColor(getValueForPeriod(selectedAreas['city'].Composants_score, period).indexOf('HTTPS') < 0 ? 0 : 3) }">
              <span class="text-white leading-3">{{ getValueForPeriod(selectedAreas['city'].Composants_score,
                period).indexOf('HTTPS') < 0 ? '×' : '✓' }}</span>
              </span>
              <span class="text-slate-800">Site web conforme (HTTPS)</span>
          </div>
          <div class="flex items-center mb-1">
            <span class="w-5 h-5 mr-2 rounded-full flex items-center justify-center"
              :style="{ backgroundColor: getColor(getValueForPeriod(selectedAreas['city'].Composants_score, period).indexOf('MAIL OK') < 0 ? 0 : 3) }">
              <span class="text-white leading-3">{{ getValueForPeriod(selectedAreas['city'].Composants_score,
                period).indexOf('MAIL OK') < 0 ? '×' : '✓' }}</span>
              </span>
              <span class="text-slate-800">Messagerie conforme</span>
          </div>
          <p class="text-slate-800 mt-6 mb-2 font-medium">Mettre à jour les données</p>
          <a :href="`${selectedAreas['city'].Lien_Annuaire_Service_Public}/demande-de-mise-a-jour`"
            class="flex bg-slate-100 rounded-md p-2 hover:bg-slate-100" target="_blank">
            <SquareArrowOutUpRight class="mr-2 w-5 text-slate-500" />
            <span class="text-slate-500 truncate">Annuaire Service Public - {{ selectedAreas['city'].Libelle }}</span>
          </a>
        </div>
      </div>
      <div v-else>
        <p class="text-slate-500">Cliquez sur une commune pour afficher les détails</p>
      </div>
    </div>
    <div class="mt-4 bg-white rounded-xl shadow-lg p-6 text-slate-500 hover:text-slate-800">
      <div class="flex flex-row items-center justify-between mb-4">
        <p class="font-medium text-base text-slate-800 mr-2">Données</p>
        <select v-model="period" class="bg-slate-100 rounded-md p-2 text-slate-800 px-2">
          <option v-for="p in periods" :key="p.value" :value="p.value">{{ p.label }}</option>
        </select>
      </div>
      <div @click="showInfo = true" class="cursor-pointer">
        <p class="text-base flex flex-row items-center">
          <Info class="mr-4" />
          En savoir plus sur cette carte
        </p>
      </div>
    </div>
  </BaseLegend>
  <ConformityModal :show="showInfo" @close="showInfo = false" />
</template>

<script setup>
import { ref, watch, onMounted, computed, toRaw } from 'vue';
import L from 'leaflet';
import * as d3 from 'd3';
import { Undo2, Info, SquareArrowOutUpRight } from 'lucide-vue-next';
import * as turf from '@turf/turf';
import { useGrist } from '@/composables/useGrist';
import { useBaseMap } from '@/composables/useBaseMap';

import BaseLegend from '@/components/BaseLegend.vue';
import ConformityModal from '@/components/ConformityModal.vue';
import MultiselectDropdown from '@/components/MultiselectDropdown.vue'

import { formatNumber } from '@/utils/numberFormat'
import { replaceAccents } from '@/utils/sqlUtils'
import { normalizeText } from '@/utils/textUtils'

// Constants
const CONFIG = {
  mapSettings: {
    defaultViewCoords: [46.603354, 1.888334],
    defaultZoom: 6,
    tileLayer: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '© OpenStreetMap contributors'
  },
  colors: {
    domain: [0, 1, 2, 3],
    range: ['#ef4444', '#f97316', '#eab308', '#22c55e'],
    defaultColor: '#64748b'
  }
};

const colorScale = d3.scaleLinear()
  .domain(CONFIG.colors.domain)
  .range(CONFIG.colors.range);

// Refs
const currentLevel = ref('country');
const dataIsLoaded = ref(false);
const mainLayer = ref(null);
const periods = ref([])
const period = ref('last');
const parentAreas = ref(null);
const selectedAreas = ref({});
const showInfo = ref(false);
const selectedCommunity = ref([]);
const departmentView = ref('city')

// Initialise composables
const { executeQuery, fetchAttachment, initializeGrist } = useGrist();
const { map, mapContainer, legendScale, initializeMap } = useBaseMap(CONFIG.mapSettings);

// Load data
const fetchCommunities = async (terms) => {
  try {
    const nameField = 'Libelle_complet'
    const whereConditions = terms.map(term =>
      `${replaceAccents(nameField)} LIKE '%' || '${normalizeText(term)}' || '%'`
    ).join(' AND ');
    const query = `
      SELECT id, ${nameField}, Typologie, Code_INSEE_geographique, Code_INSEE_region, Code_INSEE_departement, Population
      FROM COLLECTIVITES
      WHERE ${whereConditions}
      AND (Typologie = 'Région' OR Typologie = 'Département' OR Typologie = 'Commune' OR Typologie = 'EPCI à fiscalité propre')
      ORDER BY Population DESC
      LIMIT 10
    `
    const records = await executeQuery(query)
    return records.map(record => record.fields)
  } catch (error) {
    console.error('Search error:', error)
  }
}

const parentAreasQuery = () => {
  return `SELECT Code_INSEE_geographique, Code_INSEE_region, Code_INSEE_departement, Libelle, Typologie, Nombre_de_communes, 
                 Communes_par_score, geoJSON_regions, geoJSON_departements, 
                 geoJSON_communes, Score_moyen
                 FROM COLLECTIVITES 
                 WHERE Typologie = 'Pays' OR Typologie = 'Région' OR Typologie = 'Département' OR Typologie = 'EPCI à fiscalité propre'`;
}

const departmentCitiesQuery = (departmentCode) => {
  const query = `SELECT Code_INSEE_geographique, Typologie, Libelle, 
                 Lien_Annuaire_Service_Public, Composants_score, 
                 Score, Code_INSEE_EPCI
                 FROM COLLECTIVITES
                 WHERE Typologie = 'Commune' AND Code_INSEE_departement = ?`;
  return { query, args: [departmentCode] };
};

const loadParentAreas = async () => {
  const records = await executeQuery(parentAreasQuery());
  parentAreas.value = records.map(record => record.fields);
}

const loadDepartmentCities = async (departmentCode) => {
  try {
    const { query, args } = departmentCitiesQuery(departmentCode);
    const records = await executeQuery(query, args);
    return records.map(record => record.fields);
  } catch (err) {
    console.error('Failed to load children:', err);
    throw err;
  }
};

// Process GeoJSON
const processGeoJSON = (geoJSON, childrenAreas) => {
  const features = geoJSON.features.map(feature => {
    const record = childrenAreas.find(r =>
      r.Code_INSEE_geographique === feature.properties.CODE
    );
    if (!record) return feature;

    const score = record.Typologie === 'Commune'
      ? JSON.parse(record.Score)
      : JSON.parse(record.Score_moyen);

    return {
      ...feature,
      properties: {
        CODE_INSEE_GEOGRAPHIQUE: feature.properties.CODE,
        CODE_INSEE_REGION: record.Code_INSEE_region,
        CODE_INSEE_DEPARTEMENT: record.Code_INSEE_departement,
        CODE_INSEE_EPCI: record.Code_INSEE_EPCI,
        LIBELLE: feature.properties.NOM,
        SCORE: score,
        TYPOLOGIE: record.Typologie,
        COMPOSANTS_SCORE: JSON.parse(record.Composants_score || '{}'),
        LIEN_ANNUAIRE_SERVICE_PUBLIC: record.Lien_Annuaire_Service_Public
      }
    };
  });

  return {
    ...geoJSON,
    features
  }
}

const processGeoJSONEPCI = (geoJSON) => {
  const groupedFeatures = d3.group(geoJSON.features, d => d.properties.CODE_INSEE_EPCI);
  const processedGeoJSONFeatures = Array.from(groupedFeatures, ([epciCode, features]) => {
    let merged;
    if (features.length === 1) {
      merged = features[0];
    } else {
      merged = turf.union(turf.featureCollection(features), {}, {
        id: epciCode
      })
    }
    const record = parentAreas.value.find(r => r.Code_INSEE_geographique === epciCode)
    merged.properties = {
      LIBELLE: record ? record.Libelle : 'EPCI inconnue',
      CODE_INSEE_GEOGRAPHIQUE: record ? record.Code_INSEE_geographique : 'EPCI inconnue',
      CODE_INSEE_REGION: record ? record.Code_INSEE_region : 'EPCI inconnue',
      CODE_INSEE_DEPARTEMENT: record ? record.Code_INSEE_departement : 'EPCI inconnue',
      SCORE: record ? JSON.parse(record.Score_moyen) : {},
      TYPOLOGIE: record ? record.Typologie : 'EPCI inconnue',
    }
    return merged
  });
  return processedGeoJSONFeatures
}

// Rendering
const loadAndRenderLevel = async (areaCode) => {
  try {
    const selectedArea = parentAreas.value.find(area => area.Code_INSEE_geographique === areaCode)
    if (currentLevel.value === 'department' && !selectedAreas.value['region'] || currentLevel.value === 'epci' && !selectedAreas.value['department']) {
      const parentLevel = currentLevel.value === 'department' ? 'region' : 'department'
      const parentCode = currentLevel.value === 'department' ? selectedArea.Code_INSEE_region : selectedArea.Code_INSEE_departement
      await selectArea(parentLevel, parentCode)
    }
    if (!selectedAreas.value?.[currentLevel.value]) {
      await selectArea(currentLevel.value, areaCode)
    }
    await renderGeography();
  } catch (err) {
    console.error('Failed to load level:', err);
    throw err;
  }
};

const renderGeography = async () => {
  if (!selectedAreas.value?.[currentLevel.value]) return;
  try {
    dataIsLoaded.value = false;
    if (mainLayer.value) {
      map.value.removeLayer(mainLayer.value);
    }
    let displayedGeoJSON;
    if (currentLevel.value === 'department' && departmentView.value === 'epci') {
      displayedGeoJSON = selectedAreas.value[currentLevel.value].geoJSONEPCI
    } else if (currentLevel.value === 'epci') {
      displayedGeoJSON = { ...selectedAreas.value['department'].geoJSON }
      displayedGeoJSON.features = displayedGeoJSON.features.filter(feature => feature.properties.CODE_INSEE_EPCI === selectedAreas.value[currentLevel.value].Code_INSEE_geographique)
    } else {
      displayedGeoJSON = selectedAreas.value[currentLevel.value].geoJSON
    }
    mainLayer.value = L.geoJSON(displayedGeoJSON, {
      style: (feature) => getFeatureStyle(feature.properties),
      onEachFeature: bindFeatureEvents
    }).addTo(toRaw(map.value));
    await updateMapView();
  } catch (err) {
    console.error('Failed to render geography:', err);
    throw err;
  } finally {
    dataIsLoaded.value = true;
  }
}

// Navigation
const selectArea = async (level, code) => {
  const selectedArea = parentAreas.value.find(area => area.Code_INSEE_geographique === code)
  if (!selectedArea.geoJSON) {
    let childrenAreas;
    if (level === 'department') {
      childrenAreas = await loadDepartmentCities(code)
      selectedArea.childrenAreas = childrenAreas
    } else {
      childrenAreas = {
        'country': parentAreas.value.filter(area => area.Typologie === 'Région'),
        'region': parentAreas.value.filter(area => area.Typologie === 'Département' && area.Code_INSEE_region === code),
      }[level];
    }
    const geoJSONkey = {
      'country': 'geoJSON_regions',
      'region': 'geoJSON_departements',
      'department': 'geoJSON_communes'
    }[level];
    if (geoJSONkey) {
      const attachmentId = JSON.parse(selectedArea[geoJSONkey])[0];
      const geoJSON = await fetchAttachment(attachmentId).then(res => res.json());
      const processedGeoJSON = processGeoJSON(geoJSON, childrenAreas)
      selectedArea.geoJSON = processedGeoJSON
      if (level === 'department') {
        selectedArea.geoJSONEPCI = processGeoJSONEPCI(processedGeoJSON)
      }
    }
  }
  if (typeof selectedArea.Communes_par_score === 'string') {
    selectedArea.Communes_par_score = JSON.parse(selectedArea.Communes_par_score);
  }
  selectedAreas.value[level] = selectedArea
}

const selectCity = (properties) => {
  selectedAreas.value['city'] = {
    Code_INSEE_geographique: properties.CODE_INSEE_GEOGRAPHIQUE,
    Composants_score: properties.COMPOSANTS_SCORE || '{}',
    Score: properties.SCORE,
    Libelle: properties.LIBELLE,
    Lien_Annuaire_Service_Public: properties.LIEN_ANNUAIRE_SERVICE_PUBLIC
  };
}

const getBackLevel = async (level, code) => {
  if (level === 'country') {
    selectedAreas.value = {
      country: selectedAreas.value.country
    };
  } else if (level === 'region') {
    selectedAreas.value = {
      ...selectedAreas.value,
      department: null,
      city: null
    };
  } else if (level === 'department') {
    selectedAreas.value = {
      ...selectedAreas.value,
      epci: null
    };
  }
  selectLevel(level, code)
}

const handleQuickNav = async (community) => {
  setTimeout(() => {
    if (community.Typologie === 'EPCI à fiscalité propre') {
      departmentView.value = 'epci'
    } else {
      departmentView.value = 'city'
    }
  }, 300)
  const level = {
    'Région': 'region',
    'Département': 'department',
    'Commune': 'department',
    'EPCI à fiscalité propre': 'epci'
  }[community.Typologie]
  const codeKey = {
    'Région': 'Code_INSEE_geographique',
    'Département': 'Code_INSEE_geographique',
    'EPCI à fiscalité propre': 'Code_INSEE_geographique',
    'Commune': 'Code_INSEE_departement'
  }[community.Typologie]
  selectedAreas.value = {
    country: selectedAreas.value.country
  };
  await selectLevel(level, community[codeKey])

  if (community.Typologie === 'Commune') {
    const cityProperties = selectedAreas.value['department'].geoJSON.features.find(feature => feature.properties.CODE_INSEE_GEOGRAPHIQUE === community.Code_INSEE_geographique).properties
    selectCity(cityProperties)
  }
}

const selectLevel = async (level, code, parentCode) => {
  currentLevel.value = level;
  await loadAndRenderLevel(code, parentCode);
};

// Periods
const getValueForPeriod = (data, period) => {
  let periodKey;
  if (period === 'last' && Object.keys(data).indexOf('last') > -1) {
    periodKey = 'last'
  } else if (period === 'last') {
    periodKey = Object.keys(data).pop()
  } else {
    const closestPeriod = Object.keys(data).find(key => new Date(key) <= new Date(period));
    periodKey = closestPeriod;
  }
  return data[periodKey];
}

const setPeriods = async () => {
  const startDate = new Date('2024-12-31');
  const endDate = new Date();
  while (startDate <= endDate) {
    const quarter = Math.floor((startDate.getMonth() + 1) / 3);
    const year = startDate.getFullYear();
    periods.value.push({
      label: `Q${quarter} ${year}`,
      value: startDate.toISOString().split('T')[0]
    });
    startDate.setMonth(startDate.getMonth() + 3);
  }
  periods.value.push({
    label: 'Les plus récentes',
    value: 'last'
  });
}

// Map
const getColor = (score) => {
  return score === null ? CONFIG.colors.defaultColor : colorScale(score);
};

const handleAreaClick = async (properties) => {
  if (currentLevel.value === 'department' && departmentView.value === 'city' || currentLevel.value === 'epci') {
    selectCity(properties)
    return;
  }
  await selectLevel(nextLevel.value, properties.CODE_INSEE_GEOGRAPHIQUE)
};

const updateMapView = async () => {
  if (currentLevel.value === 'country') {
    map.value.setView(CONFIG.mapSettings.defaultViewCoords, CONFIG.mapSettings.defaultZoom);
    return;
  }
  const bounds = mainLayer.value.getBounds();
  if (bounds && bounds.isValid()) {
    map.value.fitBounds(bounds, {
      padding: [50, 50],
      maxZoom: 13,
    });
  }
};

const getFeatureStyle = (properties) => {
  const isSelected = selectedAreas.value?.city?.Code_INSEE_geographique === properties.CODE_INSEE_GEOGRAPHIQUE;
  const score = getValueForPeriod(properties.SCORE, period.value)
  return {
    fillColor: getColor(score),
    weight: isSelected ? 3 : 2,
    opacity: 1,
    color: isSelected ? '#1E293B' : 'white',
    fillOpacity: 0.7
  }
};

const bindFeatureEvents = (feature, layer) => {
  const tooltipContent = `<div class="bg-white p-2">
        <p class="font-bold text-base text-slate-800">${feature.properties.LIBELLE}</p>
        ${currentLevel.value === 'department' && departmentView.value === 'city' ? `<p>Cliquez pour afficher les détails</p>` : ''}
      </div>`;
  layer
    .on({
      mouseover: (e) => {
        if (!dataIsLoaded.value) return;
        highlightFeature(e);
      },
      mouseout: (e) => {
        if (!dataIsLoaded.value) return;
        resetHighlight(e);
      },
      click: () => {
        if (!dataIsLoaded.value) return;
        handleAreaClick(feature.properties);
      }
    })
    .bindTooltip(tooltipContent, { permanent: false });
};

const highlightFeature = (e) => {
  if (!dataIsLoaded.value || !e.target) return;
  const layer = e.target;
  const currentColor = e.target.options.fillColor;
  layer.setStyle({
    weight: 3,
    color: currentColor,
    opacity: 0.9,
  });
  if (selectedAreas.value?.city) {
    layer.bringToFront();
    mainLayer.value.eachLayer(l => {
      if (l.feature?.properties?.CODE_INSEE_GEOGRAPHIQUE === selectedAreas.value.city.Code_INSEE_geographique) {
        l.bringToFront();
      }
    });
  } else {
    layer.bringToFront();
  }
};

const resetHighlight = (e) => {
  if (!dataIsLoaded.value || !e.target || !mainLayer.value) return;
  mainLayer.value.resetStyle(e.target);
};

// Computed
const nextLevel = computed(() => {
  if (currentLevel.value === 'department' && departmentView.value === 'epci') {
    return 'epci';
  }
  const levelTransitions = {
    'country': 'region',
    'region': 'department',
    'department': null,
  };
  return levelTransitions[currentLevel.value] || null;
});

// Watches
watch(period, () => {
  if (!mainLayer.value) return;

  mainLayer.value.eachLayer(layer => {
    layer.setStyle(getFeatureStyle(layer.feature.properties));
  });
});

watch(departmentView, () => {
  if (!mainLayer.value || currentLevel.value !== 'department') return;
  renderGeography();
})

watch(() => selectedAreas.value.city, (newCity) => {
  if (!mainLayer.value) return;

  mainLayer.value.eachLayer(layer => {
    if (layer.feature.properties.CODE_INSEE_GEOGRAPHIQUE === newCity?.Code_INSEE_geographique) {
      layer.setStyle(getFeatureStyle(layer.feature.properties));
      layer.bringToFront();
    } else {
      layer.setStyle(getFeatureStyle(layer.feature.properties));
    }
  });
}, { deep: true });

// Lifecycle hooks
onMounted(async () => {
  try {
    await initializeGrist();
    await setPeriods();
    await loadParentAreas();
    await initializeMap();
    await loadAndRenderLevel('00');
  } catch (err) {
    console.error('Component initialization failed:', err);
  }
});
</script>
