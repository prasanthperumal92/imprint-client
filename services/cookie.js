exports.Authenticate = function (req, res, next) {
    return ensureUser(req, res, next);
}

function ensureUser(req, res, next) {
    var authKey = req.headers.authorization;
    if (!authKey) {
        return res.status(401).send({
            message: "Authentication required"
        });
    }
    req.db.model("User").findEmpAuthKey(authKey, function (err, user) {
        if (err) {
            return res.status(401).send({
                message: "Authentication required"
            });
        }

        if (!user) {
            return res.status(401).send({
                message: "Invalid Authentication token"
            });
        } else {
            req.user = user;
            return next();
        }
    });
}
