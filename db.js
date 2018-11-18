var
    fs = require('fs'),
    mongoose = require('mongoose'),
    models_path = __dirname + '/models',
    mongoURI = process.env.MONGODB_URI || "mongodb://localhost:27017/imprint";

/**
 * db.js
 * All database utilities
 */

exports.connect = function (callback) {    
    mongoose.connect(mongoURI, {
        useNewUrlParser: true
    }).then(function(db){        
         console.log("MongoDB:Connected.", mongoURI);
         callback(null, db)
    }, function(err){
        console.error("MongoDB: Connection error.", err);
        callback(err, null);
    }).catch(function(err){
         console.error("MongoDB: Connection error.", err);
         callback(err, null);
    });    
};

exports.init = function (callback) {        
    console.log("Initializing database.");

    fs.readdirSync(models_path).forEach(function (file) {
        require(models_path + '/' + file);
    });
    callback(null);
};