const router = require("express").Router();
let Customer = require("../models/customer.model");
const e = require("express");

addCustomer = async function(obj){
  const regExpEmail = RegExp(
    /^[a-zA-Z0-9]+@[a-zA-Z0-9]+\.[A-Za-z]+$/
  );
  
  const regExpPhone = RegExp(
    /^\(?([0-9]{3})\)?[-.●]?([0-9]{3})[-.●]?([0-9]{4})$/
  );
  
  const regExpPassword = RegExp(
    /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{6,32}$/
  );
  const firstName = obj.firstname;
  const lastName = obj.lastname;
  const email = obj.email;
  const phoneNumber = obj.phonenumber;
  const password = obj.password;

  let messages = {};
  const newCustomer = new Customer({
    firstName,
    astName,
    email,
    phoneNumber,
    password,
  });
  if(firstname.length < 1){
    messages.firstName = "First name should have at least one char"
  }
  if(lastName.length < 1){
    messages.lastName = "First name should have at least one char"
  }
  if(!regExpEmail.test(email)){
    messages.email = "Incorrect email format"
  }
  if(!regExpPassword.test(password)){
    messages.password = "Password does not satisfy the password policy"
  }
  if(!regExpPhone.test(phonenumber)){
    messages.phoneNumber = "Incorrect phone number"
  }
  if(messages !== {}) throw messages;
  
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
  addCustomer({firstName: req.body.firstName, lastName: req.body.lastName, email: req.body.email, phoneNumber: req.body.phoneNumber, password: req.body.phoneNumber})
  .then(()=>res.json({errcode: 0, messages: "success"}))
  .catch((err) => res.json({errcode: 1, messages: err}))
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
