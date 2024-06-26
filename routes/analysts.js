import express from 'express';
import { getAllAnalysts } from '../controllers/analysts.js';
const router = express.Router();

router.route('/').get(getAllAnalysts);

export {router};