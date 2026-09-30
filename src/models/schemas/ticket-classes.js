import mongoose from 'mongoose';

const ticketClassSchema = new mongoose.Schema(
  {
    class: {
      type: String,
      enum: ['standard', 'premium', 'first'],
      required: true,
      unique: true
    },

    pricePerKm: {
      type: Number,
      required: true,
      min: 0
    },

    amenities: {
      type: [String],
      required: true
    },

    description: {
      type: String,
      required: true
    },

    availableDays: {
      type: [String],
      enum: [
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
        'sunday'
      ],
      required: true
    }
  },
  {
    collection: 'ticketClasses'
  }
);

export default mongoose.model('TicketClass', ticketClassSchema);