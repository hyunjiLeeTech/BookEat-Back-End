/**
 * /core/passport-config.js
 */
const passport = require('passport');
const LocalStrategy = require ("passport-local");

const passport_jwt = require('passport-jwt');

const JwtStrategy = passport_jwt.Strategy,
    ExtractJwt = passport_jwt.ExtractJwt;
const jwt = require('jsonwebtoken');
const secret = require('./secret');


var opts = {}
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = secret.secret;
opts.passReqToCallback = true;

const Account = require("../models/account.model");
const { request } = require('express');

// import passport from 'passport';
// import LocalStrategy from 'passport-local';

// // Account utils.
// import Account from '../models/account.model';
// import Customer from '../models/customer.model';
// import Restaurant from '../models/restaurantOwner.model';




passport.use(new LocalStrategy(
    {
        usernameField: 'email',
        passwordField: 'password',
    },
    /**
     * @param email email as username
     * @param password password that user entered
     * @param done call back
     */
    function (email, password, done) {
        Account.findOne({ email: email }, function (err, result) {
            if (err) {
                console.log(err);
                return done(err);
            }

            if (!result || result === null) {
                console.log("user not found");
                return done(null, false, { message: 'user not found.' });
            }

            if (result.emailVerified === false) {
                console.log(result.emailVerified)
                console.log("Not verified email address");
                return done(null, false, { message: 'Please Verify the email first. ' });
            }

            if (result.isActive === false) {
                console.log(result.isActive)
                console.log("Inactived account");
                return done(null, false, { message: 'account inactived. the account may be deleted' });
            }


            if (result.password != password) {
                console.log("incorrect password.")
                console.log("Account: " + result);
                console.log("Recieved password: " + password);
                return done(null, false, { message: 'Password not match' });
            }
            return done(null, result);
        })
    }
));


passport.use(new JwtStrategy(opts, function(req, jwt_payload, done) {
    let requestToken = null;
    try{
        requestToken = req.headers['x-access-token'];
    }catch(err){
        return done(err) 
    }
    if(requestToken === '') return done(null, false, {message: 'illegal token'});
    Account.findOne({ _id: jwt_payload._id }, function (err, result) {
        if (err) {
            console.log(err);
            return done(err);
        }
        if (!result || result === null) {
            console.log("user not found");
            return done(null, false, { message: 'user not found.' });
        }
        if(requestToken !== result.token){
            console.log("Invalid access token for user: " + result.email)
            console.log("Request token: " + requestToken)
            console.log("Expected token(in db): " + result.token);
            return done(null, false, { message: "invalied access token."});
        }
        if (result.isActive === false) {
            console.log(result.isActive)
            console.log("Inactived account");
            return done(null, false, { message: 'account inactived. the account may be deleted' });
        }
        if(result.token === ''){
            return done(null, false, {message: 'illegal token'});
        }
        console.log("User: " + result.email + " vaildated by JWT stragtegy")
        return done(null, result);
    })
}));


passport.serializeUser(function (account, done) {
    done(null, account.email);
});


passport.deserializeUser(function (email, done) {
    Account.findOne({ email: email }, function (err, result) {
        if (err) {
            return done(err);
        }
        done(null, result);
    });
});

//Have not finished, Do not use 
passport.authenticateMiddleware = function authenticationMiddleware() {
    return function (req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        }
        console.log("Authenticate failed");
        res.redirect('/login');
    }
};

//Have not finished, do not use
passport.authenticateMiddlewareJwt = function authenticationMiddleware() {
    return function (req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        }
        console.log("Authenticate failed");
        res.redirect('/login');
    }
};

module.exports = passport;