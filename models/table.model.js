const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const tableSchema = new Schema({
  restaurant:  { type: Schema.Types.ObjectId, ref: "Restaurant" },
  size: {type: Number},
  status: {type: Boolean, default: true},
  isNearWindow: {type: Boolean},
  isQuiet: {type: Boolean},
  rid: {type: Number, default: 0}, //Id in restaurant
  isDeleted: {type: Boolean, default: false}
});

tableSchema.pre('save', async function(next){
    if(this.isNew){
        let t = await Table.find({ restaurant: this.restaurant });
        this.rid = t.length+1;
        next();
    }else{
        next();
    }
})

const Table = mongoose.model("Table", tableSchema);




module.exports = Table;
