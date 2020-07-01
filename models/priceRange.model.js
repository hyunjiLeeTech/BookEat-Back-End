const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const priceRangeSchema = new Schema({
  priceRangeName: {
    type: String,
    unique: true,
  },
  minPrice: { type: Number, required: true },
  maxPrice: { type: Number, required: true },
});

const PriceRange = mongoose.model("PriceRange", priceRangeSchema);

module.exports = PriceRange;
