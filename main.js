const TelegramBot = require("node-telegram-bot-api");
const moment = require("moment");
const mySql = require("mysql");
const axios = require("axios");

const con = mySql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  port: 3306,
  database: "dompet_cerdas"
});
con.connect((err) => {
  if (err) {
    console.log(`err.stack: ${err.stack}`);
  }
  console.log(`connected as id ${con.threadId}`);
  con.query(`CREATE TABLE IF NOT EXISTS users (id INT AUTO_INCREMENT, chatId INT, name VARCHAR(255), password VARCHAR(255), time_stamp DATETIME, PRIMARY KEY (id))`, (err, result) => {
    if (err) throw err;
    console.log(result);
  })
  con.query(`CREATE TABLE IF NOT EXISTS pemasukans (id INT AUTO_INCREMENT, user_id VARCHAR(255), nominal INT, description VARCHAR(255), time DATETIME, PRIMARY KEY (id))`, (err, result) => {
    if (err) throw err;
    console.log(result);
  })
  con.query(`CREATE TABLE IF NOT EXISTS pengeluarans (id INT AUTO_INCREMENT, user_id VARCHAR(255), nominal INT, description VARCHAR(255), time DATETIME, PRIMARY KEY (id))`, (err, result) => {
    if (err) throw err;
    console.log(result);
  })

});

const chekUser = (chatId, callback) => {
  con.query(`SELECT * FROM users WHERE chatId = ?`, [chatId], (err, result) => {
    if (err) {
      callback(err, null)
      return
    }

    if (result.length > 0) {
      callback(null, true)
    } else {
      callback(null, false)
    }
  })
}

const addUser = (chatId, name, password, callback) => {
  con.query(`INSERT INTO users (chatId, name, password, time_stamp) VALUES (?, ?, ?, NOW())`, [chatId, name, password], (err, result) => {
    if (err) {
      callback(err, null)
      return
    }
    callback(null, true)
  })
}

const urlAPi = "http://127.0.0.1:8000/api/";
const Urlpemasukan = "pemasukan"
const urlPengeluaran = "pengeluaran"
const urlUser = "user"


const token = "TOKEN_BOT_TELEGRAM";
const options = {
  polling: true
};


const date = new Date();
const year = date.getFullYear();
const month = date.getMonth();
const day = date.getDate();

const myBot = new TelegramBot(token, options);
// Comand Bot
const prefix = "/";
const start = new RegExp(`^${prefix}start$`);
const lihatPemasukan = new RegExp(`^${prefix}lihat_pemasukan$`);
const tess = new RegExp(`^${prefix}tess$`);
const help = new RegExp(`^${prefix}help$`);


// Message Bot
myBot.onText(start, async (msg) => {
  const chatId = msg.chat.id;
  const name = msg.chat.first_name;
  chekUser(chatId, (err, result) => {
    if (err) {
      console.error("Error", err);
      return;
    }
    if (result) {
      pesan = `Selamat Datang ${name} \n \n Silahkan ketik /help untuk melihat fitur bot`;
      myBot.sendMessage(chatId, pesan);
    } else {
      addUser(chatId, name, '12345', (err, result) => {
        if (err) {
          console.error("Error", err);
          return;
        }
        myBot.sendMessage(chatId, `Selamat Datang ${name} \n \n Silahkan ketik /help untuk melihat fitur bot`);
      })
    }
  })
})

myBot.onText(tess, async (msg) => {
  const chatId = msg.chat.id;
  const name = msg.chat.first_name;
  const apiCall = await fetch(`${urlAPi}${urlPengeluaran}`);
  const data = await apiCall.json();
  let pesan = `Data Pengeluaran ${name} \n \n `;
  data.forEach((data) => {
    pesan += `${moment(data.time).format("dddd, DD-MM-YYYY")} => ${data.description} :  𝐑𝐩. ${data.nominal.toLocaleString("id-ID")} \n \n`;
  })
  let sum = data.reduce((total, data) => total + data.nominal, 0);
  pesan += `Total Semua Pengeluaran Anda sebesar :𝐑𝐩. ${sum.toLocaleString("id-ID")}`
  myBot.sendMessage(chatId, pesan);
})
myBot.onText(lihatPemasukan, async (msg) => {
  const chatId = msg.chat.id;
  let pesan = `Catata Data Pemasukan ${msg.chat.first_name} \n \n `;
  const apiCall = await fetch(`${urlAPi}${Urlpemasukan}/${chatId}`);
  const data = await apiCall.json();
  data.forEach((data) => {
    pesan += `Pemasukan ${moment(data.time).format("dddd, DD-MM-YYYY")} => ${data.description} :  𝐑𝐩. ${data.nominal.toLocaleString("id-ID")} \n \n`;
  })
  let sum = data.reduce((total, data) => total + data.nominal, 0);
  pesan += `Total Semua Pemasukan Anda sebesar :𝐑𝐩. ${sum.toLocaleString("id-ID")}`
  myBot.sendMessage(chatId, pesan);
})

