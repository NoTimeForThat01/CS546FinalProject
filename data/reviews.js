import { ObjectId } from 'mongodb';
import { reviews } from '../config/mongoCollections.js';

export const createReview = async (userId, entityId, rating, comment) => {
  if (!userId || !entityId || typeof rating !== 'number' || !comment) {
    throw new Error('Invalid input');
  }

  const review = {
    userId: new ObjectId(userId),
    entityId: new ObjectId(entityId),
    rating,
    comment,
    timestamp: new Date()
  };

  const reviewCollection = await reviews();
  const insertInfo = await reviewCollection.insertOne(review);
  if (!insertInfo.acknowledged || !insertInfo.insertedId) throw 'Could not add review';

  return { ...review, _id: insertInfo.insertedId };
};

export const getReviewsByEntityId = async (entityId) => {
  const reviewCollection = await reviews();
  return await reviewCollection.find({ entityId: new ObjectId(entityId) }).toArray();
};

