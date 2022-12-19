var express = require('express');
var router = express.Router();

const eventService = require('../backend/event-service');

/* GET Events */
router.get('/', async function (req, res, next) {
  /**
    Return all the events between the given StartDate & EndDate
    Params: StartDate, EndDate
   */

  try {
    const events = await eventService.getAllEvents(req.query.startDate, req.query.endDate);
    res.send(events);
  } catch (error) {
    next(error);
  }
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
router.post('/', async function (req, res, next) {
  /**
      Whatever data you will pass will create the event and store that into the firestore
      document, if the event already exists for that time you need to return status code 422 or
      just store it and return it with status 200.
    
      Params: DateTime (You can decide the format, timestamp or date format up to you), Duration (In minutes, INT)
   */
  try {
    const datetime = req.body.datetime;
    const duration = req.body.duration;

    const event = await eventService.createEvent(datetime, duration);
    res.send(event);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
