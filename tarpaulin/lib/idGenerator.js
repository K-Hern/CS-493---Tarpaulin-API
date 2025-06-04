const { getDbReference } = require('./mongo');

async function getNextSequenceValue(sequenceName) {
  const db = getDbReference();
  const result = await db.collection('counters').findOneAndUpdate(
    { _id: sequenceName },
    { $inc: { sequenceValue: 1 } },
    { 
      returnDocument: 'after',
      upsert: true
    }
  );
  return result.value.sequenceValue;
}

module.exports = { getNextSequenceValue };
