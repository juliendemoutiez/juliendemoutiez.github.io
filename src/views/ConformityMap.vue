<template>
  <div class="h-full w-full relative" ref="mapContainer"></div>
  <BaseLegend :scale="legendScale" position="bottom-left">
    <div class="bg-white rounded-xl shadow-lg p-6">
      <div v-if="selectedAreas[currentLevel]">
        <div v-if="Object.values(selectedAreas).length > 1" class="flex items-center mb-2">
          <a v-if="currentLevel === 'region'" @click="selectLevel('country', '00')" class="cursor-pointer">
            <p class="text-base text-slate-500 hover:text-slate-800 flex flex-row items-center">
              <Undo2 class="mr-2" />
              France
            </p>
          </a>
          <a v-if="currentLevel === 'department'"
            @click="selectLevel('region', selectedAreas['region'].Code_INSEE_geographique)" class="cursor-pointer">
            <p class="text-base text-slate-500 hover:text-slate-800 flex flex-row items-center text-ellipsis">
              <Undo2 class="mr-2" />
              {{ selectedAreas['region'].Libelle }}
            </p>
          </a>
        </div>
        <p class="font-bold text-3xl text-slate-800 mb-2">{{ selectedAreas[currentLevel].Libelle }}</p>
        <p class="text-lg text-slate-500 mb-4">{{ formatNumber(selectedAreas[currentLevel].Nombre_de_communes) }}
          communes
        </p>
        <div class="space-y-4">
          <div v-for="score in ['3', '2', '1', '0']" :key="score" class="relative">
            <div class="flex justify-between text-sm text-slate-600 mb-1">
              <span>
                {{ formatNumber(selectedAreas[currentLevel].Communes_par_score[period][score]) }}
                ({{ Math.round(selectedAreas[currentLevel].Communes_par_score[period][score] /
                  selectedAreas[currentLevel].Nombre_de_communes * 100) }}%)
              </span>
            </div>
            <div class="h-3 bg-slate-200 rounded-full w-full">
              <transition name="bar" appear>
                <div class="h-full rounded-full transition-[width] duration-1000 ease-ease" :style="{
                  width: dataIsLoaded ? `${(Math.round(selectedAreas[currentLevel].Communes_par_score[period][score] / selectedAreas[currentLevel].Nombre_de_communes * 100))}%` : '0%',
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

    <div class="mt-4 bg-white rounded-xl p-6 text-slate-500 hover:text-slate-800" v-if="currentLevel == 'department'">
      <div v-if="selectedAreas['city']">
        <p class="font-bold text-2xl text-slate-800 mb-2">{{ selectedAreas['city'].NOM }}</p>
        <div>
          <div class="flex items-center mb-1">
            <span class="w-5 h-5 mr-2 rounded-full flex items-center justify-center"
              :style="{ backgroundColor: getColor(selectedAreas['city'].score_components[period].indexOf('TLD OK') < 0 ? 0 : 3) }">
              <span class="text-white leading-3">{{ selectedAreas['city'].score_components[period].indexOf('TLD OK') < 0
                ? '×' : '✓' }}</span>
              </span>
              <span class="text-slate-800">Domaine et extension conformes</span>
          </div>
          <div class="flex items-center mb-1">
            <span class="w-5 h-5 mr-2 rounded-full flex items-center justify-center"
              :style="{ backgroundColor: getColor(selectedAreas['city'].score_components[period].indexOf('PROP') < 0 ? 0 : 3) }">
              <span class="text-white leading-3">{{ selectedAreas['city'].score_components[period].indexOf('PROP') < 0
                ? '×' : '✓' }}</span>
              </span>
              <span class="text-slate-800">Propriété du domaine</span>
          </div>
          <div class="flex items-center mb-1">
            <span class="w-5 h-5 mr-2 rounded-full flex items-center justify-center"
              :style="{ backgroundColor: getColor(selectedAreas['city'].score_components[period].indexOf('HTTPS') < 0 ? 0 : 3) }">
              <span class="text-white leading-3">{{ selectedAreas['city'].score_components[period].indexOf('HTTPS') < 0
                ? '×' : '✓' }}</span>
              </span>
              <span class="text-slate-800">Site web conforme (HTTPS)</span>
          </div>
          <div class="flex items-center mb-1">
            <span class="w-5 h-5 mr-2 rounded-full flex items-center justify-center"
              :style="{ backgroundColor: getColor(selectedAreas['city'].score_components[period].indexOf('MAIL OK') < 0 ? 0 : 3) }">
              <span class="text-white leading-3">{{ selectedAreas['city'].score_components[period].indexOf('MAIL OK')
                < 0 ? '×' : '✓' }}</span>
              </span>
              <span class="text-slate-800">Messagerie conforme</span>
          </div>
          <p class="text-slate-800 mt-6 mb-2 font-medium">Mettre à jour les données</p>
          <a :href="`${selectedAreas['city'].public_service_link}/demande-de-mise-a-jour`"
            class="flex bg-slate-100 rounded-md p-2 hover:bg-slate-100" target="_blank">
            <SquareArrowOutUpRight class="mr-2 w-5 text-slate-500" />
            <span class="text-slate-500 truncate">Annuaire Service Public - {{ selectedAreas['city'].NOM }}</span>
          </a>
        </div>
      </div>
      <div v-else>
        <p class="text-slate-500">Cliquez sur une commune pour afficher les détails</p>
      </div>
    </div>
    <div class="mt-4 bg-white rounded-xl shadow-lg p-6 text-slate-500 hover:text-slate-800">
      <div class="flex flex-row items-center justify-between mb-4">
        <p class="font-medium text-slate-800 mr-2">Données</p>
        <select v-model="period" class="bg-slate-100 rounded-md p-2 text-slate-800 px-2">
          <option value="t0">Historique</option>
          <option value="t1">Q1 2025</option>
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
import { ref, watch, onMounted } from 'vue';
import L from 'leaflet';
import * as d3 from 'd3';
import { Undo2, Info, SquareArrowOutUpRight } from 'lucide-vue-next';
import { useGrist } from '@/composables/useGrist';
import { useBaseMap } from '@/composables/useBaseMap';
import BaseLegend from '@/components/BaseLegend.vue';
import ConformityModal from '@/components/ConformityModal.vue';
import { formatNumber } from '@/utils/numberFormat'

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
const period = ref('t1');
const selectedAreas = ref({});
const showInfo = ref(false);

