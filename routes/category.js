const router = require("express").Router();
let Category = require("../models/category.model");

//get request (/category)
router.route("/").get((req, res) => {
  Category.find()
    .then((category) => res.json(category))
    .catch((err) => res.status(400).json("Error: " + err));
});

// post request (/category/add)
router.route("/add").post((req, res) => {
  const categoryName = req.body.categoryName;
  const categoryVal = req.body.categoryVal;

  const newCategory = new Category({
    categoryName,
    categoryVal,
  });

  newCategory
    .save()
    .then(() => res.json("Category Added"))
    .catch((err) => res.status(400).json("Error: " + err));
});

router.route("/:id").get((req, res) => {
  Category.findById(req.params.id)
    .then((category) => res.json(category))
    .catch((err) => res.status(400).json("Error: " + err));
});

router.route("/:id").delete((req, res) => {
  Category.findByIdAndDelete(req.params.id)
    .then(() => res.json("Category deleted"))
    .catch((err) => res.status(400).json("Error: " + err));
});

router.route("/update/:id").post((req, res) => {
  Category.findById(req.params.id)
    .then((category) => {
      category.categoryName = req.body.categoryName;

      category
        .save()
        .then(() => res.json("Category updated"))
        .catch((err) => res.status(400).json("Error: " + err));
    })
    .catch((err) => res.status(400).json("error: " + err));
});

module.exports = router;
