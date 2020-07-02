const router = require("express").Router();
let Customer = require("../models/customer.model");
let Account = require("../models/account.model");
const Reservation = require("../models/reservation.model");
const moment = require('moment')
let findAccountByEmailAsyc = async function (email) {
  return await Account.find({ email: email });
};

let findCustomerByPhoneNumberAsync = async function (phonenumber) {
  return await Customer.find({ phoneNumber: phonenumber });
};

let findCustomerByAccount = async function(acc){
  return await Customer.findOne({account: acc})
}

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

router.route("/reservationsofpast60days").get(async (req, res)=>{
  var u = req.user;
  //console.log(u);
  try{
    var reservations = await Reservation.find({customer: await findCustomerByAccount(u)});
    res.json({errcode: 0, reservations: reservations})
  }catch(err){
    console.error(err);
    res.json({errcode: 1, errmsg: "internal error"})
  }
})

//TODO: cancel reservation by customer
router.route("/cancelreservation").post((req, res)=>{

})

//
//get request (/customers)
router.route("/").get((req, res) => {
  console.log("Accessing /customers/, user:");
  console.log(req.user);
  Customer.find()
    .populate("account")
    .then((customers) => res.json(customers))
    .catch((err) => res.status(400).json("Error: " + err));
  console.log("test");
});

router.route("/getcustomerinfo").get((req, res) => {
  var _id = req.user._id;
  //query from db
  console.log("/customers/getcustomerinfo:");
  Customer.findOne({ account: _id })
    .populate("account")
    .then((result) => {
      console.log(result);
      res.json(result); //TODO: Not working correctly, needs to be fixed
    });
  //console.log(req.user);
});

// post request (/customers/add)
router.route("/add").post((req, res) => {
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

router.route("/:id").get((req, res) => {
  Customer.findById(req.params.id)
    .then((customer) => res.json(customer))
    .catch((err) => res.status(400).json("Error: " + err));
});

router.route("/:id").delete((req, res) => {
  Customer.findByIdAndDelete(req.params.id)
    .then(() => res.json("Customer deleted"))
    .catch((err) => res.status(400).json("Error: " + err));
});

router.route("/update/:id").post((req, res) => {
  Customer.findById(req.params.id)
    .then((customer) => {
      customer.firstName = req.body.firstname;
      customer.lastName = req.body.lastname;
      customer.email = req.body.email;
      customer.phoneNumber = req.body.phonenumber;
      customer.password = req.body.password;
      customer.noShowCount = req.body.noShowCount;

      customer
        .save()
        .then(() => res.json("Customer updated"))
        .catch((err) => res.status(400).json("Error: " + err));
    })
    .catch((err) => res.status(400).json("error: " + err));
});

module.exports = router;
