import TicketClass from "./schemas/ticket-classes.js";

export async function getAllTicketClasses() {
    return TicketClass.find({}).lean();
}

export async function getTicketClassesForDay(day) {
    const normalizedDay = String(day).toLowerCase();
    const ticketClasses = await getAllTicketClasses();
    return ticketClasses.filter((ticketClass) =>
        !ticketClass.availableDays?.length || ticketClass.availableDays.includes(normalizedDay)
    );
}