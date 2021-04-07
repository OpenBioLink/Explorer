'use strict';

const axios = require('axios');
const endpoint = "http://localhost:3030/"

async function runSPARQL(dbID, query){
    var url = `${endpoint}${dbID}`
    var response = await axios({
        method: 'post',
        headers: {"Content-type": "application/x-www-form-urlencoded"},
        url: url,
        data: query
    });
    var data = await response.data;
    return data;
}

exports.runSPARQL = runSPARQL;