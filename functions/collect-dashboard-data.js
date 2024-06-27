import { getAnalysts } from './maol-fetch.js';

// Builds the list of client who have no anaylst on duty
const collectDashboardData = async (onHoliday, media) => {
    let dashBoardData = [];
  
    const clientAnalysts = await getAnalysts(media);
    //console.log(clientAnalysts);
  
    for (const client in clientAnalysts) {
      let score = 0;
      let analystArr = [];
      for (let i = 0; i < clientAnalysts[client].length; i++) {
        if (onHoliday.includes(clientAnalysts[client][i]) || clientAnalysts[client][i] == "") {
          score++;
          analystArr.push([clientAnalysts[client][i], true]);
        } else {
          analystArr.push([clientAnalysts[client][i], false]);     
        }
      }
      if (score == clientAnalysts[client].length) {
        dashBoardData.push({client: client, analysts: analystArr, status: "No Analyst On Duty"});
      } else if (onHoliday.includes(clientAnalysts[client][0])) {
        dashBoardData.push({client: client, analysts: analystArr, status: "Primary Analyst OOO"});
      }
    }
    
    return dashBoardData;
  }

  export { collectDashboardData };