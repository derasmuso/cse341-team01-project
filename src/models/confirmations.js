// src/models/confirmations.js

import { getDb } from '../db/connect.js';

const createConfirmation = async (confirmationData) => {
    return getDb().collection('confirmations').insertOne(confirmationData);
}

export { createConfirmation };