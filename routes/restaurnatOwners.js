const router = require("express").Router();
let RestaurantOwner = require("../models/restaurantOwner.model");
let Account = require("../models/account.model");
let Address = require("../models/address.model");
const Restaurant = require("../models/restaurnat.model");
const Customer = require("../models/customer.model");

//get request (/customers)
router.route("/").get((req, res) => {
  RestaurantOwner.find()
    .populate("account")
    .then((restaurantOwner) => res.json(restaurantOwner))
    .catch((err) => res.status(400).json("Error: " + err));
});

// post request (/customers/add)
router.route("/add").post((req, res) => {
  //account
  const userTypeId = req.body.userTypeId;
  const password = req.body.password;
  const email = req.body.email;

  //restaurantOwner
  // this is for restaurant

  //address
  const province = req.body.province;
  const streetNumber = req.body.streetNumber;
  const streetName = req.body.streetName;
  const postalCode = req.body.postalCode;
  const city = req.body.city;

  //restaurant
  const resName = req.body.resName;
  const businessNum = req.body.businessNum;
  const phoneNumber = req.body.phoneNumber;

  const newAccount = new Account({
    email,
    password,
    userTypeId,
  });

  const newAddress = new Address({
    province,
    streetName,
    streetNumber,
    postalCode,
    city,
  });

  newAccount
    .save()
    .then((account) => {
      res.json("Account Added");

      const accountId = account._id;
      let resOwnerId, adrId;

      const newRestaurantOwner = new RestaurantOwner({
        account: accountId,
      });

      newRestaurantOwner.save().then((resOwner) => {
        resOwnerId = resOwner._id;

        newAddress.save().then((address) => {
          adrId = address._id;
          const newRestaurant = new Restaurant({
            resName,
            phoneNumber,
            businessNum,
            restaurantOwnerId: resOwnerId,
            addressId: adrId,
          });

          newRestaurant.save();
        });
      });
    })
    .catch((err) => res.status(400).json("Error: " + err));
});

module.exports = router;
