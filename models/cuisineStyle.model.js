const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const cuisineStyleSchema = new Schema({
  cuisineVal: {
    type: String,
    unique: true,
  },
  cuisineName: {
    type: String,
    required: true,
    unique: true,
  },
});

const CuisineStyle = mongoose.model("CuisineStyle", cuisineStyleSchema);

module.exports = CuisineStyle;
