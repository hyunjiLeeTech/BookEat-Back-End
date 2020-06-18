const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const restaurantSchema = new Schema(
  {
    restaurantOwner: { type: Schema.Types.ObjectId },
    resname: { type: String, required: true },
    restaurantDescription: { type: String },
    businessnumber: { type: String },
    addressId: { type: Schema.Types.ObjectId, required: false },
    phonenumber: { type: Number, required: false },
    email: { type: String, required: false },
    monOpenTime: { type: Date },
    tueOpenTime: { type: Date },
    wedOpenTime: { type: Date },
    thurOpenTime: { type: Date },
    friOpenTime: { type: Date },
    satOpenTime: { type: Date },
    sunOpenTime: { type: Date },
    monCloseTime: { type: Date },
    tueCloseTime: { type: Date },
    wedCloseTime: { type: Date },
    thurCloseTime: { type: Date },
    friCloseTime: { type: Date },
    satCloseTime: { type: Date },
    sunCloseTime: { type: Date },
  },
  {
    timestamps: true,
  }
);

const Restaurant = mongoose.model("Restaurant", restaurantSchema);

module.exports = Restaurant;
