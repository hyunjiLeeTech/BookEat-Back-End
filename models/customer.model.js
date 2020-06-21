const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const customerSchema = new Schema(
  {
    account: { type: Schema.Types.ObjectId, ref: "Account" },
    firstName: {
      type: String,
      required: false,
      unique: false,
      maxlength: 32,
    },
    lastName: { type: String, required: false, maxLength: 32 },
    phoneNumber: {
      type: Number,
      required: false,
      minlength: 10,
      maxlength: 10,
    },
    noShowCount: {
      type: Number,
      required: true,
      unique: false,
    },
  },
  {
    timestamps: true,
  }
);

const Customer = mongoose.model("Customer", customerSchema);

module.exports = Customer;
