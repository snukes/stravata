var express = require('express');
var strava = require('strava-v3');
var q = require('q');
var app = express();

app.set('view engine', 'ejs');

app.listen(3000, function() {
  console.log('listening on 3000');
});

function getActivityById(activityId) {
  var deferred = q.defer();
  strava.activities.get({id: activityId}, (err, payload) => {
    if(!err) {
      activity = {
        id : payload.id,
        start_date_local : payload.start_date_local,
        calories : payload.calories
      };
      deferred.resolve(activity);
    } else {
      deferred.reject(err);
    }
  });
  return deferred.promise;
}

function getAllActivities() {
  var deferred = q.defer();
  strava.athlete.listActivities({}, (err, payload) => {
    if(!err) {
      deferred.resolve(payload);
    } else {
      deferred.reject(err);
    }
  });  
  return deferred.promise;
}

// processes a list of activities and returns calories burned for the past day, month, and year
function processActivities(activityList) {
  
  var oneDay = new Date() - 1;
  var oneMonth = new Date();
  var oneYear = new Date();
  
  oneMonth.setMonth(oneMonth.getMonth() - 1);
  oneYear.setYear(oneYear.getYear() - 1);
  
  var caloriesOneDay    = 0;
  var caloriesOneMonth  = 0;
  var caloriesOneYear   = 0;
  
  for (var i = 0; i < activityList.length; i++) {  
    console.log('Activity');
    
    var actDate = new Date(activityList[i].start_date_local);
    var calories = activityList[i].calories;
    
    console.log('Activity Date: ' + actDate);

    if (actDate > oneDay) caloriesOneDay += calories;
    if (actDate > oneMonth) caloriesOneMonth += calories;
    if (actDate > oneYear) caloriesOneYear += calories;
  }

  console.log('Calories one year: ' + caloriesOneYear); 
  
  return {
    caloriesOneDay    : caloriesOneDay,
    caloriesOneMonth  : caloriesOneMonth,
    caloriesOneYear   : caloriesOneYear
  };   
}

app.get('/', (req, res) => {
  getAllActivities().then(payload => {
    var promises = []
    for (var i = 0; i < payload.length; i++) {
    //for (var i = 0; i < 2; i++) {
      var promise = getActivityById(payload[i].id);
      promises.push(promise);
    }
            
    q.all(promises).then(activityList => {
      console.log('activityList');
      console.log(activityList);
      console.log('');      

      var calList = processActivities(activityList);
      
      res.render('index.ejs', {calList: calList});
    }, reason => {
      console.log(reason);
      res.render('index.ejs');
    });

  }, reason => {
    console.log(reason);
  });
});

