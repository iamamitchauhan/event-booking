var express = require('express');
var router = express.Router();


/* GET Events */
router.get('/', function (req, res, next) {
  /**
    Return all the events between the given StartDate & EndDate
    Params: StartDate, EndDate
   */

  res.send('Get Events List ');
});

/* GET free slots */
router.get('/free-slots', function (req, res, next) {
  /**
    Return all the free slots available for a given date converted to whatever timezone we pass.
    Params: Date, Timezone
   */

  const { startDate, endDate, timezone } = req.params;
  res.send({
    data: []
  });
});

// Create event
router.post('/', function (req, res, next) {
  /**
      Whatever data you will pass will create the event and store that into the firestore
      document, if the event already exists for that time you need to return status code 422 or
      just store it and return it with status 200.
    
      Params: DateTime (You can decide the format, timestamp or date format up to you), Duration (In minutes, INT)
   */

  res.send('Create new Event');
});

module.exports = router;
