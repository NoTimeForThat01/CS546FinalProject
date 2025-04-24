import {dbConnection} from './mongoConnection.js';

const getCollectionFn = (collection) => {
  let _col = undefined;

  return async () => {
    if (!_col) {
      const db = await dbConnection();
      _col = await db.collection(collection);
    }

    return _col;
  };
};

export const users = getCollectionFn('users');
export const posts = getCollectionFn('posts');
export const reviews = getCollectionFn('reviews');
export const ratings = getCollectionFn('ratings');
export const restaurant = getCollectionFn('restaurant');

//This is for the admin
export const banned = getCollectionFn('banned');
export const safetyIncidents = getCollectionFn('safetyIncidents');


