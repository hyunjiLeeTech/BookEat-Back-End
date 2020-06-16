const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const resraurantSchema = new Schema(
  {
    restaurantName: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

const Restaurant = mongoose.model("Restaurant", restaurantSchema);

module.exports = Restaurant;
