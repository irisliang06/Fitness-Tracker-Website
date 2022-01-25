'use strict'

// A server that uses a database. 

// express module provides basic server functions
const express = require("express");

// our database operations
const dbo = require('./databaseOps');

// Promises-wrapped version of sqlite3
const db = require('./sqlWrap');

// functions that verify activities before putting them in database
const act = require('./activity');

// object that provides interface for express
const app = express();

// use this instead of the older body-parser
app.use(express.json());

// make all the files in 'public' available on the Web
app.use(express.static('public'))

// when there is nothing following the slash in the url, return the main page of the app.
app.get("/", (request, response) => {
  response.sendFile(__dirname + "/public/index.html");
});

// This is where the server recieves and responds to get /all requests
// used for debugging - dumps whole database
app.get('/all', async function(request, response, next) {
  console.log("Server recieved a get /all request at", request.url);
  let results = await dbo.get_all()
  
  response.send(results);
});

// This is where the server recieves and responds to store POST requests
app.post('/store', async function(request, response, next) {
  console.log("Server recieved a post request at", request.url);

  let activity = act.Activity(request.body)
  await dbo.post_activity(activity)
  
  response.send({ message: "I got your POST request"});
});

// This is where the server recieves and responds to  reminder GET requests
app.get('/reminder', async function(request, response, next) {
  console.log("Server recieved a post request at", request.url)
  
  let currTime = newUTCTime()
  currTime = (new Date()).getTime()

  // Get Most Recent Past Planned Activity and Delete All Past Planned Activities
  let result = await dbo.get_most_recent_planned_activity_in_range(0, currTime)
  await dbo.delete_past_activities_in_range(0, currTime);

  if (result != null){
    // Format Activity Object Properly
    result.scalar = result.amount
    result.date = result['MAX(date)']
    // Send Client Most Recent Planned Activity from the Past
    response.send(act.Activity(result));
  } else {
    response.send({message: 'All activities up to date!'});
  }
  
});


// This is where the server recieves and responds to week GET requests
app.get('/week', async function(request, response, next) {
  console.log("Server recieved a post request at", request.url);

  let date = parseInt(request.query.date)
  let activity = request.query.activity
  
  /* Get Latest Activity in DB if not provided by query params */
  if (activity === undefined) {
    let result = await dbo.get_most_recent_entry()
    try {
      activity = result.activity
    } catch(error) {
      activity = "none"
    }
  }
  
  /* Get Activity Data for current Date and The Week Prior */
  let min = date - 6 * MS_IN_DAY
  let max = date
  let result = await dbo.get_similar_activities_in_range(activity, min, max)

  /* Store Activity amounts in Buckets, Ascending by Date */
  let data = Array.from({length: 7}, (_, i) => {
    return { date: date - i * MS_IN_DAY, value: 0 }
  })

  /* Fill Data Buckets With Activity Amounts */
  for(let i = 0 ; i < result.length; i++) {
    let idx = Math.floor((date - result[i].date)/MS_IN_DAY)
    data[idx].value += result[i].amount
  }
  
  // Send Client Activity for the Se;ected Week
  response.send(data.reverse());
});

// listen for requests :)
const listener = app.listen(3000, () => {
  console.log("The static server is listening on port " + listener.address().port);
});



// call the async test function for the database
// this fills the db with test data
// in your system, you can delete this. 
dbo.testDB().catch(
  function (error) {
    console.log("error:",error);}
);


// UNORGANIZED HELPER FUNCTIONS

const MS_IN_DAY = 86400000

/**
 * Convert GMT date to UTC
 * @returns {Date} current date, but converts GMT date to UTC date
 */
 function newUTCTime() {
    let gmtDate = new Date()
    let utcDate = (new Date(gmtDate.toLocaleDateString()))
    let utcTime = Date.UTC(
        utcDate.getFullYear(),
        utcDate.getMonth(),
        utcDate.getDay()
    )
    console.log("time:", utcTime)
    return utcTime
}



/**
 * Convert UTC date to UTC time
 * @param {Date} date - date to get UTC time of
 * @returns {number}
 */
function date_to_UTC_datetime(date) {
  let utcDate = new Date(date.toLocaleDateString())
  return Date.UTC(
        utcDate.getFullYear(),
        utcDate.getMonth(),
        utcDate.getDay()
    )
}
