import { getAnalysts } from './maol-fetch.js';
import { sendEmail } from './email.js';

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

  export { buildSendList };