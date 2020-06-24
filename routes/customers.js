const router = require("express").Router();
let Customer = require("../models/customer.model");
let Account = require("../models/account.model");







//
//get request (/customers)
router.route("/").get((req, res) => {
  console.log("Accessing /customers/, user:")
  console.log(req.user)
  Customer.find()
    .populate("account")
    .then((customers) => res.json(customers))
    .catch((err) => res.status(400).json("Error: " + err));
    console.log("test");
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
