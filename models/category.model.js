const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const categorySchema = new Schema({
  categoryVal: {
    type: String,
    required: true,
    unique: true,
  },
  categoryName: {
    type: String,
    required: true,
    unique: true,
  },
});

const Category = mongoose.model("Category", categorySchema);

module.exports = Category;
