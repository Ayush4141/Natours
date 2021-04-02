console.log('Hello from client side');

export const displayMap = (locations) => {
  mapboxgl.accessToken =
    'pk.eyJ1IjoiYXNodWtsYTIwMDAiLCJhIjoiY2ttbWI5YnhxMWlyeTJwbnplaGxlNzZzOSJ9.xF891NCur6gZv5TtmVI30Q';

  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/ashukla2000/ckmmbmf074zhu17s66yytub8x',
    scrollZoom: false,
    //   center: [-118.113491, 34.111745],
    //   zoom: 4
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((loc) => {
    //Add Marker
    const el = document.createElement('div');
    el.className = 'marker';

    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    //Add PopUp
    new mapboxgl.PopUp({
      offset: 30,
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Dya ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 200,
      left: 100,
      right: 100,
    },
  });
};
