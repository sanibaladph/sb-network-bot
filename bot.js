const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const http = require('http');

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET;

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

// Sabbin Farashin Vouchers na SB Network
const VOUCHER_PRICES = {
  "1_DAY": { 
    name: "Voucher na Kwana 1", 
    amount: process.env.DAILY_PRICE ? Number(process.env.DAconst TelegramBot = require('node-telegram-bot-api');
const http = require('http');

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

// Tattara vouchers daga Render zuwa Arrays (Ma'ajiya ta wucin gadi)
let dailyVouchers = process.env.DAILY_VOUCHERS ? process.env.DAILY_VOUCHERS.split(',').map(v => v.trim()).filter(Boolean) : [];
let weeklyVouchers = process.env.WEEKLY_VOUCHERS ? process.env.WEEKLY_VOUCHERS.split(',').map(v => v.trim()).filter(Boolean) : [];
let monthlyVouchers = process.env.MONTHLY_VOUCHERS ? process.env.MONTHLY_VOUCHERS.split(',').map(v => v.trim()).filter(Boolean) : [];

// Webhook Server
const port = process.env.PORT || 3000;
const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/webhook') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const event = JSON.parse(body);
        if (event.event === 'charge.success') {
          const customerEmail = event.data.customer.email;
          const chatIdMatch = customerEmail.match(/customer_(\d+)@sbnetwork\.com/);

          if (chatIdMatch) {
            const chatId = chatIdMatch[1];
            const amountPaid = event.data.amount / 100;

            let voucherCode = null;

            // Zabo voucher sannan ka C IRE SHI daga cikin jerin (.shift())
            if (amountPaid === 300) {
              if (dailyVouchers.length > 0) {
                voucherCode = dailyVouchers.shift(); // Yana cire na farko
              }
            } else if (amountPaid === 2000) {
              if (weeklyVouchers.length > 0) {
                voucherCode = weeklyVouchers.shift();
              }
            } else if (amountPaid === 8000) {
              if (monthlyVouchers.length > 0) {
                voucherCode = monthlyVouchers.shift();
              }
            }

            if (voucherCode) {
              bot.sendMessage(
                chatId,
                `✅ **Biyan Kuɗi Ya Tabbata!**\n\nMun karɓi kuɗinka **₦${amountPaid}** lami lafiya.\n\n🎫 **Voucher Code ɗinka:** \`${voucherCode}\`\n\nYi amfani da wannan lambar wajen yin Login a SB Network. Nagode!`,
                { parse_mode: 'Markdown' }
              );
            } else {
              // Idan vouchers sun ƙare
              bot.sendMessage(
                chatId,
                `✅ **Biyan Kuɗi Ya Tabbata!**\n\nMun karɓi kuɗinka **₦${amountPaid}** lami lafiya.\n\n⚠️ Amma vouchers na wannan rukunin sun ƙare a halin yanzu. Don Allah tuntuɓi Admin don tura maka voucher ɗinka take yanzu.`,
                { parse_mode: 'Markdown' }
              );
            }
          }
        }
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Webhook Received');
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Invalid Payload');
      }
    });
  } else {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('SB Network Webhook Server is Active!');
  }
});

server.listen(port);

// Umarnin /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const opts = {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🎫 Siyan Voucher (Kwana 1 - ₦300)', callback_data: '1_DAY' }],
        [{ text: '🎫 Siyan Voucher (Mako 1 - ₦2,000)', callback_data: '1_WEEK' }],
        [{ text: '🎫 Siyan Voucher (Wata 1 - ₦8,000)', callback_data: '1_MONTH' }]
      ]
    }
  };
  bot.sendMessage(chatId, 'Barka da zuwa cibiyar **SB Network**!\nZaɓi irin voucher ɗin da kake son siya a ƙasa:', { parse_mode: 'Markdown', ...opts });
});

// Biyan Kuɗi ta Paystack
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const planKey = query.data;

  let amount = 0;
  let planName = '';

  if (planKey === '1_DAY') { amount = 300; planName = 'Voucher na Kwana 1'; }
  else if (planKey === '1_WEEK') { amount = 2000; planName = 'Voucher na Mako 1'; }
  else if (planKey === '1_MONTH') { amount = 8000; planName = 'Voucher na Wata 1'; }

  const customerEmail = `customer_${chatId}@sbnetwork.com`;

  try {
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: customerEmail,
        amount: amount * 100,
        callback_url: 'https://t.me/your_bot_username'
      })
    });

    const data = await response.json();
    if (data.status) {
      bot.sendMessage(chatId, `Latsa link ɗin da ke ƙasa don kammala biyan kuɗin **${planName}** (₦${amount}):\n\n👉 ${data.data.authorization_url}`);
    } else {
      bot.sendMessage(chatId, 'An samu matsala wajen haɗawa da Paystack. Don Allah sake gwadawa.');
    }
  } catch (err) {
    bot.sendMessage(chatId, 'An samu kuskure. Don Allah sake gwadawa.');
  }
});
ILY_PRICE) * 100 : 30000 
  },
  "1_WEEK": { 
    name: "Voucher na Mako 1", 
    amount: process.env.WEEKLY_PRICE ? Number(process.env.WEEKLY_PRICE) * 100 : 200000 
  },
  "1_MONTH": { 
    name: "Voucher na Wata 1", 
    amount: process.env.MONTHLY_PRICE ? Number(process.env.MONTHLY_PRICE) * 100 : 800000 
  }
};


