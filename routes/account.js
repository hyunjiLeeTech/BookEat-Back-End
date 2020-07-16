const router = require("express").Router();
let Customer = require("../models/customer.model");
let Account = require("../models/account.model");
var passport = require('passport');



async function getAccountByIdAsync(id){
  return await Account.findOne({_id: id});
}


router.route("/").get((req, res) => {
  Account.find()
    .then((account) => res.json(account))
    .catch((err) => res.status(400).json("Error: " + err));
});

router.route("/add").post((req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const userTypeId = req.body.userTypeId;

  const newAccount = new Account({
    _id: email,
    password,
    userTypeId,
  });

  newAccount
    .save()
    .then(() => {
      res.json("Account Added");
    })
    .catch((err) => res.status(400).json("Error: " + err));
});

router.post("/resetpassword", passport.authenticate('jwt', { session: false }), async (req, res, next)=>{
  try{
    console.log(req.user._id)
    var account = await getAccountByIdAsync(req.user._id);
    if(account.password !== req.body.oldPassword){
      res.json({errcode: 2, errmsg: 'old password not match'})
      return;
    }
    account.password = req.body.newPassword;
    account.save().then(()=>{
      res.json({errcode: 0, errmsg: 'success'});
    }).catch(err => {
      res.json({errcode: 1, errmsg: err});
    })
  } catch(err){
    console.log(err);
    res.status(500).send('internal error')
  }
})



router.route("/:id").get((req, res) => {
  Account.findById(req.params.id)
    .then((account) => res.json(account))
    .catch((err) => res.status(400).json("Error: " + err));
});

router.route("/:id").delete((req, res) => {
  Account.findByIdAndDelete(req.params.id)
    .then(() => res.json("account deleted"))
    .catch((err) => res.status(400).json("Error: " + err));
});

router.route("/update/:id").post((req, res) => {
  Account.findById(req.params.id)
    .then((account) => {
      account.userTypeId = req.body.userTypeId;
      account.password = req.body.password;

      account
        .save()
        .then(() => res.json("account updated"))
        .catch((err) => res.status(400).json("Error: " + err));
    })
    .catch((err) => res.status(400).json("error: " + err));
});

function authMiddleware(req, res, next){
  if(passport) return next();
  res.status(401).send("Login required");
}

module.exports = router;
