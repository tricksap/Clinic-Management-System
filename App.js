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
  birthdate: Date,
  address: String,
  history: [{ Date: Date, Diagnosis: String }],
};

const Patient = mongoose.model("patient", patientSchema);

app.set("view engine", "ejs");
app.use(express.static("public/"));

app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", function (req, res) {
  res.render("login");
});

app.get("/home", function (req, res) {
  res.render("index");
});
app.get("/patients", function (req, res) {
  Patient.find({}, function (err, found) {
    res.render("tables", { found: found });
  });
});
app.get("/details/:id", function (req, res) {
  const requestedpatient = req.params.id;
  Patient.findOne({ _id: requestedpatient }, function (err, patient) {
    res.render("details", { patient: patient });
  });
});
app.get("/register-patient", function (req, res) {
  res.render("NewPatient");
});

app.post("/new-patient", function (req, res) {
  const patient = new Patient({
    name: req.body.name,
    birthdate: req.body.birthdate,
    gender: req.body.gender,
    address: req.body.address,
  });
  patient.save();
  res.redirect("/home");
});

app.post("/diagnosis", function (req, res) {
  Patient.updateOne({ _id: req.body.id }, { Diagnosis: req.body.diagnosis });
  res.redirect("/");
});

app.listen(3000, function () {
  console.log("Server Running");
});
