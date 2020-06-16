const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const restaurantOwnerSchema = new Schema(
  {
    firstName: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

const RestaurnatOwner = mongoose.model(
  "RestaurantOwner",
  restaurantOwnerSchema
);

module.exports = RestaurnatOwner;
