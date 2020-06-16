const router = require("express").Router();
let RestaurantOwner = require("../models/restaurantOwner.model");
const RestaurnatOwner = require("../models/restaurantOwner.model");

router.route("/").get((req, res) => {
  RestaurantOwner.find()
    .then((restaurantOwners) => res.json(restaurantOwners))
    .catch((err) => res.status(400).json("Error: " + err));
});

router.route("/add").post((req, res) => {
  const firstName = req.body.firstName;

  const newRestaurantOwner = new RestaurnatOwner({
    firstName,
  });
});

module.exports = router;
