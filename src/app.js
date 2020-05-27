import Globe from 'globe.gl';
import { request, getCoordinates, numberWithCommas, formatDate } from './utils';
import {
  GLOBE_IMAGE_URL,
  GEOJSON_URL,
} from './constants';
import * as d3 from 'd3';

const populate_items = require('./data_items.json');

// Globe container
const globeContainer = document.getElementById('globeViz');
const colorScale = d3.scaleSequentialPow(d3.interpolateYlOrRd).exponent(1 / 4);
const getVal = (feat) => feat.alumniData.count;

let world;
init();

var modal = document.getElementById("myModal");

var btn = document.getElementById("myBtn");

var span = document.getElementsByClassName("close")[0];

btn.onclick = function() {
	modal.style.display = "block";
	document.getElementsByClassName("header-row")[0].style.display = "none";
	document.getElementsByClassName("total-results")[0].innerText = "";
	let search_entries = document.getElementsByClassName("search-entries")[0];
	while (search_entries.lastElementChild) {
		search_entries.removeChild(search_entries.lastElementChild);
	}
	document.getElementsByClassName("bottom-info-container")[0].style.display = "none";
  search_entries.style.height = "0vh";
}

span.onclick = function() {
  modal.style.display = "none";
  document.getElementsByClassName("bottom-info-container")[0].style.display = "block";
}

window.onclick = function(event) {
	if (event.target == modal) {
		modal.style.display = "none";
		document.getElementsByClassName("bottom-info-container")[0].style.display = "block";
  }
}

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
  populate_dropdowns();
}

async function getCases() {
  let data_count = 0;
  let chapters_count = 0;
  const countries = await request(GEOJSON_URL);
  const data = populate_items.alumni_data;

  const countriesWithAlumni = [];

  const country_names = Object.keys(data);
  country_names.forEach((item) => {
      data_count += data[item].count;
      if(item != "NA"){
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
  document.querySelector('#alumni').innerHTML = numberWithCommas(64293);

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

function populate_dropdowns(){
	let dept = document.getElementById("dept");
	populate_items.dept.forEach((item) => {
		let option = document.createElement("option");
		option.text = item;
		option.value = item;
		dept.appendChild(option);
	})

	let hall = document.getElementById("hall");
	populate_items.halls.forEach((item) => {
		let option = document.createElement("option");
		option.text = item;
		option.value = item;
		hall.appendChild(option);
	})

	let countries = document.getElementById("country");
	populate_items.countries.forEach((item) => {
		let option = document.createElement("option");
		option.text = item;
		option.value = item;
		countries.appendChild(option);
	})
}


document.getElementById ("submit").addEventListener ("click", async function search_filters(event){
  let yog = document.getElementById("batch").value;
  if((yog < "1954" || yog > "2018") && yog != ""){
    alert("Data available only for 1954 - 2018");
    return ;
  }
  event.preventDefault();
  document.getElementById("submit").innerText = "Loading results..";
	document.getElementsByClassName("header-row")[0].style.display = "block";
	let search_entries = document.getElementsByClassName("search-entries")[0];
	while (search_entries.lastElementChild) {
		search_entries.removeChild(search_entries.lastElementChild);
	}
	document.getElementsByClassName("total-results")[0].innerText = "";
	let search_object = {
		"fname" : document.getElementById("fname").value,
		"lname" : document.getElementById("lname").value,
		"year" : document.getElementById("batch").value,
		"dept" : document.getElementById("dept").value,
		"hall" : document.getElementById("hall").value,
		"biz_country" : document.getElementById("country").value,
	};

	let response = await fetch("/search", {
		method: 'POST',
		mode: 'cors',
		body: JSON.stringify(search_object),
		headers: {
		   "Content-type": "application/json; charset=UTF-8"
		}
	});

	let search_data = await response.json();
	console.log(search_data);
	
	search_data.search_entries.forEach((item) => {
		let row = document.createElement("div");
		row.className = "entry-row";
		Object.keys(item).forEach((cols) => {
			let col = document.createElement("div");
			col.className = "table-column";
			if(cols == "name") col.style.width = "200px";
			else if(cols == "location") col.style.width = "250px";
      else if(cols == "degree") col.style.width = "80px";
      else if(cols == "profession") col.style.width = "200px";
      else col.style.width = "40px";
			col.innerText = item[cols];
			row.appendChild(col);
		})
		search_entries.appendChild(row);
	})
	if(search_data.count > 200){
		document.getElementsByClassName("total-results")[0].innerText = "Displaying 200 results out of " + search_data.count;
	}
	else{
		document.getElementsByClassName("total-results")[0].innerText = "Displaying " + search_data.count + " results out of " + search_data.count;
	}
  document.getElementsByClassName("header-row")[0].style.display = "block";
  
  document.getElementById("submit").innerText = "Submit";
	
	search_entries.style.height = "30vh";
});

// Responsive globe
window.addEventListener('resize', (event) => {
  world.width([event.target.innerWidth]);
  world.height([event.target.innerHeight]);
});