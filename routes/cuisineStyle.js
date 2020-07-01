const router = require("express").Router();
let CuisineStyle = require("../models/cuisineStyle.model");

//get request (/cuisineStyle)
router.route("/").get((req, res) => {
  CuisineStyle.find()
    .then((cuisineStyle) => res.json(cuisineStyle))
    .catch((err) => res.status(400).json("Error: " + err));
});

// post request (/cuisineStyle/add)
router.route("/add").post((req, res) => {
  const cuisineName = req.body.cuisineName;
  const cuisineVal = req.body.cuisineVal;

  const newCuisineStyle = new CuisineStyle({
    cuisineName,
    cuisineVal,
  });

  newCuisineStyle
    .save()
    .then(() => res.json("CuisineStyle Added"))
    .catch((err) => res.status(400).json("Error: " + err));
});

router.route("/:id").get((req, res) => {
  CuisineStyle.findById(req.params.id)
    .then((cuisineStyle) => res.json(cuisineStyle))
    .catch((err) => res.status(400).json("Error: " + err));
});

router.route("/:id").delete((req, res) => {
  CuisineStyle.findByIdAndDelete(req.params.id)
    .then(() => res.json("CuisineStyle deleted"))
    .catch((err) => res.status(400).json("Error: " + err));
});

router.route("/update/:id").post((req, res) => {
  CuisineStyle.findById(req.params.id)
    .then((cuisineStyle) => {
      cuisineStyle.cuisineName = req.body.cuisineName;
      cuisineStyle.cuisineVal = req.body.cuisineVal;

      cuisineStyle
        .save()
        .then(() => res.json("CuisineStyle updated"))
        .catch((err) => res.status(400).json("Error: " + err));
    })
    .catch((err) => res.status(400).json("error: " + err));
});

module.exports = router;
