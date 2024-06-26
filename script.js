import console from './logger.js';
import { filterStaff } from './functions/holiday-fetch.js';
import {router} from './routes/analysts.js';
import { buildSendList } from './functions/build-sendlist.js';
import schedule from 'node-schedule';
import express from 'express';

const app = express();
const port = process.env.PORT || 3000;

// middleware
app.use(express.json());

// routes
app.use('/api/v1/get-analysts', router);


const start = async () => {
  try {
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
    schedule.scheduleJob({hour: 8, minute: 30}, async () => {
      const onHoliday = await filterStaff();
      buildSendList(onHoliday, "pm");
      buildSendList(onHoliday, "ps");
      console.log("job scheduled");
    });
    console.log("scheduler running");
  } catch (error) {
    console.log(error);
  }
}

start();
