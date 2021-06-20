const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const moment = require("moment");
const methodOverride = require("method-override");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

app.set("view engine", "ejs");
app.use(express.static("public/"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/clinicDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true,
});

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
});
userSchema.plugin(passportLocalMongoose);

const diagnosisSchema = new mongoose.Schema({
  date: Date,
  diagnosis: String,
});

const patientSchema = new mongoose.Schema({
  name: String,
  gender: String,
  birthdate: Date,
  address: String,
  history: [diagnosisSchema],
});
const appointmentSchema = new mongoose.Schema({
  title: String,
  start: Date,
  end: Date,
});
const medicineSchema = new mongoose.Schema({
  name: String,
  type: String,
  description: String,
  stocks: Number,
});
const User = mongoose.model("User", userSchema);
const Medicine = mongoose.model("medicine", medicineSchema);
const Appointment = mongoose.model("appointment", appointmentSchema);
const Diagnosis = mongoose.model("diagnosis", diagnosisSchema);
const Patient = mongoose.model("patient", patientSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/register", function (req, res) {
  res.render("register");
});
app.get("/", function (req, res) {
  res.render("login");
});

app.post("/register", function (req, res) {
  User.register(
    { username: req.body.username },
    req.body.password,
    function (err, user) {
      if (err) {
        console.log(err);
        res.redirect("/register");
      } else {
        passport.authenticate("local")(req, res, function () {
          res.redirect("/home");
        });
      }
    }
  );
});
app.post("/", function (req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password,
  });

  req.login(user, function (err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/home");
      });
    }
  });
});

app.get("/logout", function (req, res) {
  req.logout();
  res.redirect("/");
});

// patient
app.get("/home", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("index");
  } else {
    res.redirect("/");
  }
});
app.get("/patients", function (req, res) {
  if (req.isAuthenticated()) {
    Patient.find({}, function (err, found) {
      res.render("tables", { found: found });
    });
  } else {
    res.redirect("/");
  }
});
app.get("/patients/:id", function (req, res) {
  if (req.isAuthenticated()) {
    const requestedpatient = req.params.id;
    Patient.findOne({ _id: requestedpatient }, function (err, patient) {
      let birthdate = moment(patient.birthdate);
      birthdate = birthdate.format("DD/MM/YYYY");
      res.render("details", { patient: patient, date: birthdate });
    });
  } else {
    res.redirect("/");
  }
});

app.delete("/patients/:id", function (req, res) {
  if (req.isAuthenticated()) {
    Patient.deleteOne({ _id: req.params.id }, function (error, success) {
      if (error) {
        console.log(error);
      } else {
        console.log(success);
      }
    });
    res.redirect("/patients");
  } else {
    res.redirect("/");
  }
});

app.get("/patient/edit/:id", function (req, res) {
  if (req.isAuthenticated()) {
    Patient.findOne({ _id: req.params.id }, function (err, patient) {
      let birthdate = moment(patient.birthdate);
      birthdate = birthdate.format("YYYY-MM-DD");
      res.render("patient-edit", { patient: patient, birthdate: birthdate });
    });
  } else {
    res.redirect("/");
  }
});

app.put("/patient/edit/:id", function (req, res) {
  if (req.isAuthenticated()) {
    Patient.updateOne(
      { _id: req.params.id },
      {
        name: req.body.name,
        birthdate: req.body.birthdate,
        gender: req.body.gender,
        address: req.body.address,
      },
      function (error, success) {
        if (error) {
          console.log(error);
        } else {
          console.log(success);
        }
      }
    );
    res.redirect("/patients");
  } else {
    res.redirect("/");
  }
});

app.get("/create", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("NewPatient");
  } else {
    res.redirect("/");
  }
});

app.post("/create", function (req, res) {
  if (req.isAuthenticated()) {
    const patient = new Patient({
      name: req.body.name,
      birthdate: req.body.birthdate,
      gender: req.body.gender,
      address: req.body.address,
    });
    patient.save();
    res.redirect("/patients");
  } else {
    res.redirect("/");
  }
});

