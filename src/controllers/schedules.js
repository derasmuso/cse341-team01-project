import { getSchedulesByTripId } from "../models/schedules.js";

export const getSchedulesForTrip = async (req , res)=>{
    try{
        const{id}= req.params;
         const schedule = await getSchedulesByTripId(id);
         return res.status(200).json(schedule);
    }catch(error){
        console.error("Error fetching schedules:", error);

        return res.status(500).json({
            error: "Failed to fetch schedules",
        });
    }

}

export const getSchedulesForTripAndMonth = async(req , res)=>{
    const{id}= req.params;
    const{month}= req.query;

    try{
        const schedules= await getSchedulesByTripId(id, month);
        return res.status(200). json(schedules);
    }catch(error){
        console.error("Error fetching schedules:", error);

        return res.status(500).json({
            error: "Failed to fetch schedules",
        });
    }
}

