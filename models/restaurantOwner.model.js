const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const restaurantOwnerSchema = new Schema(
  {
    account: { type: Schema.Types.ObjectId, ref: "Account" },
    account: { type: Schema.Types.ObjectId, ref: "Restaurant" },
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
