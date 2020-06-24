/**
 * /core/passport-config.js
 */
const passport = require('passport');
const LocalStrategy = require ("passport-local");
const JwtStrategy = require('passport-jwt').Strategy,
    ExtractJwt = require('passport-jwt').ExtractJwt;
const jwt = require('jsonwebtoken');
const secret = require('./secret');

var opts = {}
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = secret.secret;

const Account = require("../models/account.model")

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


passport.use(new JwtStrategy(opts, function(jwt_payload, done) {
    Account.findOne({ _id: jwt_payload._id }, function (err, result) {
        if (err) {
            console.log(err);
            return done(err);
        }
        if (!result || result === null) {
            console.log("user not found");
            return done(null, false, { message: 'user not found.' });
        }
        console.log("jwt auth done")
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

passport.authenticateMiddleware = function authenticationMiddleware() {
    return function (req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        }
        console.log("Authenticate failed");
        res.redirect('/login');
    }
};

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