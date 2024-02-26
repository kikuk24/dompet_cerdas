const TelegramBot = require("node-telegram-bot-api");
const moment = require("moment");
const mySql = require("mysql");
const con = mySql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "keuangan"
});
con.connect((err) => {
  if (err) {
    console.log(`err.stack: ${err.stack}`);
  }
  console.log(`connected as id ${con.threadId}`);
  con.query('SELECT * FROM user', (err, result) => {
    if (err) throw err;
    dataUser = [];
    result.forEach((data) => {
      dataUser.push({
        id: data.id,
        chatId: data.chatId,
        name: data.name
      })
    })
  })
  con.query('SELECT * FROM pemasukan', (err, result) => {
    if (err) throw err;
    dataPemasukan = [];
    result.forEach((data) => {
      dataPemasukan.push({
        id: data.id,
        chatId: data.user_id,
        nominal: data.nominal,
        time: data.time
      })
    })
  })
});

const token = "7159633687:AAGedS_dMuIWWJL2ynqWhPu0VUhTTMac6xs";
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
const tambahPemasukan = new RegExp(`^${prefix}tambah_pemasukan (\d+) (.+)$`);
const catatan = new RegExp(`^${prefix}catatan$`);
const pengeluaran = new RegExp(`^${prefix}pengeluaran(.*)$`);
const tess = new RegExp(`^${prefix}tess$`);
const help = new RegExp(`^${prefix}help$`);
myBot.onText(tess, (msg) => {
  const chatId = msg.chat.id;
  const name = msg.chat.first_name;
  let pesan = `Halo ${name}\n`;

  dataUser.forEach((data) => {
    dataPemasukan.forEach((pemasukan) => {
      pesan += `${moment(pemasukan.time).format("dddd, DD-MM-YYYY")} => Pemasukan Anda sebesar ${pemasukan.nominal}\n`;
    })
  })
  let sum = dataPemasukan.reduce((total, pemasukan) => total + pemasukan.nominal, 0);
  pesan += `Total Pemasukan Anda sebesar ${sum}`
  myBot.sendMessage(chatId, pesan);
})
myBot.onText(lihatPemasukan, (msg) => {
  const chatId = msg.chat.id;
  let pesan = ``;
  
  dataUser.forEach((data) => {
    if (data.chatId === chatId) {
      pesan += `==== 𝐇𝐚𝐥𝐨 ${data.name}====\n \n`;
      dataPemasukan.forEach((pemasukan) => {
        pesan += `${moment(pemasukan.time).format("dddd, DD-MM-YYYY")} => 𝐏𝐞𝐦𝐚𝐬𝐮𝐤𝐚𝐧 𝐀𝐧𝐝𝐚 𝐬𝐞𝐛𝐞𝐬𝐚𝐫 : 𝐑𝐩. ${pemasukan.nominal.toLocaleString("id-ID")}\n \n`;
      })
    }
  })
  let sum = dataPemasukan.reduce((total, pemasukan) => total + pemasukan.nominal, 0);
  pesan += `𝐓𝐨𝐭𝐚𝐥 𝐏𝐞𝐦𝐚𝐬𝐮𝐤𝐚𝐧 𝐀𝐧𝐝𝐚 𝐬𝐞𝐛𝐞𝐬𝐚𝐫 :𝐑𝐩. ${sum.toLocaleString("id-ID")}`
  myBot.sendMessage(chatId, pesan);
})

myBot.onText(start, (msg) => {
  const chatId = msg.chat.id;
  const name = msg.chat.first_name;
  if (!dataUser.some((data) => data.chatId === chatId)) {
    con.query(`INSERT INTO user (chatId, name) VALUES ('${chatId}', '${name}')`, (err, result) => {
      if (err) throw err;
    })
  }
  myBot.sendMessage(chatId, `Halo ${name} Selamat Datang`);
  myBot.sendMessage(chatId, `Perkenalkan Saya Dompet Cerdas Akan Mambantu Mengelola Keuangan Mu, Ketik ${prefix}help Untuk Melihat List Perintah`);
})

myBot.onText(help,(msg)=>{
  const chatId = msg.chat.id;
  let helpMsg = `
    /tambah [jumlah] [deskripsi]: Menambahkan catatan pengeluaran atau pemasukan ke dalam catatan keuangan. Contoh: /tambah 50 Makan malam di restoran.
    `;
  myBot.sendMessage(chatId, helpMsg);
})

myBot.onText(pengeluaran, (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text.split(" ")[1];

  if (!text) {
    myBot.sendMessage(chatId,`Masukkan nominal pengeluaran. Contoh: ${prefix}pengeluaran 1000`);
  }
})
myBot.onText(tambahPemasukan, (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text.split(" ")[1];
  const uang = parseInt(text)
  con.query(`INSERT INTO pemasukan (nominal, user_id) VALUES ('${uang}', '${chatId}')`, (err, result) => {
    if (err) throw err;
    console.log(result);
    myBot.sendMessage(chatId,`Pemasukan Rp. ${uang} Ditambahkan pada ${day}-${month}-${year}`);
  });
})
myBot.onText(/\/tambah (\d+) (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  let nominal = match[1];
  let uang = parseInt(nominal).toLocaleString("id-ID");
  const deskripsi = match[2];

  myBot.sendMessage(chatId,`Pengeluaran Rp. ${uang} Dengan Deskripsi ${deskripsi} Ditambahkan pada ${day}-${month}-${year}`);
})
myBot.onText(catatan, (msg) => {
  const chatId = msg.chat.id;
  
  con.query(`SELECT * FROM pemasukan WHERE user_id = '${chatId}'`, (err, result) => {
    if (err) throw err;
    console.log(result);
    result.forEach((data) => {
    
      let catatan = `
        **### Pemasukan Hari Ini** ${data.time} ###\nPemasukan: ${data.nominal}\n
        `;
      myBot.sendMessage(chatId, catatan);
    })
  })
  con.query(`SELECT SUM(nominal) AS total FROM pemasukan WHERE user_id = '${chatId}'`, (err, result) => {
    if (err) throw err;
    let catatan = `
      Total pemasukan: ${result[0].total}
      `;
    myBot.sendMessage(chatId, catatan);
  })
})


myBot.on("polling_error", (error) => {
  console.log(error);
})