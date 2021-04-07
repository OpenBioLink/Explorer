'use strict';

let types = {
    user: {
        description:'the details of the user',
        props: {
            name:['string', 'required'],
            age: ['number'],
            email: ['string', 'required'],
            password: ['string', 'required']
        }
    },
    task: {
        description:'a task entered by the user to do at a later time',
        props: {
            userid: ['number', 'required'],
            content: ['string', 'require'],
            expire: ['date', 'required']
        }
    }
}

module.exports = types;