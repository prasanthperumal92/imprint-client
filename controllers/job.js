var Job = require('../models/job');
var User = require('../models/users');
var Client = require('../models/clients');
var Log = require('../models/log');
var ObjectId = require('mongoose').Schema.Types.ObjectId;
var moment = require('moment');
var request = require('request');
var config = require('../config.json');

exports.createJob = function(req, res, next) {
	var user = req.user;
	var effort = req.body;

	if (!effort || Object.keys(effort).length === 0) {
		return res.status(400).send({
			message: 'Some Mandatory field is missing'
		});
	}

	if (!effort.clientId) {
		return res.status(400).send({
			message: 'Client Id is missing'
		});
	}

	// if (!effort.effort.coordinates && typeof effort.effort.coordinates !== Array ) {
	//     return res.status(400).send({
	//         message: "Coordinates is missing"
	//     });
	// }

	var url =
		config.maps.url +
		effort.effort.coordinates[0] +
		',' +
		effort.effort.coordinates[1] +
		'&key=' +
		process.env.GOOGLE_API_KEY;
	console.log(url);
	request(url, function(error, response, body) {
		console.log('Mapps Error', error);
		try {
			body = JSON.parse(body);
			console.log(body.status);
			if (body && body.status === 'OK') {
				effort.effort.address = body.results[0].formatted_address.toString();
				effort.effort.address = effort.effort.address.replace('Unnamed Road,', '');
			}
		} catch (e) {
			console.log(e);
		}
		effort.employeeId = user.employee._id;
		effort.name = user.employee.name;
		effort.created = new Date();
		effort = new Job(effort);
		console.log('Add DSR', effort);
		effort.save(function(err) {
			if (err) {
				return res.status(500).send({
					message: 'Error Creating Job'
				});
			} else {
				Client.update(
					{
						_id: effort.clientId
					},
					{
						modified: new Date(),
						lead: effort.effort.lead,
						sales: effort.effort.sales,
						product: effort.effort.product,
						$push: {
							logs: {
								created: new Date(),
								text: 'Created',
								type: 'Aterm',
								by: effort.name
							}
						}
					},
					function(err, result) {
						console.log(err, result);
						Log.addLog({
							userId: user.employee._id,
							clientId: user._id,
							clientName: effort.effort.client,
							text: 'Created an Activity for client ' + effort.effort.client,
							type: 'Aterm',
							by: user.employee.name,
							created: new Date()
						});
						return res.status(201).send();
					}
				);
			}
		});
	});
};

exports.getJobForShare = function(req, res, next) {
	var id = req.params.id;

	if (!id) {
		return res.status(200).send({});
	}

	Job.getJobById(id, function(err, job) {
		if (err) {
			return res.status(200).send({});
		} else {
			return res.status(200).send(job);
		}
	});
};

exports.deleteJob = function(req, res, next) {
	var user = req.user;
	var id = req.params.id;

	if (!id) {
		return res.status(400).send({
			message: 'Please refresh & try again'
		});
	}

	Job.getJobById(id, function(err, job) {
		if (err) {
			return res.status(500).send({
				message: 'Error Deleting the Job'
			});
		} else if (job) {
			Job.deleteJob(id, function(err) {
				if (err) {
					return res.status(500).send({
						message: 'Error Deleting the Job'
					});
				} else {
					Log.addLog({
						userId: user.employee._id,
						clientId: user._id,
						clientName: job.effort.client,
						text: 'Deleted the Activity for client ' + job.effort.client,
						type: 'Aterm',
						by: user.employee.name,
						created: new Date()
					});
					return res.status(200).send();
				}
			});
		} else {
			return res.status(200).send();
		}
	});
};

exports.getEmployeeJobs = function(req, res, next) {
	var user = req.user;
	var id = req.params.id;

	if (!id) {
		return res.status(400).send({
			message: 'Pass the employee Id to get his jobs'
		});
	}

	let start = moment().startOf('day').toDate();
	let end = moment().endOf('day').toDate();
	console.log(id, start, end);

	Job.find(
		{
			employeeId: id,
			created: {
				$gt: start,
				$lt: end
			}
		},
		function(err, jobs) {
			if (err) {
				return res.status(500).send({
					message: 'Error Looking up for Job'
				});
			} else {
				return res.status(200).send(jobs);
			}
		}
	);
};

