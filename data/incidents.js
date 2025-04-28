
import { ObjectId } from 'mongodb';
import { safetyIncidents } from '../config/mongoCollections.js';
import {users} from '../config/mongoCollections.js';
import {posts} from '../config/mongoCollections.js';
import validationFuncs from '../validation.js';

export const reportIncident = async (reporterId, location, description, severity, restaurantId = null) => {
  if (!reporterId || !location || !description || !severity) {
    throw new Error('Missing fields');
  }

  const incident = {
    reporterId: new ObjectId(reporterId),
    location,
    description,
    severity,
    status: 'Reported',
    timestamp: new Date()
  };
//
if (restaurantId) {
  incident.restaurantId = new ObjectId(restaurantId);
}

  const collection = await safetyIncidents();
  const insertInfo = await collection.insertOne(incident);
  if (!insertInfo.acknowledged || !insertInfo.insertedId) throw 'Incident could not be created';


  //push to restaurants -JM
  const postCollection = await posts();

  const updatedIncidentRest = await postCollection.updateOne(
    { _id: incident.restaurantId },
    {
      $push: {
        incidentComment: description
      }
    }
  );

  if (updatedIncidentRest.modifiedCount === 0) throw 'Could not update restaurants with incident comments.';

  //incident counter for restaurant page
  const restaurant = await postCollection.findOne({ _id: incident.restaurantId});

  const counter = validationFuncs.incidentCounter(restaurant.incidentComment);

  const updatedCountRest = await postCollection.updateOne(
    { _id: incident.restaurantId },
    {
      $set: {
        incidentOccurred: counter
      }
    }
  )

  if (updatedCountRest.modifiedCount === 0) throw 'Could not update incident counter for the specified restaurant.';

  //push incident id to users -JM
  const userCollection = await users();

  const updatedIncidentUser = await userCollection.updateOne(
    { _id: new ObjectId(reporterId) },
    {
      $push: {
        comments: insertInfo.insertedId
      }
    }
  );

  if (updatedIncidentUser.modifiedCount === 0) throw 'Could not update user with incident comments.';

  return { ...incident, _id: insertInfo.insertedId };
};

export const getAllIncidents = async () => {
  const collection = await safetyIncidents();
  return await collection.find({}).toArray();
};

export const updateIncidentStatus = async (incidentId, newStatus) => {
  const collection = await safetyIncidents();
  const updated = await collection.findOneAndUpdate(
    { _id: new ObjectId(incidentId) },
    { $set: { status: newStatus } },
    { returnDocument: 'after' }
  );
  return updated.value;
};

const incidentsFuncs = {
  reportIncident,
  getAllIncidents,
  updateIncidentStatus
}

export default incidentsFuncs;