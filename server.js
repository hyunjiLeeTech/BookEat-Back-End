const express = require("express");

const cors = require("cors");
const mongoose = require("mongoose");
const secret = require("./auth/secret");
require("dotenv").config();

const expressSession = require("express-session");
const passport = require("./auth/passport-config");
const jwt = require("jsonwebtoken");
const app = express();
const port = process.env.PORT || 5000;

//database models
let Customer = require("./models/customer.model");
let Account = require("./models/account.model");
let RestaurantOwner = require("./models/restaurantOwner.model");
let Restaurant = require("./models/restaurnat.model");
let Address = require("./models/address.model");
let Manager = require("./models/manager.model");

app.use(cors());
app.use(express.json());
app.use(
  expressSession({
    secret: "BookEatAwesome",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

mongoose.set("useUnifiedTopology", true);

const uri = process.env.ATLAS_URI;
mongoose.connect(uri, { useNewUrlParser: true, useCreateIndex: true });

const connection = mongoose.connection;
connection.once("open", () => {
  console.log("MongoDB database connection established successfully");
});

// routers
const customersRouter = require("./routes/customers");
const restaurantOwnerRouter = require("./routes/restaurnatOwners");
const cuisineStyleRouter = require("./routes/cuisineStyle");
const priceRangeRouter = require("./routes/priceRange");
const categoryRouter = require("./routes/category");
const accountRouter = require("./routes/account");
const restaurantRouter = require("./routes/restaurant");
const addressRouter = require("./routes/address");
const managerRouter = require("./routes/manager");
const storeTimeRouter = require("./routes/storeTime");

// app.use
app.use(
  "/customers",
  passport.authenticate("jwt", { session: false }),
  customersRouter
);
app.use(
  "/restaurant",
  // passport.authenticate("jwt", { session: false }), FIXME: DEBUGGING
  restaurantRouter
);
app.use(
  "/restaurantOwners",
  passport.authenticate("jwt", { session: false }),
  restaurantOwnerRouter
);
app.use("/cuisineStyle", cuisineStyleRouter);
app.use("/category", categoryRouter);
app.use("/priceRange", priceRangeRouter);

app.use("/account", accountRouter);
app.use("/address", addressRouter);
app.use("/manager", managerRouter);
app.use("/storeTime", storeTimeRouter);

app.get(
  "/logout",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    var u = req.user;
    if (u) {
      console.log("logging out user: " + u.email);
      u.token = "";
      u.save()
        .then(() => {
          res.json({ errcode: 0, errmsg: "You have been logged out" });
        })
        .catch((err) => {
          res.json({ errcode: 1, errmsg: err });
        });
    }
  }
);

//login
app.post("/login", function (req, res, next) {
  passport.authenticate("local", { session: false }, function (
    err,
    user,
    info
  ) {
    if (err) {
      return next(err);
    }
    if (!user) {
      // *** Display message without using flash option
      // re-render the login form with a message
      return res.json({ errcode: 1, errmsg: info.message });
    }
    req.logIn(user, function (err) {
      if (err) {
        return next(err);
      }
      console.log("-------req.user-----------");
      console.log(user);
      console.log("-------req.user-----------");
      user.token = "";
      const token = jwt.sign(user.toJSON(), secret.secret, {
        expiresIn: "30 days",
      });
      user.token = token;
      user
        .save()
        .then(() => {
          console.log("User: " + user.email + " access token updated");
          user.password = "";
          user.token = "";
          let returnData = {
            errcode: 0,
            user: user,
            jwt: token,
          };
          res.json(returnData);
        })
        .catch((err) => {
          console.log(err);
          next();
        });
    });
  })(req, res, next);
});

// for user signup
let findAccountByEmailAsyc = async function (email) {
  return await Account.find({ email: email });
};

let findCustomerByPhoneNumberAsync = async function (phonenumber) {
  return await Customer.find({ phoneNumber: phonenumber });
};

// for customer signup
let addCustomerAsync = async function (obj) {
  const regExpEmail = RegExp(/^[a-zA-Z0-9]+@[a-zA-Z0-9]+\.[A-Za-z]+$/);

  const regExpPhone = RegExp(
    /^\(?([0-9]{3})\)?[-.●]?([0-9]{3})[-.●]?([0-9]{4})$/
  );

  const firstName = obj.firstName;
  const lastName = obj.lastName;
  const email = obj.email;
  const phoneNumber = obj.phoneNumber;
  const password = obj.password;
  const userTypeId = obj.userTypeId;

  const newAccount = new Account({
    email,
    password,
    userTypeId,
  });

  let message = "";
  if ((await findAccountByEmailAsyc(email)).length > 0) {
    message = "This email is already registered";
    throw message;
  }
  if ((await findCustomerByPhoneNumberAsync(phoneNumber)).length > 0) {
    message = "This phone number is already registered";
    throw message;
  }

  if (firstName.length < 1) {
    message = "First name should have at least one char";
    throw message;
  }
  if (lastName.length < 1) {
    message = "First name should have at least one char";
    throw message;
  }
  if (!regExpEmail.test(email)) {
    message = "Incorrect email format";
    throw message;
  }

  if (!regExpPhone.test(phoneNumber)) {
    message = "Incorrect phone number";
    throw message;
  }
  let account = await newAccount.save();
  const newCustomer = new Customer({
    firstName,
    lastName,
    phoneNumber,
    noShowCount: 0,
    account: account._id,
  });

  return await newCustomer.save();
};

// post request (/customers/add)
app.post("/customersignup", (req, res) => {
  const firstName = req.body.firstname;
  const lastName = req.body.lastname;
  const email = req.body.email;
  const phoneNumber = req.body.phonenumber;
  const password = req.body.password;
  const userTypeId = 1; //customer
  var obj = {
    firstName,
    lastName,
    email,
    phoneNumber,
    password,
    userTypeId,
  };
  addCustomerAsync(obj)
    .then(() => {
      res.json({ errcode: 0, errmsg: "success" });
    })
    .catch((err) => {
      res.json({ errcode: 1, errmsg: err });
    });
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

//restaurant signup
let addRestaurantOwnerAsync = async function (obj) {
  const regExpEmail = RegExp(/^[a-zA-Z0-9]+@[a-zA-Z0-9]+\.[A-Za-z]+$/);

  const regExpPhone = RegExp(
    /^\(?([0-9]{3})\)?[-.●]?([0-9]{3})[-.●]?([0-9]{4})$/
  );

  const regExpPostalCode = RegExp(/^\d{5}-\d{4}|\d{5}|[A-Z]\d[A-Z] \d[A-Z]\d$/);

  const regExpBusinessNum = RegExp(/^[0-9]{9}$/);

  //account
  const userTypeId = 2; // restaurant owner
  const password = obj.password;
  const email = obj.email;

  //restaurantOwner
  // this is for restaurant

  //address
  const province = obj.province;
  const streetNum = obj.streetNumber;
  const streetName = obj.streetName;
  const postalCode = obj.postalCode;
  const city = obj.city;

  //restaurant
  const resName = obj.resName;
  const businessNum = obj.businessNum;
  const phoneNumber = obj.phoneNumber;

  const newAccount = new Account({
    email,
    password,
    userTypeId,
  });

  const newAddress = new Address({
    province,
    streetName,
    streetNum,
    postalCode,
    city,
  });

  let message = "";
  if ((await findAccountByEmailAsyc(email)).length > 0) {
    message = "This email is already registered";
    throw message;
  }

  if (!regExpEmail.test(email)) {
    message = "Incorrect email format";
    throw message;
  }

  if (!regExpPhone.test(phoneNumber)) {
    message = "Incorrect phone number";
    throw message;
  }

  if (!regExpBusinessNum.test(businessNum)) {
    message = "Incorrect business number";
    throw message;
  }

  if (!regExpPostalCode.test(postalCode)) {
    message = "Incorrect postal code";
    throw message;
  }

  if (resName.length < 1) {
    message = "Restaurant name should have at least one char";
    throw message;
  }

  if (streetName.length < 1) {
    message = "Street name should have at least one char";
    throw message;
  }

  if (city.length < 1) {
    message = "City should have at least one char";
    throw message;
  }

  // if (!regExpPassword.test(password)) {
  //   message = "Incorrect password";
  //   throw message;
  // }

  let acnt = await newAccount.save();
  let address = await newAddress.save();

  const newRestaurantOwner = new RestaurantOwner({
    account: acnt._id,
  });

  let restOwner = await newRestaurantOwner.save();

  const newRestaurant = new Restaurant({
    resName,
    phoneNumber,
    businessNum,
    restaurantOwnerId: restOwner._id,
    addressId: address._id,
  });

  return await newRestaurant.save();
};

app.post("/restaurantownersignup", (req, res) => {
  //account
  const userTypeId = 2; // restaurant owner
  const password = req.body.password;
  const email = req.body.email;

  //restaurantOwner
  // this is for restaurant

  //address
  const province = req.body.province;
  const streetNumber = req.body.streetnumber;
  const streetName = req.body.streetname;
  const postalCode = req.body.postalcode;
  const city = req.body.city;

  //restaurant
  const resName = req.body.resname;
  const businessNum = req.body.businessnumber;
  const phoneNumber = req.body.phonenumber;
  var obj = {
    userTypeId,
    password,
    email,
    province,
    streetNumber,
    streetName,
    postalCode,
    city,
    resName,
    businessNum,
    phoneNumber,
  };
  addRestaurantOwnerAsync(obj)
    .then(() => {
      res.json({ errcode: 0, errmsg: "success" });
    })
    .catch((err) => {
      res.json({ errcode: 1, errmsg: err });
    });
});

//manager sign up
let addManagerAsync = async function (obj) {
  //account info
  const email = obj.email;
  const password = obj.password;
  const userTypeId = 3; // manager user type: 3

  //manager info
  const firstname = obj.firstname;
  const lastname = obj.lastname;
  const phonenumber = obj.phonenumber;
  const accountId = obj.accountId;

  const newAccount = new Account({
    email,
    password,
    userTypeId,
  });

  //Validation
  let message = "";
  const regExpEmail = RegExp(/^[a-zA-Z0-9]+@[a-zA-Z0-9]+\.[A-Za-z]+$/);

  const regExpPhone = RegExp(
    /^\(?([0-9]{3})\)?[-.●]?([0-9]{3})[-.●]?([0-9]{4})$/
  );

  if ((await findAccountByEmailAsyc(email)).length > 0) {
    message = "This email is already registered";
    throw message;
  }

  if (!regExpEmail.test(email)) {
    message = "Incorrect email format";
    throw message;
  }

  if (!regExpPhone.test(phonenumber)) {
    message = "Incorrect phone number";
    throw message;
  }

  if (lastname.length < 1) {
    message = "Lastname should have at least one char";
    throw message;
  }

  if (firstname.length < 1) {
    message = "Firstname should have at least one char";
    throw message;
  }

  let account = await newAccount.save();
  let restaurantId = await findRestaurantIdAsync(accountId);

  const newManager = new Manager({
    firstname,
    lastname,
    phonenumber,
    accountId: account._id,
    restaurantId,
  });

  return await newManager.save();
};

app.post("/managersignup", (req, res) => {
  console.log("Accessing /managersignup");

  //account info
  const email = req.body.email;
  const password = req.body.password;

  //manager info
  const firstname = req.body.firstName;
  const lastname = req.body.lastName;
  const phonenumber = req.body.phonenumber;
  const accountId = req.body.accountId;

  obj = {
    email,
    password,
    firstname,
    lastname,
    phonenumber,
    accountId,
  };

  addManagerAsync(obj)
    .then(() => {
      res.json({ errcode: 0, errmsg: "success" });
    })
    .catch((err) => {
      res.json({ errcode: 1, errmsg: err });
    });
});

let findRestaurantIdAsync = async (accountId) => {
  let resOwnerId, resId;
  await RestaurantOwner.findOne({ account: accountId }).then((restOwner) => {
    resOwnerId = restOwner._id;
  });

  await Restaurant.findOne({ restaurantOwnerId: resOwnerId }).then(
    (restaurant) => {
      resId = restaurant._id;
    }
  );

  return resId;
};

app.get(
  "/testAuth",
  passport.authenticate("jwt", { session: false }),
  function (req, res) {
    var u = req.user; //u is this user that in database - always up to date
    res.json({ message: "Logged in" });
    console.log(req.user);
  }
);

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
