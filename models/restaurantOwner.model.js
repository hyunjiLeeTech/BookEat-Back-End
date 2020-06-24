const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const restaurantOwnerSchema = new Schema(
  {
    account: { type: Schema.Types.ObjectId, ref: "Account" },
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
