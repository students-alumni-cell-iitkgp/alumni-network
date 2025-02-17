import Globe from 'globe.gl';
import { request, getCoordinates, numberWithCommas, formatDate } from './utils';
import {
  GLOBE_IMAGE_URL,
  GEOJSON_URL,
  FETCH_API
} from './constants';
import * as d3 from 'd3';

const populate_items = require('./data_items.json');

// Globe container
const globeContainer = document.getElementById('globeViz');
const colorScale = d3.scaleSequentialPow(d3.interpolateYlOrRd).exponent(1 / 4);
const getVal = (feat) => feat.alumniData.biz_count;

let world;
init();

let modal = document.getElementById("myModal");

let modal1 = document.getElementById("chapterModal");

let btn = document.getElementById("myBtn");

let btn1 = document.getElementById("chapters_modal");

let span = document.getElementsByClassName("close")[0];

let span1 = document.getElementsByClassName("close")[1];

btn.onclick = function() {
	modal.style.display = "block";
	document.getElementsByClassName("total-results")[0].innerText = "";
	let search_entries = document.getElementsByClassName("search-entries")[0];
	while (search_entries.lastElementChild) {
		search_entries.removeChild(search_entries.lastElementChild);
	}
	document.getElementsByClassName("bottom-info-container")[0].style.display = "none";
  search_entries.style.height = "0vh";
}

btn1.onclick = function() {
	modal1.style.display = "block";
	document.getElementsByClassName("bottom-info-container")[0].style.display = "none";
}

span.onclick = function() {
  modal.style.display = "none";
  document.getElementsByClassName("bottom-info-container")[0].style.display = "block";
}

span1.onclick = function() {
  modal1.style.display = "none";
  document.getElementsByClassName("bottom-info-container")[0].style.display = "block";
}

window.onclick = function(event) {
	if (event.target == modal) {
		modal.style.display = "none";
		document.getElementsByClassName("bottom-info-container")[0].style.display = "block";
  }
  if (event.target == modal1) {
		modal1.style.display = "none";
		document.getElementsByClassName("bottom-info-container")[0].style.display = "block";
  }
}


function init() {
  world = Globe()(globeContainer)
  .globeImageUrl(GLOBE_IMAGE_URL)
  .showGraticules(true)
  .polygonAltitude(0.05)
  .polygonCapColor((feat) => colorScale(getVal(feat)))
  .polygonSideColor(() => 'rgba(0, 100, 0, 0.05)')
  .polygonStrokeColor(() => '#111')
  .polygonLabel(
	({ properties: d, alumniData: c }) => 
	`
    <div class="card">
    <img class="card-img" src="${"https://disease.sh/assets/img/flags/" + d["ISO_A2"].toLowerCase() + ".png"}" alt="flag" />
    <div class="container">
    <span class="card-title"><b>${d.ADMIN}</b></span> <br />
    <span class="card-total-cases">${numberWithCommas(c.home_count)} Resident | ${numberWithCommas(c.biz_count)} Working Alumni</span>
    <div class="card-spacer"></div>
    <hr />
    <div class="card-spacer"></div>
    <span>${numberWithCommas(c.chapters)} chapters</span> <br />
    <div class="card-spacer"></div>
    <hr/>
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


  world.width([window.innerWidth]);
  world.height([window.innerHeight]);
  window.addEventListener('resize', () => {
    world.width([window.innerWidth]);
    world.height([window.innerHeight]);
  });
      
  getCases();
  populate_dropdowns();
  document.getElementsByClassName("title-desc")[0].innerText = "Hover on any country to find number of alumni and chapters, or search for individuals"
}

async function getCases() {
  let data_count = 0;
  let chapters_count = 0;
  const countries = await request(GEOJSON_URL);
  const data = populate_items.alumni_data;

  const countriesWithAlumni = [];

  const country_names = Object.keys(data);
  country_names.forEach((item) => {
      data_count += data[item].biz_count;
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
        // console.log(item);
      }

    const maxVal = Math.max(...countriesWithAlumni.map(getVal));
    colorScale.domain([0, maxVal]);
  });

  world.polygonsData(countriesWithAlumni);
  // document.querySelector('.title-desc').innerText =
  //   'Hover on a country or territory to see alumni information.';

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

	let response = await fetch(FETCH_API, {
		method: 'POST',
		mode: 'cors',
		body: JSON.stringify(search_object),
		headers: {
		   "Content-type": "application/json; charset=UTF-8"
		}
	});

	// console.log(search_data);
  
  let hrow = document.createElement("tr");
  hrow.className = "header-row";
  const headers = ["Name", "YOG", "Hall", "Dept", "Degree", "Designation", "Business Location"]; 

  headers.forEach((cols) => {
    let col = document.createElement("th");
    if(cols == "Name") col.width = "200px";
    else if(cols == "Business Location") col.width = "300px";
    else if(cols == "Degree") col.width = "100px";
    else if(cols == "Designation") col.width = "250px";
    else col.width = "100px";
    col.innerText = cols;
    hrow.appendChild(col);
  })
	search_entries.appendChild(hrow);
  
  let search_data = await response.json();

	search_data.search_entries.forEach((item) => {
		let row = document.createElement("tr");
		row.className = "entry-row";
		Object.keys(item).forEach((cols) => {
			let col = document.createElement("td");
			if(cols == "name") col.width = "200px";
			else if(cols == "location") col.width = "300px";
      else if(cols == "degree") col.width = "100px";
      else if(cols == "profession") col.width = "250px";
      else col.width = "100px";
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
  
  document.getElementById("submit").innerText = "Submit";
	
	search_entries.style.height = "30vh";
});

document.getElementById("India").addEventListener("click", function () {
  document.querySelector('#india').scrollIntoView({behavior: 'smooth'});
});

document.getElementById("USA").addEventListener("click", function () {
  document.querySelector('#usa').scrollIntoView({behavior: 'smooth'});
});