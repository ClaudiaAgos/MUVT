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
  "/public/data/prenotazioni.json",
];
let dbname = "mydb";
let collection = [
  "oggetti",
  "utenti",
  "noleggi",
  "prenotazioni",
  "fatture",
  "login",
];
let fieldmodello = "modello";
let fieldcondition = "condizione";
let fieldtipo = "tipo";
let fieldprezzo = "prezzo";
let fieldmezzo = "mezzo";
let fielduser = "ruolo";
let available = "available";
let noleggiato = "noleggiato";
let fieldbici = "bici";
let user = "username";
let active = "active";
let bici = "bici";

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
    let doc3 = await fs.readFile(rootDir + fn[3], "utf-8");

    let data = JSON.parse(doc);
    let data1 = JSON.parse(doc1);
    let data2 = JSON.parse(doc2);
    let data3 = JSON.parse(doc3);

    debug.push(`... read ${data.length} records successfully. `);

    debug.push(`Trying to remove all records in table '${dbname}'... `);
    let cleared = await mongo.db(dbname).collection(collection[0]).deleteMany();
    let cleared1 = await mongo
      .db(dbname)
      .collection(collection[1])
      .deleteMany();

    /*let cleared2 = await mongo
      .db(dbname)
      .collection(collection[2])
      .deleteMany();*/

    let cleared3 = await mongo
      .db(dbname)
      .collection(collection[3])
      .deleteMany();

    debug.push(`... ${cleared?.result?.n || 0} records deleted.`);
    debug.push(`... ${cleared1?.result?.n || 0} records deleted.`);
    //debug.push(`... ${cleared2?.result?.n || 0} records deleted.`);
    debug.push(`... ${cleared3?.result?.n || 0} records deleted.`);

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

    let added3 = await mongo
      .db(dbname)
      .collection(collection[3])
      .insertMany(data3);

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
  var pippo = new Date(q.dataI);
  var fine = new Date(q.dataF);
  var myObj = {
    mezzo: q.mezzo,
    condizione: q.condizione,
    tipo: q.tipo,
    modello: q.modello,
    prezzo: q.prezzo,
    available: "on",
    noleggiato: "off",
    date: [
      {
        dateinit: pippo,
        datefinish: fine,
      },
      {
        dateinit: pippo,
        datefinish: fine,
      },
    ],
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
  query[noleggiato] = { $regex: "off", $options: "i" };

  await mongo.db(dbname).collection(collection[0]).findOneAndDelete(query);
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
  query[fieldmodello] = { $regex: q[fieldmodello], $options: "i" };

  await mongo.connect();

  var c = await mongo
    .db(dbname)
    .collection(collection[0])
    .find({
      $and: [
        { available: "on" },
        { modello: q.modello },
        {
          date: {
            $not: {
              $elemMatch: {
                dateinit: {
                  $lt: new Date(q.dataI),
                  $lt: new Date(q.dataF),
                },
                datefinish: {
                  $gt: new Date(q.dataI),
                  $gt: new Date(q.dataF),
                },
              },
            },
          },
        },
      ],
    })
    .forEach((r) => result.push(r));

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

// prenotazioni personali
exports.prenotazioni = async function (q) {
  //const mongouri = `mongodb://${credentials.user}:${credentials.pwd}@${credentials.site}?writeConcern=majority`;

  let result = [];
  let data = {};
  const mongo = new MongoClient(mongouri, { useUnifiedTopology: true });

  await mongo.connect();

  // cerco il cliente attivo
  var test1 = await mongo
    .db(dbname)
    .collection(collection[1])
    .find({ active: "on" })
    .limit(1)
    .toArray();

  try {
    await mongo.db(dbname).collection(collection[3]).insertMany(test1);
  } catch (e) {
    console.log(e);
  }

  // in questo modo le stampa tutte
  await mongo
    .db(dbname)
    .collection(collection[3])
    .find({ active: "on" })
    .forEach((r) => {
      result.push(r);
    });

  data.result = result;
  var out = await template.generate("prenotazioniPersonali.html", data);
  return out;
};

exports.prenotazioniOperatore = async function (q) {
  //const mongouri = `mongodb://${credentials.user}:${credentials.pwd}@${credentials.site}?writeConcern=majority`;

  let result = [];
  let data = {};
  const mongo = new MongoClient(mongouri, { useUnifiedTopology: true });

  await mongo.connect();

  // ottengo in stampa le prenotazioni dell'utente attivo
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

// verifica se il cliente è presente nel db, se si allora setta il campo active a on
// questo campo sarà utile per pushare il cliente attivo, la bicicletta e le date in prenotazioni
exports.cercaCli = async function (q) {
  const mongo = new MongoClient(mongouri, { useUnifiedTopology: true });
  await mongo.connect();
  let c = false;
  let b = false;

  let query = {};
  query[user] = { $regex: q[user], $options: "i" };

  var newvalues = {
    $set: {
      active: "on",
    },
  };
  await mongo
    .db(dbname)
    .collection(collection[1])
    .findOneAndUpdate(query, newvalues);
  c = await mongo.db(dbname).collection(collection[1]).find(query).toArray();

  if (Array.isArray(c) && c.length) {
    b = true;
  } else {
    b = false;
  }

  await mongo.close();

  return b;
};

// mi pusha le date nei clienti
exports.insertdate = async function (q) {
  const mongo = new MongoClient(mongouri, { useUnifiedTopology: true });
  await mongo.connect();

  var pippo = new Date(q.start);
  var fine = new Date(q.end);
  var dif = (fine - pippo) / 3600 / 1000;
  var diff = Math.floor(dif);

  var query = {};
  let result = [];
  let data = [];
  query[fieldmodello] = { $regex: q[bici], $options: "i" };

  // prende la bici in input e le date
  var newvalues = {
    $push: {
      date: [
        {
          dateinit: pippo,
          datefinish: fine,
        },
        {
          dateinit: pippo,
          datefinish: fine,
        },
      ],
      bicicletta: q.bici,
    },
  };

  // cerco il cliente attivo e aggiorno i campi bicicletta e date
  // ottengo il cliente con le relative prenotazioni
  var test = await mongo
    .db(dbname)
    .collection(collection[1])
    .findOneAndUpdate({ active: "on" }, newvalues);

  console.log(test.value.username);

  // controllo se esiste già un utente con quel nome nella collezione "prenotazioni", se esiste allora aggiorna i valori
  var test = await mongo
    .db(dbname)
    .collection(collection[3])
    .findOneAndUpdate({ username: test.value.username }, newvalues);

  // devo pushare le date anche nella bicicleta
  // cerco la bicicletta nella collezione 0 e la aggiorno
  var pippo = await mongo
    .db(dbname)
    .collection(collection[0])
    .findOneAndUpdate(query, {
      $push: {
        date: {
          dateinit: new Date(q.start),
        },
      },
    });
};

// ricerca le bici disponibili nelle date inserite
exports.stampadate = async function (q, credentials) {
  //const mongouri = `mongodb://${credentials.user}:${credentials.pwd}@${credentials.site}?writeConcern=majority`;

  let result = [];
  let data = [];

  const mongo = new MongoClient(mongouri, { useUnifiedTopology: true });

  await mongo.connect();

  await mongo
    .db(dbname)
    .collection(collection[0])
    .find({
      $and: [
        { available: "on" },
        { modello: q.modello },
        {
          $or: [
            {
              $and: [
                { dateinit: { $gt: new Date(q.inizio) } },
                { dateinit: { $gt: new Date(q.fine) } },
              ],
            },
            {
              $and: [
                { datefinish: { $lt: new Date(q.inizio) } },
                { datefinish: { $lt: new Date(q.fine) } },
              ],
            },
          ],
        },
      ],
    })
    .forEach((r) => {
      result.push(r);
    });

  console.log(result);
  data.result = result;
  var out = await template.generate("noleggi.html", data);
  return out;
};

exports.logout = async function (q) {
  //const mongouri = `mongodb://${credentials.user}:${credentials.pwd}@${credentials.site}?writeConcern=majority`;

  const mongo = new MongoClient(mongouri, { useUnifiedTopology: true });
  await mongo.connect();
  let c = false;
  let b = false;

  var newvalues = {
    $set: {
      active: "off",
    },
  };
  // cerco il cliente attivo e lo setto su off

  c = await mongo
    .db(dbname)
    .collection(collection[1])
    .find({ active: "on" })
    .toArray();

  await mongo
    .db(dbname)
    .collection(collection[1])
    .findOneAndUpdate({ active: "on" }, newvalues);
  await mongo
    .db(dbname)
    .collection(collection[3])
    .findOneAndUpdate({ active: "on" }, newvalues);

  if (Array.isArray(c) && c.length) {
    b = true;
  } else {
    b = false;
  }
  mongo.close();
  return b;
};

exports.catalogo = async function (q, credentials) {
  //const mongouri = `mongodb://${credentials.user}:${credentials.pwd}@${credentials.site}?writeConcern=majority`;

  let result = [];
  let data = [];
  let query = {};
  const mongo = new MongoClient(mongouri, { useUnifiedTopology: true });
  query[fieldmodello] = { $regex: q[fieldmodello], $options: "i" };

  await mongo.connect();

  await mongo
    .db(dbname)
    .collection(collection[1])
    .find({ active: "on" })
    .forEach((r) => result.push(r));

  data.result = result;
  var out = await template.generate("catalogo.html", data);
  return out;
};

exports.catalogoTutti = async function (q, credentials) {
  //const mongouri = `mongodb://${credentials.user}:${credentials.pwd}@${credentials.site}?writeConcern=majority`;

  let result = [];
  let data = [];
  let query = {};
  const mongo = new MongoClient(mongouri, { useUnifiedTopology: true });
  query[fieldmodello] = { $regex: q[fieldmodello], $options: "i" };

  await mongo.connect();

  await mongo
    .db(dbname)
    .collection(collection[0])
    .find(query)
    .forEach((r) => result.push(r));

  data.result = result;
  var out = await template.generate("catalogo.html", data);
  return out;
};

exports.updateOggetto = async function (q) {
  //quando clicco su prenota allora le date vanno pushate nell'oggetto
  const mongo = new MongoClient(mongouri, { useUnifiedTopology: true });
  await mongo.connect();

  //nel momento in cui inserisco la bicicletta e le date, effettuo una find nella collezione 0 e pusho le date nel campo date

  console.log(q);
};
