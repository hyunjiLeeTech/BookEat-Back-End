const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const restaurantSchema = new Schema(
  {
    resName: { type: String, required: true },
    businessNum: { type: String, required: true },
    restaurantDescription: { type: String },
    phoneNumber: { type: Number, required: false },
    email: { type: String, required: false },
    monOpenTime: { type: Date, required: false },
    tueOpenTime: { type: Date, required: false },
    wedOpenTime: { type: Date, required: false },
    thurOpenTime: { type: Date, required: false },
    friOpenTime: { type: Date, required: false },
    satOpenTime: { type: Date, required: false },
    sunOpenTime: { type: Date, required: false },
    monCloseTime: { type: Date, required: false },
    tueCloseTime: { type: Date, required: false },
    wedCloseTime: { type: Date, required: false },
    thurCloseTime: { type: Date, required: false },
    friCloseTime: { type: Date, required: false },
    satCloseTime: { type: Date, required: false },
    sunCloseTime: { type: Date, required: false },
    addressId: { type: Schema.Types.ObjectId, required: true, ref: "Address" },
    restaurantOwnerId: {
      type: Schema.Types.ObjectId,
      ref: "RestaurantOwner",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Restaurant = mongoose.model("Restaurant", restaurantSchema);

module.exports = Restaurant;
