import { getAllTicketClasses as findAllTicketClasses, getTicketClassesForDay as findTicketClassesForDay } from "../models/ticket-classes.js";

export async function getAllTicketClasses(req, res) {
    try {
        return res.status(200).json(await findAllTicketClasses());
    } catch (error) {
        console.error("Error fetching ticket classes:", error);
        return res.status(500).json({ error: "Failed to fetch ticket classes" });
    }
}

export async function getTicketClassesForDay(req, res) {
    const { day } = req.query;
    if (!day || !["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].includes(String(day).toLowerCase())) {
        return res.status(400).json({ error: "A valid day of the week is required" });
    }
    try {
        return res.status(200).json(await findTicketClassesForDay(day));
    } catch (error) {
        console.error("Error fetching ticket classes:", error);
        return res.status(500).json({ error: "Failed to fetch ticket classes" });
    }
}