app.post("/diagnosis", function (req, res) {
  if (req.isAuthenticated()) {
    const diagnosis = new Diagnosis({
      date: moment().format("YYYY-MM-DD"),
      diagnosis: req.body.diagnosis,
    });
    diagnosis.save();
    Patient.updateOne(
      { _id: req.body.id },
      { $push: { history: diagnosis } },
      function (err, success) {
        if (err) {
          console.log(err);
        } else {
          console.log(success);
        }
      }
    );
    res.redirect("/patients");
  } else {
    res.redirect("/");
  }
});

app.get("/diagnosis/edit/:patient_id/:diagnosis_id", function (req, res) {
  if (req.isAuthenticated()) {
    Diagnosis.findOne({ _id: req.params.diagnosis_id }, function (err, result) {
      let date = moment(result.date);
      date = date.format("YYYY-MM-DD");
      res.render("diagnosis-edit", {
        result: result,
        date: date,
        patient_id: req.params.patient_id,
      });
    });
  } else {
    res.redirect("/");
  }
});
app.put("/diagnosis/edit/:patient_id/:diagnosis_id", function (req, res) {
  if (req.isAuthenticated()) {
    Diagnosis.updateOne(
      { _id: req.params.diagnosis_id },
      {
        date: req.body.date,
        diagnosis: req.body.diagnosis,
      },
      function (err) {
        if (err) {
          console.log(err);
        }
      }
    );
    Patient.findOneAndUpdate(
      { _id: req.params.patient_id, "history._id": req.params.diagnosis_id },
      {
        $set: {
          "history.$.date": req.body.date,
          "history.$.diagnosis": req.body.diagnosis,
        },
      },
      function (err, result) {
        if (err) {
          console.log(err);
        }
      }
    );
    res.redirect("/patients");
  } else {
    res.redirect("/");
  }
});
app.delete("/diagnosis/delete/:patient_id/:diagnosis_id", function (req, res) {
  if (req.isAuthenticated()) {
    Patient.findByIdAndUpdate(
      req.params.patient_id,
      {
        $pull: {
          history: { _id: req.params.diagnosis_id },
        },
      },
      function (err, result) {
        if (!err) {
          console.log(result);
        }
      }
    );

    Diagnosis.deleteOne(
      { _id: req.params.diagnosis_id },
      function (err, result) {
        if (!err) {
          console.log(result);
        }
      }
    );
    res.redirect("/patients");
  } else {
    res.redirect("/");
  }
});

// appointment
app.get("/appointment", function (req, res) {
  if (req.isAuthenticated()) {
    Appointment.find({}, function (err, result) {
      res.render("appointment/list", { result: result });
    });
  } else {
    res.redirect("/");
  }
});
app.post("/appointment", function (req, res) {
  if (req.isAuthenticated()) {
    const appointment = new Appointment({
      title: req.body.title,
      start: req.body.startDate + " " + req.body.startTime,
      end: req.body.endDate + " " + req.body.endTime,
    });
    appointment.save();
    res.redirect("/appointment");
  } else {
    res.redirect("/");
  }
});

// medicine
app.get("/medicine", function (req, res) {
  if (req.isAuthenticated()) {
    Medicine.find({}, function (err, result) {
      res.render("medicine/table", { result: result });
    });
  } else {
    res.redirect("/");
  }
});

app.put("/medicine", function (req, res) {
  if (req.isAuthenticated()) {
    Medicine.updateOne(
      { name: req.body.name },
      {
        type: req.body.type,
        description: req.body.description,
        stocks: req.body.stocks,
      },
      function (err, result) {
        if (!err) {
          console.log(result);
        }
      }
    );
    res.redirect("/medicine");
  } else {
    res.redirect("/");
  }
});
app.delete("/medicine", function (req, res) {
  if (req.isAuthenticated()) {
    Medicine.deleteOne({ name: req.body.delete }, function (err, result) {
      if (!err) {
        console.log(result);
      }
    });
    res.redirect("/medicine");
  } else {
    res.redirect("/");
  }
});

app.get("/medicine/new", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("medicine/new");
  } else {
    res.redirect("/");
  }
});
app.post("/medicine/new", function (req, res) {
  if (req.isAuthenticated()) {
    const medicine = new Medicine({
      name: req.body.name,
      type: req.body.type,
      description: req.body.description,
      stocks: req.body.stocks,
    });
    medicine.save();
    res.redirect("/medicine");
  } else {
    res.redirect("/");
  }
});

app.get("*", function (req, res) {
  res.render("404");
});
app.listen(3000, function () {
  console.log("Server Running");
});
