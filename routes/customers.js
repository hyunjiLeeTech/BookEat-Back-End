const router = require("express").Router();
let Customer = require("../models/customer.model");
const e = require("express");

function isEmpty(obj) {
  for(var key in obj) {
      if(obj.hasOwnProperty(key))
          return false;
  }
  return true;
}

let findCustomerByEmailAsyc = async function(email){
  return await Customer.find({email: email});
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
  
  const regExpPassword = RegExp(
    /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{6,32}$/
  );
  const firstName = obj.firstName;
  const lastName = obj.lastName;
  const email = obj.email;
  const phoneNumber = obj.phoneNumber;
  const password = obj.password;


  const newCustomer = new Customer({
    firstName,
    lastName,
    email,
    phoneNumber,
    password,
  });
  let message = "";
  if((await findCustomerByEmailAsyc(email)).length > 0 ){
    message = "This email is already registered"
    throw message;
  }
  if((await findCustomerByPhoneNumberAsync(phoneNumber)).length > 0){
    message = "This phonenumber is already registered"
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
  if(!regExpPassword.test(password)){
    message = "Password does not satisfy the password policy"
    throw message;

  }
  if(!regExpPhone.test(phoneNumber)){
    message = "Incorrect phone number"
    throw message;

  }
  return await newCustomer.save()
}





//get request (/customers)
router.route("/").get((req, res) => {
  Customer.find()
    .then((customers) => res.json(customers))
    .catch((err) => res.status(400).json("Error: " + err));
    console.log("test");
});

// post request (/customers/add)
router.route("/add").post((req, res) => {
  //console.log(req.body)
  addCustomerAsync({firstName: req.body.firstname, lastName: req.body.lastname, email: req.body.email, phoneNumber: req.body.phonenumber, password: req.body.password})
  .then(()=>res.json({errcode: 0, errmsg: "success"}))
  .catch((err) => res.json({errcode: 1, errmsg: err}))
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

      customer
        .save()
        .then(() => res.json("Customer updated"))
        .catch((err) => res.status(400).json("Error: " + err));
    })
    .catch((err) => res.status(400).json("error: " + err));
});

module.exports = router;
