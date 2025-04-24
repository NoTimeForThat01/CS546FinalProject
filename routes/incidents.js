import { Router } from 'express';
import { reportIncident, getAllIncidents, updateIncidentStatus } from '../data/incidents.js';

const router = Router();

// GET all incidents
router.get('/', async (req, res) => {
  try {
    const incidents = await getAllIncidents();
    res.render('incidents', { incidents });
  } catch (e) {
    res.status(500).render('error', { error: e.toString() });
  }
});

// POST new incident
router.post('/', async (req, res) => {
  try {
    const { reporterId, location, description, severity } = req.body;
    await reportIncident(reporterId, location, description, severity);
    res.redirect('/incidents');
  } catch (e) {
    res.status(400).render('error', { error: e.toString() });
  }
});

// PUT update status (optional)
router.post('/update', async (req, res) => {
  try {
    const { incidentId, newStatus } = req.body;
    await updateIncidentStatus(incidentId, newStatus);
    res.redirect('/incidents');
  } catch (e) {
    res.status(500).render('error', { error: e.toString() });
  }
});

export default router;

