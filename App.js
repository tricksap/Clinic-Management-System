const express = require("express");
let ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/clinicDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true,
});

const app = express();

const patientSchema = {
  name: String,
  gender: String,
  address: String,
  history: [{ Date: Date, Diagnosis: String }],
};

const Patient = mongoose.model("patient", patientSchema);

app.set("view engine", "ejs");
app.use(express.static("public"));

app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", function (req, res) {
  res.render("login");
});

app.get("/home", function (req, res) {
  res.render("index");
});
app.get("/patients", function (req, res) {
  res.render("tables");
});
app.get("/details", function (req, res) {
  res.render("details");
});
app.get("/register-patient", function (req, res) {
  res.render("NewPatient");
});

app.post("/new-patient", function (req, res) {
  const patient = new Patient({
    name: req.body.name,
    gender: req.body.gender,
    address: req.body.address,
  });
  patient.save();
  res.redirect("/home");
});

app.listen(3000, function () {
  console.log("Server Running");
});
