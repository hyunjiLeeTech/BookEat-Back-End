const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const reviewSchema = new Schema(
    {
        comment: {
            type: String,
            required: true,
        },
        food: {
            type: Number,
            required: false,
        },
        environment: {
            type: Number,
            required: false,
        },
        service: {
            type: Number,
            required: false
        },
        satisfaction: {
            type: Number,
            required: false
        },
        pictures: [{
            type: String,
            required: false
        }],
        isPicture: {
            type: Boolean,
            default: false
        },
        isActive: {
            type: Boolean,
            required: true
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
