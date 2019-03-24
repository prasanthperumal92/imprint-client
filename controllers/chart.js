var Team = require('../models/team');
var User = require('../models/users');
var Job = require('../models/job');
var Task = require('../models/task');
var Client = require('../models/clients');
var Config = require('../models/config');
var async = require('async');
var _ = require('lodash');
var moment = require('moment');

exports.getTypeStatus = function(req, res, next) {
	var user = req.user;
	var type = req.params.type;
	var start = req.params.start;
	var end = req.params.end;
	var employeeId = req.params.employee;
	let query = {};
	let project = {
		status: true,
		activity: true,
		product: true
	};

	if (!start || !end || !type) {
		return res.status(400).send({
			message: 'Please check the values passed, Some values are missing!'
		});
	}

	Config.find({
		userId: user._id
	})
		.lean()
		.exec(function(err, configList) {
			if (err) {
				console.log(err);
				return res.status(500).send({
					message: 'Server is busy, Please try again!'
				});
			}

			if (configList.length > 0) {
				configList = configList[0];
			} else {
				configList = {};
			}

			let typeList = configList[type],
				key;
			if (type === 'lead') {
				key = 'status';
			} else if (type === 'sales') {
				key = 'activity';
			} else if (type === 'product') {
				key = 'product';
			} else {
				return res.status(400).send({
					message: 'Unknown type passed!!'
				});
			}

			if (user.employee.type === 'employee') {
				query = {
					assignedTo: employeeId || user.employee._id,
					modified: {
						$gte: moment(start).startOf('day').toISOString(),
						$lte: moment(end).endOf('day').toISOString()
					}
				};
				Client.find(query, project, function(err, data) {
					if (err) {
						console.log(err);
						return res.status(500).send({
							message: 'Server is busy, Please try again!'
						});
					} else {
						console.log(data, key, typeList);
						let result = getFilteredData(data, key, typeList);
						return res.status(200).send(result);
					}
				});
			} else {
				if (employeeId && employeeId !== 'all') {
					query = {
						assignedTo: employeeId || user.employee._id,
						modified: {
							$gte: moment(start).startOf('day').toISOString(),
							$lte: moment(end).endOf('day').toISOString()
						}
					};
					Client.find(query, project, function(err, data) {
						if (err) {
							console.log(err);
							return res.status(500).send({
								message: 'Server is busy, Please try again!'
							});
						} else {
							console.log(data, key, typeList);
							let result = getFilteredData(data, key, typeList);
							return res.status(200).send(result);
						}
					});
				} else {
					getMyEmployees(user, function(err, emps) {
						if (err) {
							console.log(err);
							return res.status(500).send({
								message: 'Server is busy, Please try again!'
							});
						} else {
							query = {
								assignedTo: {
									$in: emps
								},
								modified: {
									$gte: moment(start).startOf('day').toISOString(),
									$lte: moment(end).endOf('day').toISOString()
								}
							};
							Client.find(query, project, function(err, data) {
								if (err) {
									console.log(err);
									return res.status(500).send({
										message: 'Server is busy, Please try again!'
									});
								} else {
									console.log(data, key, typeList);
									let result = getFilteredData(data, key, typeList);
									return res.status(200).send(result);
								}
							});
						}
					});
				}
			}
		});
};

function getFilteredData(arr, key, list) {
	let obj = {},
		result = [];
	for (let i = 0; i < list.length; i++) {
		obj[list[i]['key']] = 0;
		for (let j = 0; j < arr.length; j++) {
			let item = arr[j];
			if (list[i]['key'] === item[key]) {
				obj[list[i]['key']]++;
			}
		}
		result.push({
			key: list[i]['key'],
			value: obj[list[i]['key']]
		});
	}
	return result;
}

exports.getTableData = function(req, res, next) {
	var user = req.user;
	var type = req.params.type;
	var start = req.params.start;
	var end = req.params.end;
	var status = req.params.term;
	let query = {};

	if (!start || !end || !type || !status) {
		return res.status(400).send({
			message: 'Please check the values passed, Some values are missing!'
		});
	}

	let project = {
		name: true,
		clientId: true,
		status: true,
		address: true,
		city: true,
		state: true,
		person: true,
		assignedTo: true,
		createdBy: true
	};

	Config.find({
		userId: user._id
	})
		.lean()
		.exec(function(err, configList) {
			if (err) {
				console.log(err);
				return res.status(500).send({
					message: 'Server is busy, Please try again!'
				});
			} else {
				let key;
				if (type === 'lead') {
					key = 'status';
				} else if (type === 'sales') {
					key = 'activity';
				} else if (type === 'product') {
					key = 'product';
				} else {
					return res.status(400).send({
						message: 'Unknown type passed!!'
					});
				}

				if (configList.length > 0) {
					configList = configList[0];
				} else {
					configList = {};
				}
				let typeList = configList[type];
				if (user.employee.type === 'manager') {
					getMyEmployees(user, function(err, emps) {
						if (err) {
							console.log(err);
							return res.status(500).send({
								message: 'Server is busy, Please try again!'
							});
						} else {
							query = {
								modified: {
									$gte: moment(start).startOf('day').toISOString(),
									$lte: moment(end).endOf('day').toISOString()
								},
								[key]: status,
								assignedTo: {
									$in: emps
								}
							};

							console.log(JSON.stringify(query));
							Client.find(query, project, function(err, clients) {
								if (err) {
									console.log(err);
									return res.status(500).send({
										message: 'Server is busy, Please try again!'
									});
								} else {
									return res.status(200).send(clients);
								}
							});
						}
					});
				} else {
					query = {
						modified: {
							$gte: moment(start).startOf('day').toISOString(),
							$lte: moment(end).endOf('day').toISOString()
						},
						[key]: status,
						assignedTo: user.employee._id
					};

					console.log(query);
					Client.find(query, project, function(err, clients) {
						if (err) {
							console.log(err);
							return res.status(500).send({
								message: 'Server is busy, Please try again!'
							});
						} else {
							return res.status(200).send(clients);
						}
					});
				}
			}
		});
};

