require('dotenv').load();

var Promise = require('es6-promise').Promise,
    request = require('superagent'),
    md5     = require('md5');

var API_URL  = '.api.mailchimp.com/3.0/lists/',
    DATACENTER  = process.env.DATACENTER,
    API_KEY  = process.env.API_KEY,
    LIST_ID  = process.env.LIST_ID,
    USERNAME = process.env.USERNAME,
    INTERESTS = INTERESTS = {"99510ae354": true },
    STATUS   = process.env.STATUS;

function urlForList() {
  return 'https://' + DATACENTER + API_URL + LIST_ID + '/members/';
}

function urlForUser(emailAddress) {
  return urlForList() + md5(emailAddress);
}

function updateSubscription(emailAddress) {
  return new Promise(function(resolve, reject) {
    request.patch(urlForUser(emailAddress))
      .auth(USERNAME, API_KEY)
      .send({ status: STATUS, interests: INTERESTS })
      .end(function(err, res) {
        if (err) {
          console.log('ERROR', err);
          reject({ status: err.status, message: err.response.text });
        } else {
          resolve(res.body);
        }
      });
  });
}

function createSubscription(emailAddress) {
  return new Promise(function(resolve, reject) {
    request.post(urlForList())
      .auth(USERNAME, API_KEY)
      .send({ email_address: emailAddress, interests: INTERESTS, status: STATUS })
      .end(function(err, res) {
        if (err) {
          console.log('ERROR', err);
          reject({ status: err.status, message: err.response.text });
        } else {
          resolve(res.body);
        }
      });
  });
}

exports.handler = function(event, context) {
  var emailAddress = event.email;
  function create() {
    createSubscription(emailAddress)
      .then(function(responseBody) {
        context.succeed(responseBody);
      })
      .catch(function(err) {
        context.fail(new Error(err));
      });
  }

  updateSubscription(emailAddress)
    .then(function(responseBody) {
      context.succeed(responseBody);
    })
    .catch(function(err) {
      if (err.status === 404) {
        create();
      }
    });
};
