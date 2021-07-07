/*
File: mongo.js
Author: Fabio Vitali
Version: 1.0 
Last change on: 10 April 2021


Copyright (c) 2021 by Fabio Vitali

   Permission to use, copy, modify, and/or distribute this software for any
   purpose with or without fee is hereby granted, provided that the above
   copyright notice and this permission notice appear in all copies.

   THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
   WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
   MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY
   SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
   WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION
   OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN
   CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.

*/

/* Dati di prova */

let fn = [
  "/public/data/oggetti.json",
  "/public/data/utenti.json",
  "/public/data/noleggi.json",
];
let dbname = "mydb";
let collection = ["oggetti", "utenti", "noleggi", "prenotazioni", "fatture"];
let fieldmodello = "modello";
let fieldcondition = "condizione";
let fieldtipo = "tipo";
let fieldprezzo = "prezzo";
let fieldmezzo = "mezzo";
let fielduser = "ruolo";
let available = "available";
let noleggiato = "noleggiato";
let birthday = "birthday"; // il primo valore è quello che verrà inserito nel db, il secondo è quello del form

const { MongoClient, Double } = require("mongodb");
const fs = require("fs").promises;
const template = require(global.rootDir + "/scripts/tpl.js");

// Carica dati esistenti
const mongouri =
  "mongodb+srv://max:Test1@cluster0.91v2a.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";

exports.create = async function (credentials) {
  const mongo = new MongoClient(mongouri, { useUnifiedTopology: true });
  //const mongouri = `mongodb://${credentials.user}:${credentials.pwd}@${credentials.site}?writeConcern=majority`;

  let debug = [];
  try {
    debug.push(
      `Trying to connect to MongoDB with user: '${credentials.user}' and site: '${credentials.site}' and a ${credentials.pwd.length}-character long password...`
    );
    await mongo.connect();
    debug.push("... managed to connect to MongoDB.");

    for (let i = 0; i < fn.length; i++) {
      debug.push(`Trying to read file '${fn[i]}'... `);
    }

    let doc = await fs.readFile(rootDir + fn[0], "utf8");
    let doc1 = await fs.readFile(rootDir + fn[1], "utf-8");
    let doc2 = await fs.readFile(rootDir + fn[2], "utf-8");
    let data = JSON.parse(doc);
    let data1 = JSON.parse(doc1);
    let data2 = JSON.parse(doc2);

    debug.push(`... read ${data.length} records successfully. `);

    debug.push(`Trying to remove all records in table '${dbname}'... `);
    let cleared = await mongo.db(dbname).collection(collection[0]).deleteMany();
    let cleared1 = await mongo
      .db(dbname)
      .collection(collection[1])
      .deleteMany();
    let cleared2 = await mongo
      .db(dbname)
      .collection(collection[2])
      .deleteMany();

    debug.push(`... ${cleared?.result?.n || 0} records deleted.`);
    debug.push(`... ${cleared1?.result?.n || 0} records deleted.`);
    debug.push(`... ${cleared2?.result?.n || 0} records deleted.`);

    debug.push(
      `Trying to add ${data.length} new records to ${collection[0]} collection... `
    );

    let added = await mongo
      .db(dbname)
      .collection(collection[0])
      .insertMany(data);

    let added1 = await mongo
      .db(dbname)
      .collection(collection[1])
      .insertMany(data1);

    let added2 = await mongo
      .db(dbname)
      .collection(collection[2])
      .insertMany(data2);

    debug.push(`... ${added?.result?.n || 0} records added.`);
    debug.push(`... ${added1?.result?.n || 0} records added.`);
    debug.push(`... ${added2?.result?.n || 0} records added.`);

    await mongo.close();
    debug.push("Managed to close connection to MongoDB.");

    return {
      message: `<h1>Removed ${cleared?.result?.n || 0} records of collection: ${
        collection[0]
      }, added ${added?.result?.n || 0} records to collection: ${
        collection[0]
      }</h1>`,
      debug: debug,
    };
  } catch (e) {
    e.debug = debug;
    return e;
  }
};

