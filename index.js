const bodyParser = require("body-parser");
const express = require("express");
const app = express();
const port = 3000;
const path = require("path");
const User = require("./models/userSchema");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { promisify } = require("util");
const { verify } = require("crypto");


mongoose.connect("mongodb://127.0.0.1:27017/users");

app.use(cookieParser());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
// app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

const islogin = async (req, res, next) => {
  
  if (req.cookies.jwt) {
    const decode = await promisify(jwt.verify)(
      req.cookies.jwt,
      "12dfsds341234"
    );
    const isuserfound = await User.findOne({ _id: decode.id });
    if(isuserfound){
      res.status(200).sendFile(path.join(__dirname, "views", "home.html"));
    }
  } else {
    next();
  }
};

app.get("/", islogin, (req, res) => {
  res.sendFile(path.join(__dirname, "views", "login.html"));
});

app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "register.html"));
});
app.get("/show", async (req, res) => {
  const getUsers = await User.find();
  res.status(200).send(getUsers);
});

app.get("/api/v1/users",islogin, async (req, res) => {
  let data = await User.find();
  res.json(data);
});

app.post("/home", async (req, res) => {
  let saltRounds = 10;
  let salt = await bcrypt.genSalt(saltRounds);
  let hashedPassword = await bcrypt.hash(req.body.password, salt);
  const user = new User({
    name: req.body.username,
    email: req.body.email,
    password: hashedPassword,
  });

  let data = await user.save();
  res.status(201).sendFile(path.join(__dirname, "views", "home.html"));
});

app.post("/auth", async (req, res) => {
  let user = await User.findOne({ email: req.body.email });

  if (user) {
    let iscorrect = await bcrypt.compare(req.body.password, user.password);

    if (iscorrect) {
      const id = user.id;
      const token = jwt.sign({ id: id }, "12dfsds341234", {
        expiresIn: "90d",
      });
      const cookieOptions = {
        expires: new Date(Date.now() + 90 + 90 * 24 * 60 * 60 * 1000),
        httpOnly: true,
      };
      res.cookie("jwt", token, cookieOptions);

      return res
        .status(200)
        .sendFile(path.join(__dirname, "views", "home.html"));
    } else {
      return res.status(401).send("Password is Incorrect.!");
    }
  } else {
    return res.status(401).send("Invalid email.!");
  }
});

app.listen(port, () => console.log(`http://localhost:${port}`));