exports.getDataDownload = function(req, res, next) {
	var user = req.user;
	var start = req.params.start;
	var end = req.params.end;
	var employeeId = req.params.employee;
	let query = {};

	if (!start || !end || !employeeId) {
		return res.status(400).send({
			message: 'Please check the values passed, Some values are missing!'
		});
	}

	let project = {
		name: true,
		person: true,
		designation: true,
		mail: true,
		description: true,
		person2: true,
		address: true,
		city: true,
		status: true,
		activity: true,
		product: true,
		state: true,
		contact: true,
		contact2: true,
		assignedTo: true,
		clientId: true,
		createdBy: true,
		created: true,
		modified: true
	};

	if (employeeId && employeeId !== 'all') {
		query = {
			job: {
				created: {
					$gte: moment(start).startOf('day').toISOString(),
					$lte: moment(end).endOf('day').toISOString()
				},
				employeeId: employeeId
			},
			client: {
				modified: {
					$gte: moment(start).startOf('day').toISOString(),
					$lte: moment(end).endOf('day').toISOString()
				},
				assignedTo: employeeId
			}
		};

		async.parallel(
			{
				job: function(callback) {
					Job.find(query.job, function(err, jobs) {
						if (err) {
							console.log(err);
							jobs = [];
						}
						let temp = JSON.parse(JSON.stringify(jobs));
						jobs = flattenJob(temp);
						callback(null, jobs);
					});
				},
				client: function(callback) {
					Client.find(query.client, project, function(err, clients) {
						if (err) {
							console.log(err);
							clients = [];
						}
						callback(null, clients);
					});
				}
			},
			function(err, results) {
				console.log(results);
				return res.status(200).send(results);
			}
		);
	} else if (employeeId === 'all') {
		getMyEmployees(user, function(err, emps) {
			if (err) {
				console.log(err);
				return res.status(500).send({
					message: 'Server is busy, Please try again!'
				});
			} else {
				query = {
					job: {
						created: {
							$gte: moment(start).startOf('day').toISOString(),
							$lte: moment(end).endOf('day').toISOString()
						},
						employeeId: {
							$in: emps
						}
					},
					client: {
						modified: {
							$gte: moment(start).startOf('day').toISOString(),
							$lte: moment(end).endOf('day').toISOString()
						},
						assignedTo: {
							$in: emps
						}
					}
				};

				async.parallel(
					{
						job: function(callback) {
							Job.find(query.job, function(err, jobs) {
								if (err) {
									console.log(err);
									jobs = [];
								}
								let temp = JSON.parse(JSON.stringify(jobs));
								jobs = flattenJob(temp);
								callback(null, jobs);
							});
						},
						client: function(callback) {
							Client.find(query.client, project, function(err, clients) {
								if (err) {
									console.log(err);
									clients = [];
								}
								callback(null, clients);
							});
						}
					},
					function(err, results) {
						console.log(results);
						return res.status(200).send(results);
					}
				);
			}
		});
	} else {
		return res.status(200).send({
			job: [],
			client: []
		});
	}
};

function getMyEmployees(user, cb) {
	let query = {};
	User.findById(user._id, function(err, userData) {
		if (err) {
			console.log(err);
			cb(err, []);
		} else {
			let emps = [];
			emps.push(user.employee._id);
			var employee = userData.toJSON();
			for (var i = 0; i < userData.employees.length; i++) {
				if (userData.employees[i].reportingTo.equals(user.employee._id)) {
					emps.push(userData.employees[i]._id);
				}
			}
			cb(null, emps);
		}
	});
}

function flattenJob(arr) {
	let data = [];
	for (let i = 0; i < arr.length; i++) {
		let item = arr[i];
		let tmp = item.effort;
		for (let key in tmp) {
			item[key] = tmp[key];
		}
		item.effort = undefined;
		data.push(item);
	}
	return data;
}
