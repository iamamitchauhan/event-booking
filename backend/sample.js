
const eventService = require('./event-service');


(async () => {

  const events = await eventService.getAllEvents();
  console.log(events);

})();