exports.getJob = function(req, res, next) {
	var user = req.user;
	var id = req.params.id;
	let skip = req.params.skip;

	console.log(id, skip);

	if (id && id !== 'all' && (typeof skip === undefined || skip == '' || skip == null)) {
		Job.getJobById(id, function(err, job) {
			if (err) {
				return res.status(500).send({
					message: 'Error Looking up for Job'
				});
			} else {
				return res.status(200).send(job);
			}
		});
	} else if (id === 'all' && skip) {
		skip = parseInt(skip);
		if (user.type === 'employee') {
			Job.getJobs([ user.employee._id ], skip, function(err, jobs) {
				if (err) {
					return res.status(500).send({
						message: 'Error Looking up for Job'
					});
				} else {
					return res.status(200).send(jobs);
				}
			});
		} else {
			User.findByUserId(user._id, function(err, userProfile) {
				if (err) {
					return res.status(500).send({
						message: 'Error Looking up for Job'
					});
				} else {
					let team = [];
					team.push(user.employee._id);
					for (let i = 0; i < userProfile.employees.length; i++) {
						if (userProfile.employees[i].reportingTo.equals(user.employee._id)) {
							team.indexOf(userProfile.employees[i]._id) === -1
								? team.push(userProfile.employees[i]._id)
								: '';
						}
					}
					if (team.length === 0) {
						return res.status(200).send(team);
					} else {
						Job.getJobs(team, skip, function(err, jobs) {
							console.log(err, jobs);
							if (err) {
								return res.status(500).send({
									message: 'Error Looking up for Job'
								});
							} else {
								return res.status(200).send(jobs);
							}
						});
					}
				}
			});
		}
	} else {
		return res.status(400).send({
			message: 'Pass Job id and skip with the url'
		});
	}
};

exports.getJobs = function(req, res, next) {
	var user = req.user;
	var input = req.body;
	let teams = [];

	if (!input || Object.keys(input).length === 0) {
		return res.status(400).send({
			message: 'Request cannot be null'
		});
	}

	!input.skip ? (input.skip = 0) : '';
	!input.limit ? (input.limit = 20) : '';
	!input.sort ? (input.sort = 'created') : '';

	getMyTeam(user._id, user.employee._id, function(team) {
		teams = team;
		teams.push(user.employee._id);
		let start = new Date(input.fromDate);
		let end = new Date(input.toDate);
		let query = {
			employeeId: {
				$in: teams
			},
			created: {
				$gte: start,
				$lte: end
			}
		};
		if (input.filter) {
			query[input.filter.key] = input.filter.value;
		}
		console.log(query);
		Job.getJobsDynamic(query, input.sort, input.order, input.skip, input.limit, function(err, data) {
			if (err) {
				return res.status(500).send({
					message: 'Error Looking up for Job'
				});
			} else {
				return res.status(200).send(data);
			}
		});
	});
};

function getMyTeam(userId, employeeId, cb) {
	User.findByUserId(userId, function(err, userProfile) {
		let team = [];
		if (err) {
			console.log(err);
			cb(team);
		} else {
			for (let i = 0; i < userProfile.employees.length; i++) {
				if (userProfile.employees[i].reportingTo.equals(employeeId)) {
					team.indexOf(userProfile.employees[i]._id) === -1 ? team.push(userProfile.employees[i]._id) : '';
				}
			}
			cb(team);
		}
	});
}

exports.getFilters = function(req, res, next) {
	var user = req.user;
	Job.getFilters(function(err, jobs) {
		if (err) {
			console.log(err);
			return res.status(500).send({
				message: 'Error Looking up for Job'
			});
		} else {
			return res.status(200).send(jobs[0]);
		}
	});
};