// Webhook Server
const port = process.env.PORT || 3000;
const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/webhook') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const event = JSON.parse(body);
        if (event.event === 'charge.success') {
          const customerEmail = event.data.customer.email;
          const chatIdMatch = customerEmail.match(/customer_(\d+)@sbnetwork\.com/);

          if (chatIdMatch) {
            const chatId = chatIdMatch[1];
            const amountPaid = event.data.amount / 100;

            let voucherCode = "Babu voucher a halin yanzu. Tuntuɓi Admin.";

            if (amountPaid === 300 && process.env.DAILY_VOUCHERS) {
              const vouchers = process.env.DAILY_VOUCHERS.split(',');
              if (vouchers.length > 0) voucherCode = vouchers[0].trim();
            } else if (amountPaid === 2000 && process.env.WEEKLY_VOUCHERS) {
              const vouchers = process.env.WEEKLY_VOUCHERS.split(',');
              if (vouchers.length > 0) voucherCode = vouchers[0].trim();
            } else if (amountPaid === 8000 && process.env.MONTHLY_VOUCHERS) {
              const vouchers = process.env.MONTHLY_VOUCHERS.split(',');
              if (vouchers.length > 0) voucherCode = vouchers[0].trim();
            }

            bot.sendMessage(
              chatId,
              `✅ **Biyan Kuɗi Ya Tabbata!**\n\nMun karɓi kuɗinka **₦${amountPaid}** lami lafiya.\n\n🎫 **Voucher Code ɗinka:** \`${voucherCode}\`\n\nYi amfani da wannan lambar wajen yin Login a SB Network. Nagode!`,
              { parse_mode: 'Markdown' }
            );
          }
        }
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Webhook Received');
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Invalid Payload');
      }
    });
  } else {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('SB Network Webhook Server is Active!');
  }
});

server.listen(port);


// Umarnin /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const opts = {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🎫 Siyan Voucher (Kwana 1 - ₦300)', callback_data: '1_DAY' }],
        [{ text: '🎫 Siyan Voucher (Mako 1 - ₦2,000)', callback_data: '1_WEEK' }],
        [{ text: '🎫 Siyan Voucher (Wata 1 - ₦8,000)', callback_data: '1_MONTH' }]
      ]
    }
  };
  bot.sendMessage(chatId, `Barka da zuwa cibiyar **SB Network**!\nZaɓi irin voucher din da kake son siya a ƙasa:`, { parse_mode: 'Markdown', ...opts });
});

// Gudanar da Biyan Kuɗi ta Paystack
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const planKey = query.data;
  const plan = VOUCHER_PRICES[planKey];

  if (plan) {
    bot.sendMessage(chatId, `Kana shirin siyan **${plan.name}**.\nDan jira kaɗan ana haɗa maka hanyar biya...`);

    try {
      const response = await axios.post(
        'https://api.paystack.co/transaction/initialize',
        {
          email: `customer_${chatId}@sbnetwork.com`,
          amount: plan.amount
        },
        {
          headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` }
        }
      );

      const payUrl = response.data.data.authorization_url;
      const opts = {
        reply_markup: {
          inline_keyboard: [[{ text: '💳 Danna Nan Don Biyan Kudi', url: payUrl }]]
        }
      };
      
      // Anan an gyara don ya fito da ainihin sabon farashin (₦500, ₦2,000, ko ₦10,000)
      const formattedAmount = (plan.amount / 100).toLocaleString();
      bot.sendMessage(chatId, `Danna maballin da ke ƙasa don yin biyan kuɗi na **₦${formattedAmount}**:\nBayan biya ya tabbata, Bot ɗin zai tura maka code ɗinka!`, opts);

    } catch (error) {
      bot.sendMessage(chatId, 'An samu matsala wajen buɗe hanyar biya. Da fatan sake gwadawa daga baya.');
    }
  }
});
