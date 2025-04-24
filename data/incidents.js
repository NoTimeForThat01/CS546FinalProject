
import { ObjectId } from 'mongodb';
import { safetyIncidents } from '../config/mongoCollections.js';

export const reportIncident = async (reporterId, location, description, severity) => {
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

  const collection = await safetyIncidents();
  const insertInfo = await collection.insertOne(incident);
  if (!insertInfo.acknowledged || !insertInfo.insertedId) throw 'Incident could not be created';

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
