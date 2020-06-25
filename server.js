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
let Customer = require("./models/customer.model");
let Account = require("./models/account.model");


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


let findAccountByEmailAsyc = async function(email){
  return await Account.find({email: email});
}

let findCustomerByPhoneNumberAsync = async function(phonenumber){
  return await Customer.find({phoneNumber: phonenumber});
}

let addCustomerAsync = async function(obj){
  const regExpEmail = RegExp(
    /^[a-zA-Z0-9]+@[a-zA-Z0-9]+\.[A-Za-z]+$/
  );
  
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
  if((await findAccountByEmailAsyc(email)).length > 0 ){
    message = "This email is already registered"
    throw message;
  }
  if((await findCustomerByPhoneNumberAsync(phoneNumber)).length > 0 ){
    message = "This phone number is already registered"
    throw message;
  }

  if(firstName.length < 1){
    message = "First name should have at least one char"
    throw message;

  }
  if(lastName.length < 1){
    message = "First name should have at least one char"
    throw message;

  }
  if(!regExpEmail.test(email)){
    message = "Incorrect email format"
    throw message;

  }

  if(!regExpPhone.test(phoneNumber)){
    message = "Incorrect phone number"
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
}























const customersRouter = require("./routes/customers");
const restaurantOwnerRouter = require("./routes/restaurnatOwners");
const cuisineStyleRouter = require("./routes/cuisineStyle");
const priceRangeRouter = require("./routes/priceRange");
const categoryRouter = require("./routes/category");
const accountRouter = require("./routes/account");
const restaurantRouter = require("./routes/restaurant");
const addressRouter = require("./routes/address");

app.use(
  "/customers",
  passport.authenticate("jwt", { session: false }), customersRouter
);
app.use("/restaurant", restaurantRouter);
app.use("/restaurantOwners", restaurantOwnerRouter);
app.use("/cuisineStyle", cuisineStyleRouter);
app.use("/category", categoryRouter);
app.use("/priceRange", priceRangeRouter);


app.use("/account", accountRouter);
app.use("/address", addressRouter);

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
      const token = jwt.sign(user.toJSON(), secret.secret, {
        expiresIn: 50000000,
      });
      let returnData = {
        errcode: 0,
        user: user,
        jwt: token,
      };
      res.json(returnData);
    });
  })(req, res, next);
});



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
  }
  addCustomerAsync(obj).then(()=>{
    res.json({errcode: 0, errmsg: "success"})
  }).catch(err =>{
    res.json({errcode: 1, errmsg: err});
  })
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
