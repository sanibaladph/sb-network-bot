const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

// Karanta bayanan tsaro daga Environment Variables na Render
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET;

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

// Farashin Vouchers na SB Network
const VOUCHER_PRICES = {
  '1_DAY': { name: 'Voucher na Kwana 1', amount: 20000 },  // ₦200
  '1_WEEK': { name: 'Voucher na Mako 1', amount: 100000 }, // ₦1,000
  '1_MONTH': { name: 'Voucher na Wata 1', amount: 350000 } // ₦3,500
};

// Umarnin /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const opts = {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🎫 Siyan Voucher (Kwana 1 - ₦200)', callback_data: '1_DAY' }],
        [{ text: '🎫 Siyan Voucher (Mako 1 - ₦1,000)', callback_data: '1_WEEK' }],
        [{ text: '🎫 Siyan Voucher (Wata 1 - ₦3,500)', callback_data: '1_MONTH' }]
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
      
      bot.sendMessage(chatId, `Danna maballin da ke ƙasa don yin biyan kuɗi na **₦${plan.amount / 100}**:\nBayan biya ya tabbata, Bot ɗin zai tura maka code ɗinka!`, opts);

    } catch (error) {
      bot.sendMessage(chatId, 'An samu matsala wajen buɗe hanyar biya. Da fatan sake gwadawa daga baya.');
    }
  }
});