exports.search = async function (q, credentials) {
  //const mongouri = `mongodb://${credentials.user}:${credentials.pwd}@${credentials.site}?writeConcern=majority`;

  let query = {};
  let debug = [];
  let data = { query: q[fieldmodello], result: null };

  try {
    debug.push(
      `Trying to connect to MongoDB with user: '${credentials.user}' and site: '${credentials.site}' and a ${credentials.pwd.length}-character long password...`
    );
    const mongo = new MongoClient(mongouri, { useUnifiedTopology: true });
    await mongo.connect();
    debug.push("... managed to connect to MongoDB.");

    debug.push(`Trying to query MongoDB with query '${q[fieldmodello]}'... `);
    let result = [];
    query[fieldmodello] = { $regex: q[fieldmodello], $options: "i" };
    await mongo
      .db(dbname)
      .collection(collection[0])
      .find(query)
      .forEach((r) => {
        result.push(r);
      });
    debug.push(`... managed to query MongoDB. Found ${result.length} results.`);

    data.result = result;

    await mongo.close();
    debug.push("Managed to close connection to MongoDB.");

    data.debug = debug;
    if (q.ajax) {
      return data;
    } else {
      var out = await template.generate("mongo.html", data);
      return out;
    }
  } catch (e) {
    data.debug = debug;
    data.error = e;
    return data;
  }
};

/* Untested */
// https://stackoverflow.com/questions/39599063/check-if-mongodb-is-connected/39602781
exports.isConnected = async function () {
  let client = await MongoClient.connect(mongouri);
  return !!client && !!client.topology && client.topology.isConnected();
};

// Inserimento di un elemento da amministratore

exports.addElement = async function (q) {
  //console.log(q);

  const mongo = new MongoClient(mongouri, { useUnifiedTopology: true });
  await mongo.connect();

  var myObj = {
    mezzo: q.mezzo,
    condizione: q.condizione,
    tipo: q.tipo,
    modello: q.modello,
    prezzo: q.prezzo,
    available: "on",
    noleggiato: "off",
  };

  console.log(myObj);
  await mongo.db(dbname).collection(collection[0]).insertOne(myObj);
  console.log("Inserito");
  await mongo.close();
};

exports.deleteElement = async function (q) {
  const mongo = new MongoClient(mongouri, { useUnifiedTopology: true });
  await mongo.connect();

  var query = {};

  query[fieldmodello] = { $regex: q[fieldmodello], $options: "i" };
  query[fieldmezzo] = { $regex: q[fieldmezzo], $options: "i" };
  query[fieldcondition] = { $regex: q[fieldcondition], $options: "i" };
  query[fieldtipo] = { $regex: q[fieldtipo], $options: "i" };
  noleggiato = { $regex: "off", $options: "i" };

  await mongo.db(dbname).collection(collection[0]).findOneAndDelete(query);

  console.log("Rimosso");
  await mongo.close();
};

exports.updateElement = async function (q) {
  const mongo = new MongoClient(mongouri, { useUnifiedTopology: true });
  await mongo.connect();

  var query = {};

  query[fieldmodello] = { $regex: q[fieldmodello], $options: "i" };
  query[fieldmezzo] = { $regex: q[fieldmezzo], $options: "i" };
  query[fieldcondition] = { $regex: q[fieldcondition], $options: "i" };
  query[fieldtipo] = { $regex: q[fieldtipo], $options: "i" };
  query[fieldprezzo] = { $regex: q[fieldprezzo.toString()] };

  var newvalues = {
    $set: {
      mezzo: q.mezzoN,
      condizione: q.condizioneN,
      modello: q.modelloN,
      prezzo: q.prezzoN,
      tipo: q.tipoN,
      available: "on",
    },
  };
  mongo
    .db(dbname)
    .collection(collection[0])
    .findOneAndUpdate(query, newvalues, function (err) {
      if (err) throw err;
      console.log("Oggetto aggiornato");
      mongo.close();
    });
};

exports.insertCliente = async function (q) {
  const mongo = new MongoClient(mongouri, { useUnifiedTopology: true });
  await mongo.connect();

  var myObj = q;

  await mongo.db(dbname).collection(collection[1]).insertOne(myObj);
  console.log("Cliente aggiunto");

  await mongo.close();
};

exports.deleteCliente = async function (q) {
  console.log(q);
  const mongo = new MongoClient(mongouri, { useUnifiedTopology: true });
  await mongo.connect();

  await mongo.db(dbname).collection(collection[1]).deleteOne(q);
  console.log("Cliente rimosso");
  await mongo.close();
};

exports.updateCliente = async function (q) {
  const mongo = new MongoClient(mongouri, { useUnifiedTopology: true });
  await mongo.connect();

  var myquery = { username: q.username, ruolo: q.ruolo };

  var newvalues = { $set: { username: q.usernameNew, ruolo: q.ruoloNew } };

  mongo
    .db(dbname)
    .collection(collection[1])
    .findOneAndUpdate(myquery, newvalues, function (err) {
      if (err) throw err;
      console.log("Cliente aggiornato");
      mongo.close();
    });
};

