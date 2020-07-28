const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const reservationSchema = new Schema({
    customer: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
    table: { type: Schema.Types.ObjectId, ref: "Table", required: true },
    restaurant: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true },
    dateTime: { type: Date, required: true},
    numOfPeople: {type: Number},
    comments: {type: String},
    reserveTime: {type: Date, required: true},
    status: {type: Number, default: 2},
    FoodOrder: {type: Schema.Types.ObjectId, ref: "FoodOrder", required: false}
});

reservationSchema.pre("save", function(next){
    console.log("reservation presaving")
    console.log(this);
    next();
})

const Reservation = mongoose.model("Reservation", reservationSchema);

module.exports = Reservation;
