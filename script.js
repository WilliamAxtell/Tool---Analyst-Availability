import console from './logger.js';
import { filterStaff } from './functions/holiday-fetch.js';
import { getAnalysts } from './functions/maol-fetch.js';
import { sendEmail } from './functions/email.js';
import schedule from 'node-schedule';

// Builds the list of client who have no anaylst on duty
const buildSendList = async (onHoliday, media) => {
  let sendList = ``;

  const clientAnalysts = await getAnalysts(media);
  //console.log(clientAnalysts);

  for (const client in clientAnalysts) {
    let score = 0;
    for (let i = 0; i < clientAnalysts[client].length; i++) {
      if (onHoliday.includes(clientAnalysts[client][i]) || clientAnalysts[client][i] == "") {
        score++;
      }
    }
    if (score == clientAnalysts[client].length) {
      sendList += `<li>${client}</li>`;
    }
  }
  
  if (sendList != ``) {
    sendEmail(sendList, media);
  } else {
    console.log("No alert needed today");
  }
}

console.log("scheduler running");

const j = schedule.scheduleJob({hour: 8, minute: 30}, async () => {
   const onHoliday = await filterStaff();
   buildSendList(onHoliday, "pm");
   buildSendList(onHoliday, "ps");
   console.log("job scheduled");
 });

// Test function to check if the email is being sent correctly
// const testSend = async () => {
//     //const onHoliday = await filterStaff();
//     const onHoliday = ["Zak Pashen", "Nabil Miah"];
//     buildSendList(onHoliday, "pm");
//     buildSendList(onHoliday, "ps");
// }
// testSend();
