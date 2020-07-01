const router = require("express").Router();
let StoreTime = require("../models/storeTime.model");

//get request (/cuisineStyle)
router.route("/").get((req, res) => {
  StoreTime.find()
    .then((storeTime) => res.json(storeTime))
    .catch((err) => res.status(400).json("Error: " + err));
});

// post request (/cuisineStyle/add)
router.route("/add").post((req, res) => {
  const storeTimeVal = req.body.storeTimeVal;
  const storeTimeName = req.body.storeTimeName;

  const newStoreTime = new StoreTime({
    storeTimeVal,
    storeTimeName,
  });

  newStoreTime
    .save()
    .then(() => res.json("storeTime Added"))
    .catch((err) => res.status(400).json("Error: " + err));
});

module.exports = router;
