'use strict'

const admin = require("firebase-admin");
// const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore');
const serviceAccount = require("./service-credential.json");
const databaseURL = "https://event-book-c7824-default-rtdb.firebaseio.com";

class FirebaseAdmin {

  constructor() {
    try {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: databaseURL
      });

    } catch (error) {
      console.log('FirebaseAdmin : constructor : error : ', JSON.stringify(error));
      throw error;
    }
  }
}

module.exports = new FirebaseAdmin();
