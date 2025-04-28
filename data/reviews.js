import { ObjectId } from 'mongodb';
import { reviews } from '../config/mongoCollections.js';
import {users} from '../config/mongoCollections.js';
import {posts} from '../config/mongoCollections.js';

export const createReview = async (userId, restaurantId, comment) => {
  if (!userId || !restaurantId || !comment) {
    throw new Error('Invalid input');
  }

  const userCollection = await users();
  const userObjectId = new ObjectId(userId);
  const userExists = await userCollection.findOne({ _id: userObjectId });
  if (!userExists) throw 'User not found';

  const postCollection = await posts();
  const restObjectId = new ObjectId(restaurantId);
  const restExists = await postCollection.findOne({_id: restObjectId});
  if (!restExists) throw 'Restaurant not found';

  const review = {
    userId: userObjectId,
    restaurantId: restObjectId,
    comment,
    timestamp: new Date()
  };

  const reviewCollection = await reviews();
  const insertInfo = await reviewCollection.insertOne(review);
  if (!insertInfo.acknowledged || !insertInfo.insertedId) throw 'Could not add review';

  //push reviews to restaurants
  const updatedReviewRest = await postCollection.updateOne(
    { _id: restObjectId },
    {
      $push: {
        reviews: comment,
      }
    }
  );

  if (updatedReviewRest.modifiedCount === 0) throw 'Could not update restaurants with review comments.';

  //push review ids to users collection
  const updatedReviewIds = await userCollection.updateOne(
    { _id: userObjectId },
    {
      $push: {
        reviews: insertInfo.insertedId
      }
    }
  )

  if (updatedReviewIds.modifiedCount === 0) throw 'Could not update User collection with review ids.'

  return { ...review, _id: insertInfo.insertedId };
};
