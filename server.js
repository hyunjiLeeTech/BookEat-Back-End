const express = require("express");

const cors = require("cors");
const mongoose = require("mongoose");
const secret = require("./auth/secret")
require("dotenv").config();

const expressSession = require('express-session');
const passport = require('./auth/passport-config');
const jwt = require('jsonwebtoken')
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(expressSession({
  secret: 'BookEatAwesome',
  resave: false,
  saveUninitialized: false,
}))
app.use(passport.initialize());
app.use(passport.session());


mongoose.set("useUnifiedTopology", true);

const uri = process.env.ATLAS_URI;
mongoose.connect(uri, { useNewUrlParser: true, useCreateIndex: true });

const connection = mongoose.connection;
connection.once("open", () => {
  console.log("MongoDB database connection established successfully");
});

const customersRouter = require("./routes/customers");
const restaurantOwnerRouter = require("./routes/restaurnatOwners");
const cuisineStyleRouter = require("./routes/cuisineStyle");
const priceRangeRouter = require("./routes/priceRange");
const categoryRouter = require("./routes/category");
const accountRouter = require("./routes/account");
const restaurantRouter = require("./routes/restaurant");
const addressRouter = require("./routes/address");

app.use("/customers", customersRouter);
app.use("/restaurant", restaurantRouter);
app.use("/restaurantOwners", restaurantOwnerRouter);
app.use("/cuisineStyle", cuisineStyleRouter);
app.use("/category", categoryRouter);
app.use("/priceRange", priceRangeRouter);
app.use("/account", accountRouter);
app.use("/address", addressRouter);


app.post('/login', function (req, res, next) {
  passport.authenticate('local', { session: false }, function (err, user, info) {
    if (err) { return next(err) }
    if (!user) {
      // *** Display message without using flash option
      // re-render the login form with a message
      return res.json({errcode: 1, message: info.message })
    }
    req.logIn(user, function (err) {
      if (err) { return next(err); }
      console.log("-------req.user-----------");
      console.log(user);
      console.log("-------req.user-----------");
      const token = jwt.sign(user.toJSON(), secret.secret, { expiresIn: 50000000 });
      let returnData = {
        errcode: 0,
        user: user,
        jwt: token,
      };
      res.json(returnData);
    });
  })(req, res, next);
});




// app.post('/login', passport.authenticate('local', {session: false}), function (req, res) {
//   console.log("-------req.user-----------");
//   console.log(req.user);
//   console.log("-------req.user-----------");
//   var user = req.user;

//   const token = jwt.sign(user.toJSON(), secret.secret, {expiresIn: 50000000});
//   let returnData = {
//     errcode: 0,
//     user: req.user,
//     jwt: token,
//   };
//   res.json(returnData);
// });



app.get('/testAuth', passport.authenticate('jwt', { session: false }), function (req, res) {
  res.json({ message: "Logged in" })
  console.log(req.user);
});



app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