exports.stampaOggetti = async function (q, credentials) {
  //const mongouri = `mongodb://${credentials.user}:${credentials.pwd}@${credentials.site}?writeConcern=majority`;

  let result = [];
  let data = [];
  let debug = [];
  let query = {};
  const mongo = new MongoClient(mongouri, { useUnifiedTopology: true });
  query[fieldmezzo] = { $regex: q[fieldmezzo], $options: "i" };
  await mongo.connect();

  await mongo
    .db(dbname)
    .collection(collection[0])
    .find(query)
    .forEach((r) => {
      result.push(r);
    });

  data.result = result;
  var out = await template.generate("catalogo.html", data);
  return out;
};

exports.stampaClienti = async function (q, credentials) {
  //const mongouri = `mongodb://${credentials.user}:${credentials.pwd}@${credentials.site}?writeConcern=majority`;

  let result = [];
  let data = [];
  let debug = [];
  let query = {};
  const mongo = new MongoClient(mongouri, { useUnifiedTopology: true });
  query[fielduser] = { $regex: q[fielduser], $options: "i" };
  await mongo.connect();

  await mongo
    .db(dbname)
    .collection(collection[1])
    .find(query)
    .forEach((r) => {
      result.push(r);
    });

  data.result = result;
  var out = await template.generate("listaclienti.html", data);
  return out;
};

exports.stampaDisponibili = async function (q, credentials) {
  //const mongouri = `mongodb://${credentials.user}:${credentials.pwd}@${credentials.site}?writeConcern=majority`;

  let result = [];
  let data = [];
  let query = {};
  const mongo = new MongoClient(mongouri, { useUnifiedTopology: true });
  query[available] = { $regex: "on", $options: "i" };
  await mongo.connect();

  await mongo
    .db(dbname)
    .collection(collection[0])
    .find(query)
    .forEach((r) => {
      result.push(r);
    });

  data.result = result;
  var out = await template.generate("catalogo.html", data);
  return out;
};

exports.updateDisp = async function (q) {
  const mongo = new MongoClient(mongouri, { useUnifiedTopology: true });
  await mongo.connect();

  var query = {};

  query[fieldmodello] = { $regex: q[fieldmodello], $options: "i" };
  query[fieldmezzo] = { $regex: q[fieldmezzo], $options: "i" };
  query[fieldcondition] = { $regex: q[fieldcondition], $options: "i" };
  query[fieldtipo] = { $regex: q[fieldtipo], $options: "i" };
  //query[fieldprezzo] = { $regex: q[fieldprezzo], $options: "i" };

  var newvalues = {
    $set: {
      available: "off",
    },
  };

  mongo
    .db(dbname)
    .collection(collection[0])
    .findOneAndUpdate(query, newvalues, function (err) {
      if (err) throw err;
      console.log("Oggetto aggiornato");
      mongo.close();
    });
};

exports.noleggiDisponibili = async function (credentials) {
  //const mongouri = `mongodb://${credentials.user}:${credentials.pwd}@${credentials.site}?writeConcern=majority`;

  let result = [];
  let data = [];
  const mongo = new MongoClient(mongouri, { useUnifiedTopology: true });

  await mongo.connect();

  await mongo
    .db(dbname)
    .collection(collection[2])
    .find()
    .forEach((r) => {
      result.push(r);
    });

  data.result = result;
  var out = await template.generate("noleggi.html", data);
  return out;
};

exports.prenotazioni = async function (credentials) {
  //const mongouri = `mongodb://${credentials.user}:${credentials.pwd}@${credentials.site}?writeConcern=majority`;

  let result = [];
  let data = [];
  const mongo = new MongoClient(mongouri, { useUnifiedTopology: true });

  await mongo.connect();

  await mongo
    .db(dbname)
    .collection(collection[3])
    .find()
    .forEach((r) => {
      result.push(r);
    });

  data.result = result;
  var out = await template.generate("prenotazioni.html", data);
  return out;
};

exports.fatture = async function (credentials) {
  //const mongouri = `mongodb://${credentials.user}:${credentials.pwd}@${credentials.site}?writeConcern=majority`;

  let result = [];
  let data = [];
  const mongo = new MongoClient(mongouri, { useUnifiedTopology: true });

  await mongo.connect();

  await mongo
    .db(dbname)
    .collection(collection[4])
    .find()
    .forEach((r) => {
      result.push(r);
    });

  data.result = result;
  var out = await template.generate("fatture.html", data);
  return out;
};

exports.dateNoleggio = async function (q) {
  //console.log(q);

  const mongo = new MongoClient(mongouri, { useUnifiedTopology: true });
  await mongo.connect();

  await mongo.db(dbname).collection(collection[2]).insertOne(q);
  console.log("Inserito");
  await mongo.close();
};
