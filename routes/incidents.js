import { Router } from 'express';
import { reportIncident, getAllIncidents, updateIncidentStatus } from '../data/incidents.js';
import userFunctions from '../data/users.js';
import xss from 'xss';

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
    //User must be logged in to post and incident
    if (!req.session.user || (req.session.user.role !== 'admin' && req.session.user.role !== 'user')) {
      return res.status(403).render('error', {
        error: 'Access Denied',
        statusCode: 403,
        message: 'You must be logged in to leave a review.'
      });
    }

    const user = req.session.user;

    const reporterId = await userFunctions.getUserById(user._id);

    const restaurantId = req.body.restaurantId ? xss(req.body.restaurantId) : null;///
    //const reporterId = xss(req.body.reporterId);
    const location = xss(req.body.location);
    const description = xss(req.body.description);
    const severity = xss(req.body.severity);
    await reportIncident(reporterId._id, location, description, severity, restaurantId);
    if (restaurantId) {
      res.redirect(`/posts`);
    } else {
      res.redirect('/');
    }
  } catch (e) {
    res.status(400).render('error', { error: e.toString() });
  }
});

// PUT update status (optional)
router.post('/update', async (req, res) => {
  try {
    const incidentId = xss(req.body.incidentId);///
    const newStatus = xss(req.body.newStatus);////
    await updateIncidentStatus(incidentId, newStatus);
    res.redirect('/incidents');
  } catch (e) {
    res.status(500).render('error', { error: e.toString() });
  }
});

export default router;

