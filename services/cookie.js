exports.Authenticate = function(req, res, next) {
	return ensureUser(req, res, next);
};

function ensureUser(req, res, next) {
	var authKey = req.headers.authorization;
	if (!authKey) {
		return res.status(401).send({
			message: 'Authentication required'
		});
	}
	req.db.model('User').findEmpAuthKey(authKey, function(err, user) {
		if (err) {
			return res.status(401).send({
				message: 'Authentication required'
			});
		}

		if (!user) {
			return res.status(401).send({
				message: 'Invalid Authentication token'
			});
		} else {
			req.user = JSON.parse(JSON.stringify(user));
			console.log(user);
			req.db.model('Config').findByUserId(user._id, function(err, configs) {
				console.log(configs);
				let details = {},
					leads = {},
					sales = {},
					products = {};
				if (configs) {
					for (let i = 0; i < configs.details.length; i++) {
						details[configs.details[i].key] = configs.details[i].value;
					}
					for (let i = 0; i < configs.lead.length; i++) {
						leads[configs.lead[i].key] = configs.lead[i].value;
					}
					for (let i = 0; i < configs.sales.length; i++) {
						sales[configs.sales[i].key] = configs.sales[i].value;
					}
					for (let i = 0; i < configs.product.length; i++) {
						products[configs.product[i].key] = configs.product[i].value;
					}
				}
				req.configs = {
					details: details,
					leads: leads,
					sales: sales,
					products: products
				};
				console.log(req.configs);
				return next();
			});
		}
	});
}
