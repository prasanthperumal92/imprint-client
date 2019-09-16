var User = require('../models/users');
var Log = require('../models/log');
const common = require('../helpers/common');
const appConfig = require('../config.json');
const Notifications = require('./notifications');
const _ = require('lodash');
const moment = require('moment');

exports.getProfile = function(req, res, next) {
	var user = req.user;

	User.findById(user._id, function(err, data) {
		if (err) {
			return res.status(400).send({
				message: 'Error looking up User Information'
			});
		} else {
			delete user.registrationId;
			delete user._id;
			delete user.username;
			delete user.active;
			delete user.modified;
			Log.getFewLogs(user.employee._id, function(err, logs) {
				if (err) {
					return res.status(400).send({
						message: 'Error looking up log Information'
					});
				} else {
					user.logs = logs || [];
					return res.status(200).send(user);
				}
			});
		}
	});
};

exports.getPhotos = function(req, res, next) {
	var user = req.user;

	User.findById(user._id, function(err, userData) {
		if (err) {
			return res.status(400).send({
				message: 'Error looking up User Information'
			});
		} else {
			let result = [];
			result.push({
				id: user.employee._id,
				name: user.employee.name,
				photo: user.employee.photo,
				designation: user.employee.designation,
				show: true
			});
			let users = userData.employees;
			console.log('Before', users);
			users = _.filter(users, function(u) {
				return u.phone !== user.employee.phone;
			});
			console.log('After', users);
			if (user.employee.type !== 'employee') {
				for (var i = 0; i < users.length; i++) {
					let obj = {
						id: users[i]._id,
						name: users[i].name,
						photo: users[i].photo,
						designation: users[i].designation
					};
					if (users[i].reportingTo.equals(user.employee._id)) {
						obj.show = true;
					} else {
						obj.show = false;
					}
					result.push(obj);
				}
			} else {
				for (var i = 0; i < users.length; i++) {
					result.push({
						id: users[i]._id,
						name: users[i].name,
						photo: users[i].photo,
						designation: users[i].designation,
						show: false
					});
				}
			}
			console.log('Result', result);
			return res.status(200).send(result);
		}
	});
};

exports.updateEmployee = function(req, res, next) {
	var user = req.user;
	var data = req.body;
	console.log(user);
	if (Object.keys(data).length == 0) {
		return res.status(400).send({
			message: 'Invalid Data'
		});
	}

	if (data.name) {
		if (!common.validateUsername(data.name)) {
			return res.status(400).send({
				message: 'User Name should be between 3 and 64 characters long'
			});
		}
	}

	User.findById(user._id, function(err, employer) {
		if (err) {
			return res.status(400).send({
				message: 'Error looking up User Information'
			});
		} else if (employer) {
			console.log(employer.employees);
			let tmp = _.remove(employer.employees, function(e) {
				return e._id.toString() === user.employee._id;
			});
			console.log(tmp);
			if (data.phone && findEmployee(employer.employees, 'phone', data.phone)) {
				return res.status(409).send({
					message: 'A User already availble with this phone number'
				});
			} else if (data.email && findEmployee(employer.employees, 'email', data.email)) {
				return res.status(409).send({
					message: 'A User already availble with this email address'
				});
			} else if (data.name && findEmployee(user.employees, 'name', data.name)) {
				return res.status(409).send({
					message: 'A User already availble with this name'
				});
			}

			data.modified = new Date();
			let emp = {};
			for (let i in data) {
				if (data.hasOwnProperty(i)) {
					emp['employees.$.' + i] = data[i];
				}
			}

			console.log(emp);

			User.update(
				{
					_id: user._id,
					'employees._id': user.employee._id
				},
				{
					$set: emp
				},
				function(err, updated) {
					console.log(err, updated);
					if (err) {
						return res.status(400).send({
							message: 'Error Changing Password Information'
						});
					} else {
						return res.status(200).send();
					}
				}
			);
		} else {
			return res.status(400).send({
				message: 'Invalid Employer Information'
			});
		}
	});
};

function findEmployee(arr, key, value) {
	return _.find(arr || [], [ key, value ]);
}

exports.changePassword = function(req, res, next) {
	var user = req.user;
	var data = req.body;

	User.lookUpEmployee(user.phone, function(err, employeeData) {
		if (err) {
			return res.status(500).send({
				message: 'Error looking up for User'
			});
		} else if (employeeData) {
			let index = 0;
			// console.log(employeeData);
			for (var i = 0; i < employeeData.employees.length; i++) {
				if (employeeData.employees[i].phone === user.phone) {
					index = i;
				}
			}

			if (!employeeData.employees[index].password(data.old)) {
				// Wrong passwowrd
				return res.status(400).send({
					message: 'Sorry, Old Password is Wrong!!'
				});
			} else {
				var _salt = common.rand(512);
				var _password = common.sha512(data.new + _salt);

				User.update(
					{
						_id: user._id,
						'employees._id': user.employee._id
					},
					{
						$set: {
							'employees.$._salt': _salt,
							'employees.$._password': _password,
							'employees.$.modified': new Date()
						}
					},
					function(err, updated) {
						console.log(err, updated);
						if (err) {
							return res.status(400).send({
								message: 'Error Changing Password!!'
							});
						} else {
							res.status(200).send();
							Log.addLog({
								userId: currentUser._id,
								text: 'Password Changed Successfully',
								type: 'Login',
								by: currentUser.name,
								created: new Date()
							});
						}
					}
				);
			}
		}
	});
};

