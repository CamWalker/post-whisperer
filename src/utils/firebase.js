import firebase from 'firebase';
import config from '../../config.js';

firebase.initializeApp(config.fbConfig);
const fireFbLogin = new firebase.auth.FacebookAuthProvider();
fireFbLogin.addScope('user_posts,manage_pages');
const fireDb = firebase.database();

export {
  fireDb,
  fireFbLogin,
}