myBot.onText(/\/lihat_pengeluaran (\d{4}-\d{2}-\d{2})/, (msg, match) => {
  const chatId = msg.chat.id;
  let date = match[1];
  let pesan = ``;
  let sum = dataPengeluaran.reduce((total, pengeluaran) => total + pengeluaran.nominal, 0);
  pesan += `Total Semua Pengeluaran Anda sebesar :𝐑𝐩. ${sum.toLocaleString("id-ID")}`
  myBot.sendMessage(chatId, pesan);

})
myBot.onText(/\/lihat_pengeluaran/, async (msg) => {
  const chatId = msg.chat.id;
  let pesan = `Catatan Pengeluaran`;
  const apiCall = await fetch(`${urlAPi}${urlPengeluaran}/${chatId}`);
  const data = await apiCall.json();
  data.forEach((data) => {
    pesan += `${moment(data.time).format("dddd, DD-MM-YYYY")} => ${data.description} :  𝐑𝐩. ${data.nominal.toLocaleString("id-ID")} \n \n`;
  })
  let sum = data.reduce((total, data) => total + data.nominal, 0);
  pesan += `Total Semua Pengeluaran Anda sebesar :𝐑𝐩. ${sum.toLocaleString("id-ID")}`
  myBot.sendMessage(chatId, pesan);
})
myBot.onText(help, (msg) => {
  const chatId = msg.chat.id;
  let helpMsg = `
    /tambah_pemasukan [jumlah] [deskripsi]: Menambahkan catatan pemasukan ke dalam catatan keuangan. Contoh: /tambah_pemasukan 50000 Gaji Bulan Ini di restoran.\n
    \n/tambah_pengeluaran [jumlah] [deskripsi]: Menambahkan catatan pemasukan ke dalam catatan keuangan. Contoh: /tambah_pengeluaran 50000 Makan malam di restoran.\n/lihat_pengeluaran [tanggal]: Melihat catatan keuangan untuk tanggal tertentu atau rentang waktu. Contoh: /lihat_pengeluaran 2024-02-21 atau /lihat_pengeluaran 2024-02-01 2024-02-28.\n/lihat_pemasukan : untuk melihat pemasukan\nlihat_pengeluaran : untuk melihat pengeluaran\n/rekap : untuk melihat rekapan
    `;
  myBot.sendMessage(chatId, helpMsg);
})


myBot.onText(/\/tambah_pemasukan (\d+) (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  let nominal = match[1];
  const deskripsi = match[2];
  con.query(`INSERT INTO pemasukans (nominal, user_id, description) VALUES ('${nominal}', '${chatId}', '${deskripsi}')`, (err, result) => {
    if (err) throw err;
    console.log(result);
  })
  let uang = parseInt(nominal).toLocaleString("id-ID");
  myBot.sendMessage(chatId, `Pengeluaran Rp ${uang} Dengan Deskripsi ${deskripsi} Ditambahkan pada ${day}-${month}-${year}`);
  let pesan = `Catata Data Pemasukan ${msg.chat.first_name} \n \n `;
  const apiCall = await fetch(`${urlAPi}${Urlpemasukan}/${chatId}`);
  const data = await apiCall.json();
  data.forEach((data) => {
    pesan += `Pemasukan ${moment(data.time).format("dddd, DD-MM-YYYY")} => ${data.description} :  𝐑𝐩. ${data.nominal.toLocaleString("id-ID")} \n \n`;
  })
  let sum = data.reduce((total, data) => total + data.nominal, 0);
  pesan += `Total Semua Pemasukan Anda sebesar :𝐑𝐩. ${sum.toLocaleString("id-ID")}`
  myBot.sendMessage(chatId, pesan);
})
myBot.onText(/\/tambah_pengeluaran (\d+) (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  let nominal = match[1];
  let uang = parseInt(nominal).toLocaleString("id-ID");
  const deskripsi = match[2];
  con.query(`INSERT INTO pengeluarans (nominal, user_id, description) VALUES ('${nominal}', '${chatId}', '${deskripsi}')`, (err, result) => {
    if (err) throw err;
    console.log(result);
  })
  myBot.sendMessage(chatId, `Pengeluaran Rp ${uang} Dengan Deskripsi ${deskripsi} 
  sukses ditambahkan pada ${moment().format("dddd, DD-MM-YYYY")}`);
})
myBot.onText(/\/rekap/, async (msg) => {
  const chatId = msg.chat.id;
  let pesan = `REKAPAN CATATAN KEUANGAN \n \n `;
  const apiCallPengeluaran = await fetch(`${urlAPi}${urlPengeluaran}/${chatId}`);
  const dataPengeluaran = await apiCallPengeluaran.json();
  dataPengeluaran.forEach((pengeluaran) => {
    pesan += `${moment(pengeluaran.time).format("dddd, DD-MM-YYYY")} => ${pengeluaran.description} :  𝐑𝐩. ${pengeluaran.nominal.toLocaleString("id-ID")} \n \n`;
  })
  const apiCallPemasukan = await fetch(`${urlAPi}${Urlpemasukan}/${chatId}`);
  const dataPemasukan = await apiCallPemasukan.json();
  dataPemasukan.forEach((pemasukan) => {
    pesan += `${moment(pemasukan.time).format("dddd, DD-MM-YYYY")} => ${pemasukan.description} :  𝐑𝐩. ${pemasukan.nominal.toLocaleString("id-ID")} \n \n`;
  })
  let sumPengeluaran = dataPengeluaran.reduce((total, pengeluaran) => total + pengeluaran.nominal, 0);
  let sumPemasukan = dataPemasukan.reduce((total, pemasukan) => total + pemasukan.nominal, 0);
  pesan += `Total Semua Pengeluaran Anda sebesar :𝐑𝐩. ${sumPengeluaran.toLocaleString("id-ID")}\n`;
  pesan += `Total Semua Pemasukan Anda sebesar :𝐑𝐩. ${sumPemasukan.toLocaleString("id-ID")}`;
  myBot.sendMessage(chatId, pesan);
})
myBot.onText(/\/refresh/, (msg) => {
  const chatId = msg.chat.id;
  myBot.sendMessage(chatId, "Refreshed!");
})
myBot.on("polling_error", (error) => {
  console.log(error);
})