// Initialise composables
const { executeQuery, fetchAttachment, initializeGrist } = useGrist();
const { map, mapContainer, legendScale, initializeMap } = useBaseMap(CONFIG.mapSettings);

// Methods
const getAreaQuery = (parentCode) => {
  const query = `SELECT Code_INSEE_geographique, Libelle, Nombre_de_communes, 
                 Communes_par_score, geoJSON_regions, geoJSON_departements, 
                 geoJSON_communes 
                 FROM COLLECTIVITES 
                 WHERE Code_INSEE_geographique = ?`;
  return { query, args: [parentCode] };
};

const getChildrenQuery = (parentCode) => {
  const whereClause = {
    'country': "WHERE Typologie = 'Région'",
    'region': `WHERE Typologie = 'Département' AND Code_INSEE_region = ?`,
    'department': `WHERE Typologie = 'Commune' AND Code_INSEE_departement = ?`
  }[currentLevel.value];

  const query = `SELECT Code_INSEE_geographique, Typologie, Libelle, 
                 Lien_Annuaire_Service_Public, Composants_score, Score, 
                 Score_moyen 
                 FROM COLLECTIVITES ${whereClause}`;

  return {
    query,
    args: currentLevel.value === 'country' ? [] : [parentCode]
  };
};

const loadSelectedArea = async (parentCode) => {
  try {
    const { query, args } = getAreaQuery(parentCode);
    const records = await executeQuery(query, args);

    if (!records?.[0]?.fields) {
      throw new Error('Invalid data structure received');
    }

    const areaData = records[0].fields;
    const geoJSONkey = {
      'country': 'geoJSON_regions',
      'region': 'geoJSON_departements',
      'department': 'geoJSON_communes'
    }[currentLevel.value];

    const attachmentId = JSON.parse(areaData[geoJSONkey])[0];
    const geoJSON = await fetchAttachment(attachmentId).then(res => res.json());

    areaData.Communes_par_score = JSON.parse(areaData.Communes_par_score);

    return { ...areaData, geoJSON };
  } catch (err) {
    console.error('Failed to load area:', err);
    throw err;
  }
};

const loadAreaChildren = async (parentCode) => {
  try {
    const { query, args } = getChildrenQuery(parentCode);
    const records = await executeQuery(query, args);
    return records;
  } catch (err) {
    console.error('Failed to load children:', err);
    throw err;
  }
};

