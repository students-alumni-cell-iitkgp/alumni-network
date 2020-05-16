const express = require('express');
const apicache = require('apicache');
const cors = require('cors');
const cache = apicache.middleware;
const {sequelize, data, location} = require('./sequelize');
const { QueryTypes } = require('sequelize');
const PORT = 3030;

const app = express();
app.use(cors());
app.use(cache('1 hour'));

app.get('/country', async (req, res) => {
	let alumni = await data.findAll({
		group: ["biz_country"],
		attributes: ['biz_country', [sequelize.fn('COUNT', 'id'), 'count']], 
	}).catch((err) => {
		console.log(err);
	});
	res.send(alumni);
});

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}!`);
});
