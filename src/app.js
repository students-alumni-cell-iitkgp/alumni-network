import Globe from 'globe.gl';
import { request, getCoordinates, numberWithCommas, formatDate } from './utils';
import {
  GLOBE_IMAGE_URL,
  BACKGROUND_IMAGE_URL,
  GEOJSON_URL,
  CASES_API,
} from './constants';
import * as d3 from 'd3';

// Globe container
const globeContainer = document.getElementById('globeViz');
const colorScale = d3.scaleSequentialPow(d3.interpolateYlOrRd).exponent(1 / 4);
const getVal = (feat) => feat.alumniData.count;

let world;
init();

function init() {
  world = Globe()(globeContainer)
  .globeImageUrl(GLOBE_IMAGE_URL)
  .showGraticules(false)
  .polygonAltitude(0.05)
  .polygonCapColor((feat) => colorScale(getVal(feat)))
  .polygonSideColor(() => 'rgba(0, 100, 0, 0.05)')
  .polygonStrokeColor(() => '#111')
  .polygonLabel(
    ({ properties: d, alumniData: c }) => `
    <div class="card">
    <img class="card-img" src="${"https://disease.sh/assets/img/flags/" + d["ISO_A2"].toLowerCase() + ".png"}" alt="flag" />
    <div class="container">
    <span class="card-title"><b>${d.ADMIN}</b></span> <br />
    <span class="card-total-cases">${numberWithCommas(
      c.count
      )} Alumni</span>
      <div class="card-spacer"></div>
      <hr />
      <div class="card-spacer"></div>
      <span>${numberWithCommas(c.chapters)} chapters</span> <br />
      <div class="card-spacer"></div>
      <hr />
      <div class="card-spacer"></div>
      <div class="bottom-info">
      </div>
      </div>
      </div>
      `
      )
      .onPolygonHover((hoverD) =>
      world
      .polygonAltitude((d) => (d === hoverD ? 0.12 : 0.06))
      .polygonCapColor((d) =>
      d === hoverD ? 'steelblue' : colorScale(getVal(d))
      )
      )
      .polygonsTransitionDuration(300);
      
  getCases();
}

async function getCases() {
  let data_count = 0;
  let chapters_count = 0;
  const countries = await request(GEOJSON_URL);
  const data = await request(CASES_API);

  const countriesWithAlumni = [];

  const country_names = Object.keys(data);
  country_names.forEach((item) => {
      if(item != "NA"){
        data_count += data[item].count;
        chapters_count += data[item].chapters;
      }
      const countryIdxByName = countries.features.findIndex(
        (i) => i.properties.ADMIN.toLowerCase() === item.toLowerCase()
      );

      if (countryIdxByName !== -1) {
        countriesWithAlumni.push({
          ...countries.features[countryIdxByName],
          alumniData: data[item],
        });
      }
      else{
        console.log(item);
      }

    const maxVal = Math.max(...countriesWithAlumni.map(getVal));
    colorScale.domain([0, maxVal]);
  });

  world.polygonsData(countriesWithAlumni);
  document.querySelector('.title-desc').innerHTML =
    'Hover on a country or territory to see alumni information.';

  // Show total counts
  document.querySelector('#alumni').innerHTML = numberWithCommas(data_count);

  document.querySelector('#chapters').innerHTML = numberWithCommas(chapters_count);

  // Get coordinates
  try {
    const { latitude, longitude } = await getCoordinates();

    world.pointOfView(
      {
        lat: latitude,
        lng: longitude,
      },
      1000
    );
  } catch (e) {
    console.log('Unable to set point of view.');
  }
}

// Responsive globe
window.addEventListener('resize', (event) => {
  world.width([event.target.innerWidth]);
  world.height([event.target.innerHeight]);
});