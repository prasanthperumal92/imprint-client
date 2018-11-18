var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var fieldSchema = new Schema({
    label: {
        type: String
    },
    key: {
        type: String
    },
    validation: {
        type: String,
    },
    style: {
        type: String
    },
    textSize: {
        type: String
    },
    type: {
        type: String
    },
    value: {
        type: [String]
    },
    priority: {
        type: Number
    }    
},{
    _id: false
});

var metaSchema = new Schema({
    userId: {
        type: ObjectId,
        required: true        
    },
    created: {
        type: Date,
        required: true,
    },
    modified: {
        type: Date,
        default: Date.now()
    },    
    title: {
        type: String
    },    
    name: {
        type: String,
        required: true,
        unique: true
    },
    active: {
        type: Boolean,
        default: true
    },
    fields: [fieldSchema]
}, {
    collection: 'meta'
});

metaSchema.statics.getMeta = function (id, name, callback) {
    this.findOne({
        userId: id,
        name: name
    }, {
        '_id': 1,
        'title': 1,
        'name': 1,
        'fields.label': 1,
        'fields.validation': 1,
        'fields.style': 1,
        'fields.type': 1,
        'fields.textSize': 1,
        'fields.value': 1,
        'fields.key': 1,
        'fields.priority': 1
    }, callback);
}

metaSchema.statics.create = function (obj, callback) {
    new this(obj).save(callback); 
};

metaSchema.statics.getByUserId = function (id, cb) {
    this.findOne({
        userId: id
    }, cb);
};

metaSchema.methods.toJSON = function () {
    return {
        title: this.title,
        name: this.name,        
        fields: this.fields
    }
};

metaSchema.pre('save', function (next) {
    this.modified = new Date();
    next();
});

module.exports = Meta = mongoose.model("Meta", metaSchema);