var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var clientSchema = new Schema({    
    name: {
        type: String,
        required: true,
        unique: true,
        index: true
    }    
},{
    collection: 'client'
});

module.exports = Client = mongoose.model('Client', clientSchema);