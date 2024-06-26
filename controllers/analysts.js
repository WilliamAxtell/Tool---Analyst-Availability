import {asyncWrapper} from '../middleware/async.js';
import { collectDashboardData } from '../functions/collect-dashboard-data.js';
import { filterStaff } from '../functions/holiday-fetch.js';

const getAllAnalysts = asyncWrapper(async (req, res) => {
    const onHoliday = await filterStaff();
    const paidAnalysts = await collectDashboardData(onHoliday, "pm");
    const socialAnalysts = await collectDashboardData(onHoliday, "ps");
    res.status(200).json({paidAnalysts, socialAnalysts});
});

export {getAllAnalysts};