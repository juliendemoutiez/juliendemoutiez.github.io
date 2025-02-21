<template>
  <div class="h-full w-full relative" ref="mapContainer"></div>
  <BaseLegend :scale="legendScale" position="top-right">
    <div class="bg-white rounded-xl shadow-lg relative">
      <MultiselectDropdown id="quicknav" containerClass="absolute w-full" :fetchSuggestions="fetchCommunities"
        v-model:selected="selectedCommunity" displayField="Libelle_complet" :required="false"
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
import { ref, watch, onMounted, computed } from 'vue';
import L from 'leaflet';
import * as d3 from 'd3';
import { Undo2, Info, SquareArrowOutUpRight } from 'lucide-vue-next';
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
const period = ref('t1');
const selectedAreas = ref({});
const showInfo = ref(false);
const selectedCommunity = ref([]);

// Initialise composables
const { executeQuery, fetchAttachment, initializeGrist } = useGrist();
const { map, mapContainer, legendScale, initializeMap } = useBaseMap(CONFIG.mapSettings);

// Methods
const fetchCommunities = async (terms) => {
  try {
    const nameField = 'Libelle_complet'
    const whereConditions = terms.map(term =>
      `${replaceAccents(nameField)} LIKE '%' || '${normalizeText(term)}' || '%'`
    ).join(' AND ');
    const query = `
      SELECT id, ${nameField}, Typologie, Code_INSEE_geographique, Code_INSEE_departement
      FROM COLLECTIVITES
      WHERE ${whereConditions}
      AND (Typologie = 'Région' OR Typologie = 'Département' OR Typologie = 'Commune')
      ORDER BY ${nameField}
      LIMIT 10
    `
    const records = await executeQuery(query)
    return records.map(record => record.fields).sort((a, b) => a[nameField].localeCompare(b[nameField]))
  } catch (error) {
    console.error('Search error:', error)
  }
}

const getAreaQuery = (parentCode) => {
  const query = `SELECT Code_INSEE_geographique, Code_INSEE_region, Libelle, Nombre_de_communes, 
                 Communes_par_score, geoJSON_regions, geoJSON_departements, 
                 geoJSON_communes 
                 FROM COLLECTIVITES 
                 WHERE Code_INSEE_geographique = ?`;
  return { query, args: [parentCode] };
};

const getChildrenQuery = (level, parentCode) => {
  const whereClause = {
    'country': "WHERE Typologie = 'Région'",
    'region': `WHERE Typologie = 'Département' AND Code_INSEE_region = ?`,
    'department': `WHERE Typologie = 'Commune' AND Code_INSEE_departement = ?`
  }[level];

  const query = `SELECT Code_INSEE_geographique, Typologie, Libelle, 
                 Lien_Annuaire_Service_Public, Composants_score, Score, 
                 Score_moyen 
                 FROM COLLECTIVITES ${whereClause}`;

  return {
    query,
    args: level === 'country' ? [] : [parentCode]
  };
};

const loadArea = async (level, parentCode) => {
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
    }[level];

    const attachmentId = JSON.parse(areaData[geoJSONkey])[0];
    const geoJSON = await fetchAttachment(attachmentId).then(res => res.json());

    areaData.Communes_par_score = JSON.parse(areaData.Communes_par_score);

    return { ...areaData, geoJSON };
  } catch (err) {
    console.error('Failed to load area:', err);
    throw err;
  }
};

const loadAreaChildren = async (level, parentCode) => {
  try {
    const { query, args } = getChildrenQuery(level, parentCode);
    const records = await executeQuery(query, args);
    return records;
  } catch (err) {
    console.error('Failed to load children:', err);
    throw err;
  }
};

const loadAndRenderLevel = async (parentCode) => {

  try {
    if (selectedAreas.value?.[currentLevel.value]) {
      await renderGeography();
      return;
    }

    const [selectedArea, childrenAreas] = await Promise.all([
      loadArea(currentLevel.value, parentCode),
      loadAreaChildren(currentLevel.value, parentCode)
    ]);

    if (!selectedArea || !childrenAreas) {
      throw new Error('Failed to load area data');
    }

    selectedAreas.value[currentLevel.value] = {
      ...selectedArea,
      childrenAreas
    };

    // Load the region if we've skipped to a department/city
    if (currentLevel.value === 'department' && !selectedAreas.value['region']) {
      const regionCode = selectedArea.Code_INSEE_region
      const [parentRegion, parentChildrenAreas] = await Promise.all([
        loadArea('region', regionCode),
        loadAreaChildren('region', regionCode)
      ]);
      selectedAreas.value['region'] = {
        ...parentRegion,
        childrenAreas: parentChildrenAreas
      };
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
        style: (feature) => getFeatureStyle(feature.properties),
        onEachFeature: bindFeatureEvents
      }
    ).addTo(map.value);

    await new Promise(resolve => setTimeout(resolve, 100));
    await updateMapView();
    dataIsLoaded.value = true;
  } catch (err) {
    console.error('Failed to render geography:', err);
    throw err;
  }
};

