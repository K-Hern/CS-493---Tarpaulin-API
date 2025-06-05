module.exports = {

  // Returns a boolean
  validateAgainstSchema: function (obj, schema) {
    return obj && Object.keys(schema).every(
      field => !schema[field].required || obj[field] != undefined
    );
  },

  extractValidFields: function (obj, schema) {
    let validObj = {};
    Object.keys(schema).forEach((field) => {
      if (obj[field] != undefined) {
        validObj[field] = obj[field];
      }
    });
    return validObj;
  }
};
