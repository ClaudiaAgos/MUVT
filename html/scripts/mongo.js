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
let collection = ["oggetti", "utenti", "noleggi"];
let fieldname = "modello";

const { MongoClient, Double } = require("mongodb");
const fs = require("fs").promises;
const template = require(global.rootDir + "/scripts/tpl.js");

// Carica dati esistenti

exports.create = async function (credentials) {
  //const mongouri = `mongodb://${credentials.user}:${credentials.pwd}@${credentials.site}?writeConcern=majority`;
  const mongouri =
    "mongodb+srv://max:Test1@cluster0.91v2a.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";

  let debug = [];
  try {
    debug.push(
      `Trying to connect to MongoDB with user: '${credentials.user}' and site: '${credentials.site}' and a ${credentials.pwd.length}-character long password...`
    );
    const mongo = new MongoClient(mongouri, { useUnifiedTopology: true });
    await mongo.connect();
    debug.push("... managed to connect to MongoDB.");

    for (let i = 0; i < fn.length; i++) {
      debug.push(`Trying to read file '${fn[i]}'... `);
    }

    let doc = await fs.readFile(rootDir + fn[0], "utf8");
    let doc1 = await fs.readFile(rootDir + fn[1], "utf-8");
    let data = JSON.parse(doc);
    let data1 = JSON.parse(doc1);

    debug.push(`... read ${data.length} records successfully. `);

    debug.push(`Trying to remove all records in table '${dbname}'... `);
    let cleared = await mongo.db(dbname).collection(collection[0]).deleteMany();
    let cleared1 = await mongo
      .db(dbname)
      .collection(collection[1])
      .deleteMany();

    debug.push(`... ${cleared?.result?.n || 0} records deleted.`);
    debug.push(`... ${cleared1?.result?.n || 0} records deleted.`);

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

    debug.push(`... ${added?.result?.n || 0} records added.`);
    debug.push(`... ${added1?.result?.n || 0} records added.`);

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
  const mongouri =
    "mongodb+srv://max:Test1@cluster0.91v2a.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";

  let query = {};
  let debug = [];
  let data = { query: q[fieldname], result: null };

  try {
    debug.push(
      `Trying to connect to MongoDB with user: '${credentials.user}' and site: '${credentials.site}' and a ${credentials.pwd.length}-character long password...`
    );
    const mongo = new MongoClient(mongouri, { useUnifiedTopology: true });
    await mongo.connect();
    debug.push("... managed to connect to MongoDB.");

    debug.push(`Trying to query MongoDB with query '${q[fieldname]}'... `);
    let result = [];
    query[fieldname] = { $regex: q[fieldname], $options: "i" };
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
  const mongouri =
    "mongodb+srv://max:Test1@cluster0.91v2a.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
  const mongo = new MongoClient(mongouri, { useUnifiedTopology: true });
  await mongo.connect();

  var myObj = q;

  await mongo.db(dbname).collection(collection[0]).insertOne(myObj);
  console.log("Inserito");
  await mongo.close();
};

exports.deleteElement = async function (q) {
  console.log(q);
  const mongouri =
    "mongodb+srv://max:Test1@cluster0.91v2a.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
  const mongo = new MongoClient(mongouri, { useUnifiedTopology: true });
  await mongo.connect();

  await mongo.db(dbname).collection(collection[0]).findOneAndDelete(q);

  console.log("Rimosso");
  await mongo.close();
};

exports.updateElement = async function (q) {
  const mongouri =
    "mongodb+srv://max:Test1@cluster0.91v2a.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
  const mongo = new MongoClient(mongouri, { useUnifiedTopology: true });
  await mongo.connect();

  mongo
    .db(dbname)
    .collection(collection[0])
    .findOneAndUpdate(myquery, newvalues, function (err) {
      if (err) throw err;
      console.log("Oggetto aggiornato");
      mongo.close();
    });
};

exports.insertCliente = async function (q) {
  console.log(q);
  const mongouri =
    "mongodb+srv://max:Test1@cluster0.91v2a.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
  const mongo = new MongoClient(mongouri, { useUnifiedTopology: true });
  await mongo.connect();

  var myObj = q;

  await mongo.db(dbname).collection(collection[1]).insertOne(myObj);

  await mongo.close();
};

exports.deleteCliente = async function (q) {
  console.log(q);
  const mongouri =
    "mongodb+srv://max:Test1@cluster0.91v2a.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
  const mongo = new MongoClient(mongouri, { useUnifiedTopology: true });
  await mongo.connect();

  await mongo.db(dbname).collection(collection[1]).deleteOne(q);
  console.log("Cliente rimosso");
  await mongo.close();
};

exports.updateCliente = async function (q) {
  const mongouri =
    "mongodb+srv://max:Test1@cluster0.91v2a.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
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
