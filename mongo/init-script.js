db = db.getSiblingDB('pars');
db.myCollection.createIndex({ fieldName: 1 });