const loadAndRenderLevel = async (parentCode) => {
  try {
    const [selectedArea, childrenAreas] = await Promise.all([
      loadSelectedArea(parentCode),
      loadAreaChildren(parentCode)
    ]);

    if (!selectedArea || !childrenAreas) {
      throw new Error('Failed to load area data');
    }

    selectedAreas.value[currentLevel.value] = {
      ...selectedArea,
      childrenAreas
    };

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

    const { geoJSON, childrenAreas } = selectedAreas.value[currentLevel.value];
    const processedFeatures = geoJSON.features.map(feature => {
      const record = childrenAreas.find(r =>
        r.fields.Code_INSEE_geographique === feature.properties.CODE
      );
      if (!record) return feature;

      const score = record.fields.Typologie === 'Commune'
        ? JSON.parse(record.fields.Score)
        : JSON.parse(record.fields.Score_moyen);

      return {
        ...feature,
        properties: {
          ...feature.properties,
          score,
          score_components: JSON.parse(record.fields.Composants_score || '{}'),
          public_service_link: record.fields.Lien_Annuaire_Service_Public
        }
      };
    });

    mainLayer.value = L.geoJSON(
      { ...geoJSON, features: processedFeatures },
      {
        style: (feature) => getFeatureStyle(feature.properties.score?.[period.value]),
        onEachFeature: bindFeatureEvents
      }
    ).addTo(map.value);

    updateMapView();

    await new Promise(resolve => setTimeout(resolve, 100));
    dataIsLoaded.value = true;
  } catch (err) {
    console.error('Failed to render geography:', err);
    throw err;
  }
};

const updateMapView = () => {
  if (currentLevel.value === 'country') {
    map.value.setView(CONFIG.mapSettings.defaultViewCoords, CONFIG.mapSettings.defaultZoom);
  } else if (mainLayer.value?.getBounds()?.isValid()) {
    map.value.fitBounds(mainLayer.value.getBounds());
  }
};

const getFeatureStyle = (score) => ({
  fillColor: getColor(score),
  weight: 2,
  opacity: 1,
  color: 'white',
  fillOpacity: 0.7
});

const bindFeatureEvents = (feature, layer) => {
  const tooltipContent = currentLevel.value !== 'department'
    ? `<div class="bg-white p-2">
         <p class="font-bold text-base text-slate-800">${feature.properties.NOM}</p>
       </div>`
    : `<div class="bg-white p-2">
         <p class="font-bold text-base text-slate-800 mb-2">${feature.properties.NOM}</p>
         <p>Cliquez pour afficher les détails</p>
       </div>`;

  layer
    .on({
      mouseover: highlightFeature,
      mouseout: resetHighlight,
      click: () => handleAreaClick(feature.properties)
    })
    .bindTooltip(tooltipContent, { permanent: false });
};

const highlightFeature = (e) => {
  const layer = e.target;
  const score = e.target.feature?.properties?.score?.[period.value];
  layer.setStyle({
    weight: 3,
    color: getColor(score),
    opacity: 0.9,
  });
  layer.bringToFront();
};

const resetHighlight = (e) => {
  mainLayer.value?.resetStyle(e.target);
};

const handleAreaClick = async (properties) => {
  if (currentLevel.value === 'department') {
    selectedAreas.value.city = properties;
    return;
  }

  const levelTransitions = {
    'country': 'region',
    'region': 'department'
  };

  currentLevel.value = levelTransitions[currentLevel.value];
  await loadAndRenderLevel(properties.CODE);
};

const selectLevel = async (level, code) => {
  if (currentLevel.value === level) return;

  currentLevel.value = level;
  if (level === 'country') {
    selectedAreas.value = {};
  } else if (level === 'region') {
    selectedAreas.value = {
      region: null,
      department: null,
      city: null
    };
  }

  await loadAndRenderLevel(code);
};

const getColor = (score) => {
  return score === null ? CONFIG.colors.defaultColor : colorScale(score);
};

// Watches
watch(period, () => {
  if (!mainLayer.value) return;

  mainLayer.value.eachLayer(layer => {
    const score = layer.feature.properties.score[period.value];
    layer.setStyle(getFeatureStyle(score));
  });
});

// Lifecycle hooks
onMounted(async () => {
  try {
    await initializeGrist();
    await initializeMap();
    await loadAndRenderLevel('00');
  } catch (err) {
    console.error('Component initialization failed:', err);
  }
});
</script>
