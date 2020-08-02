const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const accountSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, maxLength: 255 },
    userTypeId: { type: Number, required: true },
    password: { type: String, unique: false, required: true },
    token: { type: String },
    isActive: { type: Boolean },
    emailVerified: { type: Boolean }
  },
  {
    timestamps: true,
  }
);

accountSchema.pre('save', function(next){
  if(this.emailVerified === undefined) {
    console.log(this.emailVerified) 
    this.emailVerified = false;
  }
  //TODO: delete customer account and restaurant owner account

  //TODO: inactive restaurant.




  next();
})

const Account = mongoose.model("Account", accountSchema);

module.exports = Account;
