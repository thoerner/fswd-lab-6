'use strict';

require('../setup');

// code to test
var server = require('../../lib/server');

// libraries
var request = require('supertest-as-promised').agent,
    User = require('../../models').User;

describe('/users', function() {
  var agent;

  beforeEach(function() {
    agent = request(server);
  });

  after(function() {
    return User.truncate();
  });

  it('should have a /register page', function() {
    return agent
      .get('/users/register')
      .expect(200);
  });

  it('should create a user', function() {
      agent
          .post('/users/register')
          .type('form')
          .send({
              username: 'test',
              password: 'password'
          }).then(function() {
              return User.findOne({
                      where: {
                          username: 'test'
                      }
                  }).then(function(user) {
                      user.password.should.equal('password');
                  })
          });
  });

  // it('should login', function() {
  //     User.create({
  //         username: 'login',
  //         password: 'password'
  //     }).then(function() {
  //         agent
  //           .post('/users/login')
  //           .type('form')
  //           .send({
  //               username: 'login',
  //               password: 'password'
  //           }).then(function() {
  //               agent.session.username.should.equal('login');
  //           });
  //     });
  // });

  it('should have a /login page', function() {
    return agent
      .get('/users/login')
      .expect(200);
  });

  it('should have a /logout function', function() {
    return agent
      .get('/users/logout')
      .expect(302, 'Found. Redirecting to /');
  })


});