exports.logout = function(req, res, next) {
	var user = req.user;

	User.update(
		{
			_id: user._id,
			'employees._id': user.employee._id
		},
		{
			$set: {
				'employees.$.modified': new Date()
			}
		},
		function(err, updated) {
			console.log(err, updated);
			if (err) {
				return res.status(400).send({
					message: 'Error Logging out user!!'
				});
			} else {
				res.status(200).send();
				Log.addLog({
					userId: user.employee._id,
					text: 'Logged Out Successfully',
					type: 'Logout',
					by: user.employee.name,
					created: new Date()
				});
			}
		}
	);
};

exports.getLogs = function(req, res, next) {
	var user = req.user;
	var id = req.params.id;

	if (!id) {
		return res.status(400).send({
			message: 'Pass the employee Id!!'
		});
	}

	var start = moment().subtract(7, 'days').startOf('day').toDate();
	var end = moment().endOf('day').toDate();

	console.log(start, end, id);

	Log.find(
		{
			userId: id,
			created: {
				$gte: start,
				$lte: end
			}
		},
		function(err, logs) {
			if (err) {
				return res.status(400).send({
					message: 'Error Looking for logs!!'
				});
			} else {
				return res.status(200).send(logs || []);
			}
		}
	);
};

exports.sendEmailOTP = function(req, res, next) {
	var email = req.params.email;

	if (!email) {
		return res.status(400).send({
			message: 'Invalid Email Address is used!!'
		});
	}

	console.log(email);
	User.find({ 'employees.email': email }, function(err, user) {
		console.log(err, user);
		if (err) {
			return res.status(400).send({
				message: 'Invalid Email Address is used!!'
			});
		} else {
			if (!user || user.length === 0) {
				return res.status(400).send({
					message: 'No User found with this email address!'
				});
			}
			user = user[0];
			let currentUser;
			for (var i = 0; i < user.employees.length; i++) {
				if (user.employees[i].email === email) {
					currentUser = user.employees[i];
				}
			}
			if (!currentUser) {
				return res.status(400).send({
					message: 'No User found with this email address!'
				});
			}

			let otpKey = common.generateOTPKey();

			console.log(currentUser, otpKey);

			User.update(
				{
					_id: user._id,
					'employees._id': currentUser._id
				},
				{
					$set: {
						'employees.$.emailOTP': otpKey
					}
				},
				function(err, updated) {
					console.log(err, updated);
					if (err) {
						return res.status(400).send({
							message: 'Error Updating user!!'
						});
					} else {
						let obj = {
							to: currentUser.email,
							subject: appConfig.appName + ' - Reset Password',
							body:
								'<b>Dear ' +
								currentUser.name +
								', </b> <br> Please use this OTP to reset your forgotten password : ' +
								otpKey +
								'<br> <br> <p> *** This is an automatically generated email, please do not reply to this message *** </p>'
						};

						Notifications.sendMail(obj);

						Log.addLog({
							userId: currentUser._id,
							text: 'Requested For Forgot Password',
							type: 'Login',
							by: currentUser.name,
							created: new Date()
						});
						res.status(200).send({ key: otpKey });
					}
				}
			);
		}
	});
};

exports.updatePassword = function(req, res, next) {
	var data = req.body;

	if (Object.keys(data).length == 0 || !data.password || !data.otp) {
		return res.status(400).send({
			message: 'Invalid Data'
		});
	}

	User.find({ 'employees.email': data.email }, function(err, user) {
		console.log(err, user);
		if (err) {
			return res.status(400).send({
				message: 'Invalid Email Address is used!!'
			});
		} else {
			if (!user || user.length === 0) {
				return res.status(400).send({
					message: 'No User found with this email address!'
				});
			}
			user = user[0];
			let currentUser;
			for (var i = 0; i < user.employees.length; i++) {
				if (user.employees[i].email === data.email) {
					currentUser = user.employees[i];
				}
			}
			if (!currentUser) {
				return res.status(400).send({
					message: 'No User found with this email address!'
				});
			}

			console.log(currentUser);

			if (currentUser.emailOTP !== data.otp) {
				return res.status(400).send({
					message: 'OTP entered is Wrong!'
				});
			}

			var _salt = common.rand(512);
			var _password = common.sha512(data.password + _salt);

			User.update(
				{
					_id: user._id,
					'employees._id': currentUser._id
				},
				{
					$set: {
						'employees.$._salt': _salt,
						'employees.$._password': _password,
						'employees.$.modified': new Date()
					}
				},
				function(err, updated) {
					console.log(err, updated);
					if (err) {
						return res.status(400).send({
							message: 'Error Changing Password!!'
						});
					} else {
						res.status(200).send();
						Log.addLog({
							userId: currentUser._id,
							text: 'Password Reset is Done Successfully',
							type: 'Login',
							by: currentUser.name,
							created: new Date()
						});
					}
				}
			);
		}
	});
};
