'use strict'
const moment = require('moment-timezone');
const ApiError = require('../utils/ApiError');

const { getFirestore, Timestamp } = require('firebase-admin/firestore');

class EventService {

  collectionName = 'events';
  statusCodeValidation = 400;
  statusCodeNotAvailable = 422;

  constructor() {
    this.db = getFirestore();
  }

  async createEvent(datetime, duration) {
    try {
      // validate
      // TODO: Integrate joi for request data validation
      if (!datetime) { // start datetime in utc
        throw new ApiError(this.statusCodeValidation, 'Datetime required');
      }
      if (!duration) { // in minutes
        throw new ApiError(this.statusCodeValidation, 'Duration required');
      }
      if (!Number.isInteger(duration)) { // in minutes
        throw new ApiError(this.statusCodeValidation, 'Duration must be in minutes, allows integer value only');
      }
      const startDatetime = moment(datetime).utc();
      const endDatetime = moment(datetime).add(duration, 'minutes').utc();
      console.log({
        startDatetime,
        endDatetime
      });

      // check existing events
      const snapshotStart = await this.db.collection(this.collectionName)
        .where('start', '>=', Timestamp.fromDate(new Date(startDatetime.toISOString())))
        .where('start', '<=', Timestamp.fromDate(new Date(endDatetime.toISOString())))
        .count()
        .get();
      if (snapshotStart.data().count) {
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
        throw new ApiError(400, 'Start date required');
      }
      if (!endDate) {
        throw new ApiError(400, 'End date required');
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
}

module.exports = new EventService();
