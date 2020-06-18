const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const addressSchema = new Schema({
  streetNum: { type: String, required: false, maxLength: 255 },
  streetName: { type: Number, required: false },
  city: { type: String, required: true },
  province: { type: String, required: true },
  postalCode: { type: String, required: true },
});

const Address = mongoose.model("Address", addressSchema);

module.exports = Address;
