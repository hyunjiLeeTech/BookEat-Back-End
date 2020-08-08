const mongoose = require("mongoose");
const Restaurant = require("./restaurnat.model");
const Schema = mongoose.Schema;

const accountSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, maxLength: 255 },
    userTypeId: { type: Number, required: true },
    password: { type: String, unique: false, required: true },
    token: { type: String },
    isActive: { type: Boolean },
    emailVerified: { type: Boolean },
    resetTimeStamp: { type: Number }
  },
  {
    timestamps: true,
  }
);

accountSchema.pre('save', async function (next) {
  if (this.emailVerified === undefined) {
    console.log(this.emailVerified)
    this.emailVerified = false;
  }
  //delete customer account and restaurant owner account
  if (this.isActive === false) {
    if (this.userTypeId === 1) {

    } else if (this.userTypeId === 2) { //owner
      //Deactive restaurant.
      var res = await Restaurant.findOne({ restaurantOwnerId: this._id })
      if (res) {
        res.status = 4;
        await res.save()
      }
    }
  }
  next();
})

const Account = mongoose.model("Account", accountSchema);

module.exports = Account;
