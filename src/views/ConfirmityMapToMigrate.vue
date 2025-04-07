<template>
  <div class="h-full w-full relative" ref="mapContainer"></div>
  <BaseLegend :scale="legendScale" position="top-right">
    <div class="bg-white p-4 rounded-xl shadow-lg relative pointer-events-auto">
      <p class="text-slate-800 mb-2 text-base font-medium">Rechercher une collectivité</p>
      <MultiselectDropdown id="quicknav" :fetchSuggestions="fetchCommunities" v-model:selected="selectedCommunity"
        displayField="Libelle_complet" placeholder="Région, département ou commune" :required="false"
        :onSelect="handleQuickNav" />
    </div>
  </BaseLegend>
  <ConformityModal :show="showInfo" @close="showInfo = false" />
</template>

<script setup>
import BaseLegend from '@/components/BaseLegend.vue';
import ConformityModal from '@/components/ConformityModal.vue';

const periods = ref([])
const period = ref('last');
const showInfo = ref(false);

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
