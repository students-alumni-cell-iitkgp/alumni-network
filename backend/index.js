const express = require('express');
const path = require('path');
const cors = require('cors');
const {sequelize, data, location} = require('./sequelize');
const PORT = 3030;
const bodyParser = require('body-parser');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.use(express.static(path.join(path.dirname(__dirname), "public")));

app.get('/api', async (req, res) => {
	let countries = await data.findAll({
		group: ["biz_country"],
		attributes: ['biz_country', [sequelize.fn('COUNT', 'id'), 'count']], 
	}).catch((err) => {
		console.log(err);
	});
	let country_data = {};
	for(let temp of countries){
		let num_chapters = await location.findOne({
			attributes: ['chapters'],
			where: {
				'country' : temp['biz_country']
			}
		})
		if(num_chapters != undefined){
			let country = temp['biz_country'];
			country_data[country] = {
				"count" : temp.dataValues.count,
				"chapters" : num_chapters.dataValues.chapters
			}
		}
		else{
			console.log(temp.dataValues.biz_country);
		}
	}
	return res.json(country_data);
});

app.post('/search', async (req, res) => {
	let search_data = req.body;
	if(search_data.fname == "") delete search_data["fname"];
	else{
		search_data.fname = {
			[Op.like]: '%' + search_data.fname + '%',
		}
	}
	if(search_data.lname == "") delete search_data["lname"];
	else{
		search_data.lname = {
			[Op.like]: '%' + search_data.lname + '%',
		}
	}
	if(search_data.hall == "Select Hall of Residence") delete search_data["hall"];
	if(search_data.dept == "Select Department") delete search_data["dept"];
	if(search_data.biz_country == "Select Country") delete search_data["biz_country"];
	if(search_data.year == "") delete search_data["year"];

	// console.log(search_data);
	let values = await data.findAll({
		where : search_data,
	}).catch((err) => {
		console.log(err);
	});
	const value_count = values.length;
	if(value_count > 8){
		values = values.slice(0, 8)
	}

	let search_entries = [];

	values.forEach((temp) => {
		let item = {};
		item["name"] = temp.fname + " " + temp.lname;
		item["yog"] = temp.year;
		item["hall"] = temp.hall;
		item["dept"] = temp.dept;
		item["degree"] = temp.degree;
		item["location"] = temp.biz_city + ", " + temp.biz_province + ", " + temp.biz_country + "-" + temp.biz_zipcode;
		search_entries.push(item);
	})
	search_results = {
		"search_entries" : search_entries,
		"count" : value_count
	}

	return res.json(search_results);
});

app.get('/', (req, res) => {
	res.sendFile(path.join(path.dirname(__dirname), "dist/index.html"));
});

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}!`);
});
