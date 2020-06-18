const router = require("express").Router();
let Customer = require("../models/customer.model");
let Account = require("../models/account.model");

//get request (/customers)
router.route("/").get((req, res) => {
  Customer.find()
    .populate("account")
    .then((customers) => res.json(customers))
    .catch((err) => res.status(400).json("Error: " + err));
});

// post request (/customers/add)
router.route("/add").post((req, res) => {
  const firstName = req.body.firstname;
  const lastName = req.body.lastname;
  const email = req.body.email;
  const phoneNumber = req.body.phonenumber;
  const password = req.body.password;
  const userTypeId = req.body.userTypeId;
  const noShowCount = 0;

  const newAccount = new Account({
    email,
    password,
    userTypeId,
  });

  newAccount
    .save()
    .then((account) => {
      res.json("Account Added");

      const accountId = account._id.toString();

      const newCustomer = new Customer({
        firstName,
        lastName,
        phoneNumber,
        noShowCount,
        accountId,
      });

      newCustomer.save();
    })
    .catch((err) => res.status(400).json("Error: " + err));
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
