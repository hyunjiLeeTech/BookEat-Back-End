const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const customerSchema = new Schema(
  {
    firstName: {
      type: String,
      required: false,
      unique: false,
      maxlength: 32,
    },
    lastName: { type: String, required: false, maxLength: 32 },
    email: { type: String, required: false, maxLength: 255 },
    phoneNumber: {
      type: Number,
      required: false,
      minlength: 10,
      maxlength: 10,
    },
    password: { type: String, required: false, minlength: 6, maxlength: 32 },
  },
  {
    timestamps: true,
  }
);

const Customer = mongoose.model("Customer", customerSchema);

module.exports = Customer;
