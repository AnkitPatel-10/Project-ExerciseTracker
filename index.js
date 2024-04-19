const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

const mongoose = require("mongoose");

mongoose
  .connect(process.env.MONGO_URI)
  .then(success => console.log("Database Successful connection"))
  .catch(err => console.log(err.message));


const userSchema = mongoose.Schema({
  username: {
    type: String,
    unique: true,
  },
},
  { versionKey: false }
);

const User = mongoose.model('User', userSchema);

const exerciseSchema = mongoose.Schema(
  {
    username: String,
    description: String,
    duration: Number,
    date: Date,
    userId: String,

  },
  { versionKey: false }

);

const Exercise = mongoose.model('Exercise', exerciseSchema);

app.use(express.urlencoded({ extended: true }));

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

//GET request to /api/users
app.get("/api/users", async (req, res) => {
  const users = await User.find();
  res.send(users);
});


app.post("/api/users", async (req, res) => {
  const username = req.body.username;
  const foundUser = await User.findOne({ username });

  if (foundUser)
    res.send(foundUser);

  const user = await User.create({
    username,
  });

  res.json(user);
});


app.get("/api/users/:_id/logs", async (req, res) => {

  let { from, to, limit } = req.query;

  const userId = req.params._id;
  const user = await User.findById(userId);

  let filter = { userId };
  let dateFilter = {};
  if (from) {
    dateFilter['$gte'] = new Date(from);
  }
  if (to) {
    dateFilter['$lte'] = new Date(to);
  }
  if (from || to)
    filter.date = dateFilter;

  if (!limit) {
    limit = 100;
  }

  let exercises = await Exercise.find(filter).limit(limit);
  exercises = exercises.map((ex) => {
    return {

      description: ex.description,
      duration: ex.duration,
      date: ex.date.toDateString(),
    }
  });

  res.send(
    {
      _id: userId,
      username: user.username,
      count: exercises.length,
      log: exercises
    }
  );


});


app.post("/api/users/:_id/exercises", async (req, res) => {

  let { description, duration, date } = req.body;
  let { _id } = req.params;

  if (!date) {
    date = new Date();
  }
  else
    date = new Date(date);

  const user = await User.findById({ _id });

  const exercise = Exercise.create({
    username: user.username,
    description,
    duration,
    date,
    userId: _id,

  });

  return res.json(
    {
      username: user.username,
      description,
      duration: Number(duration),
      date: date.toDateString(),
      _id,
    });

});



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
