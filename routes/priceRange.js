const router = require("express").Router();
let PriceRange = require("../models/priceRange.model");

//get request (/priceRange)
router.route("/").get((req, res) => {
  PriceRange.find()
    .then((priceRange) => res.json(priceRange))
    .catch((err) => res.status(400).json("Error: " + err));
});

// post request (/priceRange/add)
router.route("/add").post((req, res) => {
  const priceRangeName = req.body.priceRangeName;
  const minPrice = Number(req.body.minPrice);
  const maxPrice = Number(req.body.maxPrice);

  const newPriceRange = new PriceRange({
    priceRangeName,
    minPrice,
    maxPrice,
  });

  newPriceRange
    .save()
    .then(() => res.json("Price Range Added"))
    .catch((err) => res.status(400).json("Error: " + err));
});

router.route("/:id").get((req, res) => {
  PriceRange.findById(req.params.id)
    .then((priceRange) => res.json(priceRange))
    .catch((err) => res.status(400).json("Error: " + err));
});

router.route("/:id").delete((req, res) => {
  PriceRange.findByIdAndDelete(req.params.id)
    .then(() => res.json("Price Range deleted"))
    .catch((err) => res.status(400).json("Error: " + err));
});

router.route("/update/:id").post((req, res) => {
  PriceRange.findById(req.params.id)
    .then((priceRange) => {
      priceRange.priceRangeName = req.body.priceRangeName;
      priceRange.minPrice = Number(req.body.minPrice);
      priceRange.maxPrice = Number(req.body.maxPrice);

      priceRange
        .save()
        .then(() => res.json("Price Range updated"))
        .catch((err) => res.status(400).json("Error: " + err));
    })
    .catch((err) => res.status(400).json("error: " + err));
});

module.exports = router;
