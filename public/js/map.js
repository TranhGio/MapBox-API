mapboxgl.accessToken =
  'pk.eyJ1IjoiY3NpZGUiLCJhIjoiY2xhYTBrMXIwMDF4bzNwcDExMDdmNG10ZCJ9.dJ8utYc12qEivXTKawbZxg';
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v11',
  marker: true,
  zoom: 13,
  center: [108.2199588, 16.047079]
});

const geolocate = new mapboxgl.GeolocateControl({
  positionOptions: {
    enableHighAccuracy: true
  },
  trackUserLocation: true,
});

map.on('load', function () {
  geolocate.trigger();
});
const track = geolocate.on('geolocate', locateUser);

map.addControl(geolocate);

map.addControl(
  new MapboxDirections({
    accessToken: mapboxgl.accessToken
  }),
  'top-left'
);

// Fetch stores from API
async function getStores() {
  const res = await fetch('/api/v1/stores');
  const data = await res.json();

  const stores = data.data.map(store => {
    return {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [
          store.location.coordinates[0],
          store.location.coordinates[1]
        ]
      },
      properties: {
        storeId: store.storeId,
        icon: 'shop'
      }
    };
  });

  loadMap(stores);
}

// Load map with stores
function loadMap(stores) {
  map.on('load', function () {
    map.addLayer({
      id: 'points',
      type: 'symbol',
      source: {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: stores
        }
      },
      layout: {
        'icon-image': 'marker-15',
        'icon-size': 1.5,
        'text-field': '{storeId}',
        'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
        'text-offset': [0, 0.9],
        'text-anchor': 'top'
      }
    });
  });
}

async function locateUser(e) {
  geolocate.off('geolocate', null);
  const res = await fetch('/api/v1/stores');
  const data = await res.json();

  let string = `${e.coords.longitude},${e.coords.latitude};`;
  data.data.forEach(async store => {
    string = string + `${store.location.coordinates[0]},${store.location.coordinates[1]};`;
  });

  string = string.slice(0, string.length - 1);
  let result;
  await
    fetch(`https://api.mapbox.com/directions-matrix/v1/mapbox/driving/${string}?sources=0&access_token=pk.eyJ1IjoiY3NpZGUiLCJhIjoiY2xhYTBrMXIwMDF4bzNwcDExMDdmNG10ZCJ9.dJ8utYc12qEivXTKawbZxg`)
      .then((res) => res.json())
      .then((json) => {
        result = json;
      });

  console.log(result);
  const nearLocations = [];
  result.destinations.forEach(r => {
    if (r.distance < 5) {
      nearLocations.push(r);
    }
  });

  console.log(nearLocations);
  nearLocations.map(async l => {
    return {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [
          l.location[0],
          l.location[1],
        ]
      },
      properties: {
        // storeId: l.storeId,
        icon: 'shop'
      }
    };
  });
  // loadMap(nearLocations);
}

getStores();