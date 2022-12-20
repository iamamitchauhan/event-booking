'use strict'
const moment = require('moment-timezone');
const ApiError = require('../utils/ApiError');

const { getFirestore, Timestamp } = require('firebase-admin/firestore');

class EventService {

  // Congigurations
  collectionName = 'events';
  statusCodeValidation = 400;
  statusCodeNotAvailable = 422;
  doctorProfile = {
    // Start Hours - which will suggest at which time you want to start your availability, 24 hours format time hh:mm
    startHours: '10:30',

    // End Hours - which will suggest at which time you want to end your availability, 24 hours format time hh:mm
    endHours: '15:30',

    // Duration - Duration of slot, in minutes
    duration: 30,

    // Timezone, e.g. 'America/Los_Angeles'
    timezone: 'Asia/Kolkata'

  };

  constructor() {
    this.db = getFirestore();
  }

  async freeSlots(date, timezone) {
    // TODO: Integrate joi for request data validation
    if (!date) {
      throw new ApiError(this.statusCodeValidation, 'Date is required');
    }
    if (!this.isDate(date)) {
      throw new ApiError(this.statusCodeValidation, 'Date is invalid');
    }
    if (!timezone) {
      throw new ApiError(this.statusCodeValidation, 'Timezone is required');
    }

    // time slot start & end as per doctor timezone
    const slotStartDate = moment.tz(date + ' ' + this.doctorProfile.startHours, this.doctorProfile.timezone);
    const slotEndDate = moment.tz(date + ' ' + this.doctorProfile.endHours, this.doctorProfile.timezone);
    // console.log(slotStartDate.format()); // in doctor timezone
    // console.log(slotStartDate.utc().toISOString()); // converted to utc, to compare with database

    // convert to user's timezone
    const userSlotStartDate = slotStartDate.clone().tz(timezone);
    const userSlotEndDate = slotEndDate.clone().tz(timezone);
    console.log({
      statUnix: userSlotStartDate.unix(),
      endUnix: userSlotEndDate.unix(),
    })
    // console.log('========= user slot start');
    // console.log(userSlotStartDate.format());
    // console.log(userSlotEndDate.format());

    const slots = [];
    let slotNumber = 0;
    while (true) {
      const slot = userSlotStartDate.clone().add(this.doctorProfile.duration * slotNumber, 'minutes');
      slots.push(slot.format());
      slotNumber++;
      if (slot.unix() >= userSlotEndDate.unix() || slotNumber > 1440) { // max 1440 sloat
        break;
      }
    }

    return {
      doctorProfile: this.doctorProfile,
      slotTimezone: timezone,
      slots,
    };
  }

  async createEvent(datetime, duration) {
    try {
      // validate
      // TODO: Integrate joi for request data validation
      if (!datetime) { // start datetime in utc
        throw new ApiError(this.statusCodeValidation, 'Datetime is required');
      }
      if (!this.isIsoDate(datetime)) {
        throw new ApiError(400, 'Datetime is invalid');
      }
      if (!duration) { // in minutes
        throw new ApiError(this.statusCodeValidation, 'Duration is required');
      }
      if (!Number.isInteger(duration)) { // in minutes
        throw new ApiError(this.statusCodeValidation, 'Duration must be in minutes, allows integer value only');
      }
      const startDatetime = moment(datetime).utc();
      const endDatetime = moment(datetime).add((duration * 60), 'second').utc();
      console.log({
        startDatetime,
        endDatetime,
      });

      // count existing events
      const [snapshotStart, snapshotEnd] = await Promise.all([
        this.db.collection(this.collectionName)
          .where('start', '>=', Timestamp.fromDate(new Date(startDatetime.toISOString())))
          .where('start', '<=', Timestamp.fromDate(new Date(endDatetime.toISOString())))
          .orderBy('start')
          .count()
          .get(),
        this.db.collection(this.collectionName)
          .where('end', '>=', Timestamp.fromDate(new Date(startDatetime.toISOString())))
          .where('end', '<=', Timestamp.fromDate(new Date(endDatetime.toISOString())))
          .orderBy('end')
          .count()
          .get()
      ]);
      if (snapshotStart.data().count || snapshotEnd.data().count) {
        throw new ApiError(this.statusCodeNotAvailable, 'Time slot is not available');
      }

      // create event
      const res = await this.db.collection(this.collectionName).add({
        start: Timestamp.fromDate(startDatetime.toDate()),
        end: Timestamp.fromDate(endDatetime.toDate())
      });

      return {
        id: res.id,
        start: startDatetime.toISOString(),
        end: endDatetime.toISOString()
      };
    } catch (error) {
      console.log('Event : getAllEvents : error : ', JSON.stringify(error));
      if (error === 400) {
        throw error;
      } else {
        throw new ApiError(500, error.message);
      }
    }
  }

  async getAllEvents(startDate, endDate) {
    try {
      // validate
      // TODO: Integrate joi for request data validation
      if (!startDate) {
        throw new ApiError(400, 'Start date is required');
      }
      if (!this.isIsoDate(startDate)) {
        throw new ApiError(400, 'Start date is invalid');
      }
      if (!endDate) {
        throw new ApiError(400, 'End date is required');
      }
      if (!this.isIsoDate(endDate)) {
        throw new ApiError(400, 'End date is invalid');
      }

      // retrive events
      const snapshot = await this.db.collection(this.collectionName)
        .where('start', '>=', Timestamp.fromDate(new Date(startDate)))
        .where('start', '<=', Timestamp.fromDate(new Date(endDate)))
        .orderBy('start')
        .get();

      const events = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        events.push({
          id: doc.id,
          start: moment.utc(data.start._seconds * 1000).toISOString(),
          end: moment.utc(data.end._seconds * 1000).toISOString(),
          // data,
        });
      });

      return { data: events };
    } catch (error) {
      console.log('Event : getAllEvents : error : ', JSON.stringify(error));
      if (error === 400) {
        throw error;
      } else {
        throw new ApiError(500, error.message);
      }
    }
  }

  isIsoDate(str) {
    if (!/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/.test(str)) return false;
    const d = new Date(str);
    return d instanceof Date && !isNaN(d) && d.toISOString() === str; // valid date 
  }

  isDate(str) {
    if (!/\d{4}-\d{2}-\d{2}/.test(str)) return false;
    const d = new Date(str);
    return d instanceof Date && !isNaN(d); // valid date 
  }
}

module.exports = new EventService();