const updateMapView = async () => {
  if (!map.value) {
    console.warn('Map not initialized');
    return;
  }

  // Add a small delay to ensure the map is ready
  await new Promise(resolve => setTimeout(resolve, 100));

  if (currentLevel.value === 'country') {
    try {
      map.value.setView(CONFIG.mapSettings.defaultViewCoords, CONFIG.mapSettings.defaultZoom);
    } catch (err) {
      console.warn('Failed to set default view:', err);
    }
    return;
  }

  if (!mainLayer.value) {
    console.warn('Main layer not initialized');
    return;
  }

  // try {
  const bounds = mainLayer.value.getBounds();
  if (bounds && bounds.isValid()) {
    map.value.fitBounds(bounds, {
      padding: [50, 50],
      maxZoom: 13
    });
  }
  // } catch {
  //   map.value.setView(CONFIG.mapSettings.defaultViewCoords, CONFIG.mapSettings.defaultZoom);
  // }
};

const getFeatureStyle = (properties) => {
  const isSelected = selectedAreas.value?.city?.CODE === properties.CODE;
  return {
    fillColor: getColor(properties.score?.[period.value]),
    weight: isSelected ? 4 : 2,
    opacity: 1,
    color: isSelected ? getColor(properties.score?.[period.value]) : 'white',
    fillOpacity: 0.7
  }
};

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
  const score = e.target.feature?.properties?.score?.[period.value];
  layer.setStyle({
    weight: 3,
    color: getColor(score),
    opacity: 0.9,
  });
  layer.bringToFront();
};

const resetHighlight = (e) => {
  if (!dataIsLoaded.value || !e.target || !mainLayer.value) return;
  mainLayer.value.resetStyle(e.target);
};

const handleAreaClick = async (properties) => {
  if (currentLevel.value === 'department') {
    selectedAreas.value.city = properties;
    return;
  }
  await selectLevel(nextLevel.value, properties.CODE)
};

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
  }
  selectLevel(level, code)
}

const handleQuickNav = async (community) => {
  const level = {
    'Région': 'region',
    'Département': 'department',
    'Commune': 'department'
  }[community.Typologie]
  const codeKey = {
    'Région': 'Code_INSEE_geographique',
    'Département': 'Code_INSEE_geographique',
    'Commune': 'Code_INSEE_departement'
  }[community.Typologie]
  selectedAreas.value = {
    country: selectedAreas.value.country
  };
  await selectLevel(level, community[codeKey])

  if (community.Typologie === 'Commune') {
    const cityRecord = selectedAreas.value['department'].childrenAreas.find(
      child => child.fields.Code_INSEE_geographique === community.Code_INSEE_geographique
    );
    if (cityRecord) {
      selectedAreas.value['city'] = {
        ...cityRecord.fields,
        score_components: JSON.parse(cityRecord.fields.Composants_score || '{}'),
        score: JSON.parse(cityRecord.fields.Score),
        CODE: cityRecord.fields.Code_INSEE_geographique,
        NOM: cityRecord.fields.Libelle,
        public_service_link: cityRecord.fields.Lien_Annuaire_Service_Public
      };
    }
  }
}

const selectLevel = async (level, code) => {
  currentLevel.value = level;
  await loadAndRenderLevel(code);
};

const getColor = (score) => {
  return score === null ? CONFIG.colors.defaultColor : colorScale(score);
};

// Computed
const nextLevel = computed(() => {
  const levelTransitions = {
    'country': 'region',
    'region': 'department',
    'department': null
  };
  return levelTransitions[currentLevel.value] || null;
});

// Watches
watch(period, () => {
  if (!mainLayer.value) return;

  mainLayer.value.eachLayer(layer => {
    const score = layer.feature.properties.score[period.value];
    layer.setStyle(getFeatureStyle(score));
  });
});

watch(() => selectedAreas.value.city, (newCity) => {
  if (!mainLayer.value) return;

  mainLayer.value.eachLayer(layer => {
    if (layer.feature.properties.CODE === newCity?.CODE) {
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
    await initializeMap();
    await loadAndRenderLevel('00');
  } catch (err) {
    console.error('Component initialization failed:', err);
  }
});
</script>
