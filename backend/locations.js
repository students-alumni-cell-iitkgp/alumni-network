/* jshint indent: 1 */

module.exports = function(sequelize, DataTypes) {
	return sequelize.define('locations', {
		id: {
			type: DataTypes.INTEGER(11),
			allowNull: false,
			primaryKey: true
		},
		country: {
			type: DataTypes.TEXT,
			allowNull: true
		},
		long: {
			type: DataTypes.STRING(45),
			allowNull: true
		},
		lat: {
			type: DataTypes.STRING(45),
			allowNull: true
		}
	}, {
		tableName: 'locations',
		timestamps: false
	});
};
