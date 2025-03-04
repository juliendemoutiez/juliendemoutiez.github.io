import { ref, onBeforeUnmount } from 'vue'
import L from 'leaflet'

export const useBaseMap = (config) => {
  const map = ref(null)
  const mapContainer = ref(null)
  const legendScale = ref(null)
  let resizeObserver = null

  const defaultConfig = {
    defaultViewCoords: [46.603354, 1.888334],
    defaultZoom: 6,
    tileLayer: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '© OpenStreetMap contributors',
    minZoom: 4,
    maxZoom: 18,
    zoomSnap: 0.25,
    zoomControl: true,
    markerZoomAnimation: false,
  }

  const mapConfig = { ...defaultConfig, ...config }

  const initializeMap = async () => {
    if (!mapContainer.value) {
      throw new Error('Map container not found')
    }

    map.value = L.map(mapContainer.value, {
      zoomSnap: mapConfig.zoomSnap,
      markerZoomAnimation: mapConfig.markerZoomAnimation,
      minZoom: mapConfig.minZoom,
      maxZoom: mapConfig.maxZoom,
      zoomControl: mapConfig.zoomControl,
    })

    map.value.setView(mapConfig.defaultViewCoords, mapConfig.defaultZoom)

    L.tileLayer(mapConfig.tileLayer, {
      attribution: mapConfig.attribution,
    }).addTo(map.value)

    setupResizeObserver()

    return map.value
  }

  const setupResizeObserver = () => {
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const widthScale = Math.max(0.6, Math.min(1, entry.contentRect.width / 1500))
        const heightScale = Math.max(0.6, Math.min(1, entry.contentRect.height / 900))
        legendScale.value = Math.min(widthScale, heightScale)
        if (map.value) {
          map.value.invalidateSize()
        }
      }
    })
    const appContainer = document.getElementById('app')
    if (appContainer) {
      resizeObserver.observe(appContainer)
    }
  }

  const fitBounds = (bounds, options = {}) => {
    if (map.value && bounds) {
      map.value.fitBounds(bounds, options)
    }
  }

  const panTo = (latlng, options = {}) => {
    if (map.value && latlng) {
      map.value.panTo(latlng, options)
    }
  }

  const setZoom = (zoom, options = {}) => {
    if (map.value) {
      map.value.setZoom(zoom, options)
    }
  }

  const addLayer = (layer) => {
    if (map.value && layer) {
      layer.addTo(map.value)
    }
  }

  const removeLayer = (layer) => {
    if (map.value && layer) {
      map.value.removeLayer(layer)
    }
  }

  const clearLayers = (layerGroup) => {
    if (layerGroup) {
      layerGroup.clearLayers()
    }
  }

  const createFeatureGroup = () => {
    return L.featureGroup().addTo(map.value)
  }

  const createGeoJSONLayer = (data, options = {}) => {
    return L.geoJSON(data, options).addTo(map.value)
  }

  const createCircleMarker = (latlng, options = {}) => {
    return L.circleMarker(latlng, options).addTo(map.value)
  }

  onBeforeUnmount(() => {
    if (resizeObserver) {
      resizeObserver.disconnect()
    }
    if (map.value) {
      map.value.remove()
      map.value = null
    }
  })

  return {
    map,
    mapContainer,
    legendScale,
    initializeMap,
    fitBounds,
    panTo,
    setZoom,
    addLayer,
    removeLayer,
    clearLayers,
    createFeatureGroup,
    createGeoJSONLayer,
    createCircleMarker,
  }
}
