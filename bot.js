const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const http = require('http');

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET;

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

// Sabbin Farashin Vouchers na SB Network
const VOUCHER_PRICES = {
  '1_DAY': { name: 'Voucher na Kwana 1', amount: 50000 },   // ₦500
  '1_WEEK': { name: 'Voucher na Mako 1', amount: 200000 },  // ₦2,000
  '1_MONTH': { name: 'Voucher na Wata 1', amount: 1000000 } // ₦10,000
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
            const randomCode = 'SB-' + Math.floor(100000 + Math.random() * 900000);

            bot.sendMessage(
              chatId,
              `✅ **Biyan Kuɗi Ya Tabbata!**\n\nMun karɓi kuɗinka **₦${amountPaid}** lami lafiya.\n\n🎫 **Voucher Code ɗinka:** \`${randomCode}\`\n\nYi amfani da wannan code ɗin don shiga tsarin SB Network Wi-Fi. Muna godiya da kasuwancinka!`,
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
        [{ text: '🎫 Siyan Voucher (Kwana 1 - ₦500)', callback_data: '1_DAY' }],
        [{ text: '🎫 Siyan Voucher (Mako 1 - ₦2,000)', callback_data: '1_WEEK' }],
        [{ text: '🎫 Siyan Voucher (Wata 1 - ₦10,000)', callback_data: '1_MONTH' }]
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
