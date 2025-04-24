import userRoutes from './users.js';
import postRoutes from './posts.js';
import reviewRoutes from './reviews.js';
import incidentRoutes from './incidents.js';
//import authRoutes from './auth.js';
import express from 'express';

const constructorMethod = (app) => {
    app.use(express.json()); 

    app.use('/', userRoutes);
    app.use('/posts', postRoutes);
    app.use('/reviews', reviewRoutes);     // ✅ NEW
    app.use('/incidents', incidentRoutes); // ✅ NEW

    app.use(/(.*)/, (req, res) => {
        return res.status(404).render('error', {
            statusCode: 404,
            message: 'Page not found'
        });
    });
};

export default constructorMethod; //This was missing -DA