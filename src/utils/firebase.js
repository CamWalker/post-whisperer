import firebase from 'firebase';
import config from '../../config.js';

const fireDb = firebase.initializeApp(config.fbConfig);

export default fireDb.database();
