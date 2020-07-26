const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const reviewSchema = new Schema(
    {
        date: {
            type: Date,
            required: true,
        },
        content: {
            type: String,
            required: true,
            maxLength: 32,
        },
        foodRate: {
            type: Number,
            required: false,
        },
        serviceRate: {
            type: Number,
            required: false,
        },
        satisfactionRate: {
            type: Number,
            required: false
        },
        environmentRate: {
            type: Number,
            required: false
        },
        restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant" },
        customerId: { type: Schema.Types.ObjectId, ref: "Customer" },
    },
    {
        timestamps: true,
    }
);

const Review = mongoose.model("Review", reviewSchema);

Review.createIndexes();

module.exports = Review;
