exports.configs = {
    dsr: {
        "id": "dsr",
        "image": "https://image.ibb.co/kFOcvL/small-notes.png",
        "name": "DSR",
        "api": "https://imp-cli.herokuapp.com/api/v1/job/dsr"
    },
    tracking: {
        "id": "tracking",
        "image": "https://image.ibb.co/kFOcvL/small-notes.png",
        "name": "Tracking",
        "api": "https://imp-cli.herokuapp.com/api/v1/tracking"
    }
};

exports.leads = [{
        "key": "Aterm",
        "value": "Hot"
    },
    {
        "key": "Bterm",
        "value": "Warm"
    },
    {
        "key": "Cterm",
        "value": "Cold"
    }
];

exports.sales = [{
        "key": "Aterm",
        "value": "Introduction"
    },
    {
        "key": "Bterm",
        "value": "Proposal"
    },
    {
        "key": "Cterm",
        "value": "Followup"
    }
];

exports.products = [{
        "key": "Aterm",
        "value": "Smart Class"
    },
    {
        "key": "Bterm",
        "value": "Smart Board"
    },
    {
        "key": "Cterm",
        "value": "ERP"
    }
];

exports.meta = {
    "title": "Report Form",
    "name": "dsr",
    "fields": [{
            "value": [],
            "type": "textfield",
            "textSize": "25",
            "style": "singleline_name",
            "label": "Client Name",
            "validation": "true",
            "key": "client",
            "priority": 1
        },
        {
            "value": [],
            "type": "textfield",
            "textSize": "25",
            "style": "singleline",
            "validation": "true",
            "label": "Contact Person",            
            "key": "person",
            "priority": 4
        },
        {
            "value": [],
            "type": "textfield",
            "textSize": "25",
            "style": "singleline_number_limit_10pts",
            "validation": "true",
            "label": "Contact Number",            
            "key": "contact",
            "priority": 5
        },
        {
            "value": [],
            "type": "checkbox",
            "textSize": "25",
            "style": "",
            "validation": "true",
            "label": "Activity",            
            "key": "sales",
            "priority": 2
        },
        {
            "value": [],
            "type": "checkbox",
            "textSize": "25",
            "style": "",
            "validation": "true",
            "label": "Lead Status",
            "key": "leads",
            "priority": 3
        },
        {
            "value": [],
            "type": "textfield",
            "textSize": "25",
            "style": "singleline",
            "label": "Remarks",
            "validation": "false",
            "key": "remarks",
            "priority": 9
        },
        {
            "value": [],
            "type": "date",
            "textSize": "25",
            "style": "singleline",
            "validation": "true",
            "label": "Next FollowUp",            
            "key": "followup",
            "priority": 6
        },
        {
            "value": [],
            "type": "location",
            "textSize": "25",
            "style": "",
            "label": "Co-ordinates",
            "validation": "false",
            "key": "coordinates",
            "priority": 7
        },
        {
            "value": [],
            "type": "location",
            "textSize": "25",
            "style": "",
            "label": "Address",
            "validation": "false",
            "key": "address",
            "priority": 8
        },
        {
            "value": [],
            "type": "camera",
            "textSize": "25",
            "style": "",
            "label": "Photo",
            "validation": "false",
            "key": "photo",
            "priority": 10
        },
        {
            "value": [],
            "type": "signature",
            "textSize": "25",
            "style": "",
            "label": "Customer signature",
            "validation": "false",
            "key": "signature",
            "priority": 11
        }
    ]
}