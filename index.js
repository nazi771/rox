require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

// تحميل متغيرات البيئة
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const RENDER_URL = process.env.RENDER_URL || `https://${process.env.RENDER_INSTANCE}.onrender.com`;
const PORT = process.env.PORT || 3000;
const DEVELOPER_USERNAME = '@QR_l4';

// إنشاء تطبيق Express
const app = express();

// تهيئة بوت Telegram
const bot = new TelegramBot(TOKEN, {polling: true});

// Middleware
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// تقديم ملفات HTML مع تعديل معرف المستخدم
app.get('/file/:filename/:userId', (req, res) => {
    const { filename, userId } = req.params;
    const filePath = path.join(__dirname, 'uploads', filename);
    
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            return res.status(404).send('File not found');
        }
        
        const modifiedHtml = data.replace(/USER_ID_PLACEHOLDER/g, userId);
        res.send(modifiedHtml);
    });
});

// بدء الخادم
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Telegram bot is running with token: ${TOKEN?.substring(0, 5)}...`);
    console.log(`Render URL: ${RENDER_URL}`);
});

// معالجة أمر /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const options = {
        reply_markup: {
            keyboard: [
                [
                    {text: 'انشاء صور 🖼️'}, 
                    {text: 'ذكاء اصطناعيّ 🤖'}
                ],
                [
                    {text: 'ترجمه نص 🌐'}, 
                    {text: 'تواصل مع المطور 📩'}
                ],
                [
                    {text: 'المواقع المدمجة 🌍'}
                ]
            ],
            resize_keyboard: true,
            one_time_keyboard: false
        },
        parse_mode: 'HTML'
    };
    
    const welcomeMsg = `
<b>مرحباً بك في البوت العالمي!</b> 🌍

يمكنك استخدام الأزرار أدناه للوصول إلى جميع الخدمات:

• <b>انشاء صور</b>: توليد صور بالذكاء الاصطناعي
• <b>ذكاء اصطناعيّ</b>: محادثة مع الذكاء الاصطناعي
• <b>ترجمه نص</b>: ترجمة النص إلى لغات متعددة
• <b>المواقع المدمجة</b>: مواقع تعمل داخل البوت
    `;
    
    bot.sendMessage(chatId, welcomeMsg, options);
});

// معالجة الأزرار الرئيسية
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    const userId = msg.from.id;

    try {
        if (text === 'انشاء صور 🖼️') {
            bot.sendMessage(chatId, '📝 أرسل لي وصف الصورة التي تريد توليدها (باللغة الإنجليزية للحصول على نتائج أفضل)');
            
            bot.once('message', async (msg) => {
                if (msg.text && !msg.text.startsWith('/')) {
                    const description = msg.text;
                    try {
                        const loadingMsg = await bot.sendMessage(chatId, '⏳ جاري توليد الصورة، الرجاء الانتظار...');
                        
                        const response = await axios.post('https://ai-api.magicstudio.com/api/ai-art-generator', {
                            prompt: description
                        }, {
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        });
                        
                        await bot.deleteMessage(chatId, loadingMsg.message_id);
                        
                        if (response.data?.url) {
                            await bot.sendPhoto(chatId, response.data.url, {
                                caption: 'ها هي صورتك المطلوبة 🎨'
                            });
                        } else {
                            await bot.sendMessage(chatId, '❌ عذرًا، لم أتمكن من توليد الصورة. يرجى المحاولة بوصف مختلف.');
                        }
                    } catch (error) {
                        console.error(error);
                        await bot.sendMessage(chatId, '❌ حدث خطأ أثناء توليد الصورة. يرجى المحاولة لاحقًا.');
                    }
                }
            });
        }
        else if (text === 'ذكاء اصطناعيّ 🤖') {
            bot.sendMessage(chatId, '🧠 أرسل لي سؤالك أو استفسارك وسأحاول الإجابة عليه');
            
            bot.once('message', async (msg) => {
                if (msg.text && !msg.text.startsWith('/')) {
                    const question = msg.text;
                    try {
                        const loadingMsg = await bot.sendMessage(chatId, '🤔 جاري التفكير في الإجابة...');
                        
                        // هنا يمكنك استخدام أي API للذكاء الاصطناعي
                        const response = await axios.get('https://nikai.pages.dev/api/ai', {
                            params: { q: question }
                        });
                        
                        await bot.deleteMessage(chatId, loadingMsg.message_id);
                        
                        if (response.data?.answer) {
                            await bot.sendMessage(chatId, `🤖 الذكاء الاصطناعي:\n\n${response.data.answer}`);
                        } else {
                            await bot.sendMessage(chatId, '❌ لم أتمكن من فهم سؤالك. يرجى إعادة الصياغة.');
                        }
                    } catch (error) {
                        console.error(error);
                        await bot.sendMessage(chatId, '❌ حدث خطأ أثناء معالجة سؤالك. يرجى المحاولة لاحقًا.');
                    }
                }
            });
        }
        else if (text === 'ترجمه نص 🌐') {
            bot.sendMessage(chatId, '💬 أرسل النص الذي تريد ترجمته (سيتم ترجمته من الإنجليزية إلى العربية)');
            
            bot.once('message', async (msg) => {
                if (msg.text && !msg.text.startsWith('/')) {
                    const textToTranslate = msg.text;
                    try {
                        const loadingMsg = await bot.sendMessage(chatId, '🔄 جاري الترجمة...');
                        
                        const response = await axios.get(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(textToTranslate)}&langpair=en|ar`);
                        
                        await bot.deleteMessage(chatId, loadingMsg.message_id);
                        
                        if (response.data?.responseData?.translatedText) {
                            await bot.sendMessage(chatId, `🌍 الترجمة:\n\n${response.data.responseData.translatedText}`);
                        } else {
                            await bot.sendMessage(chatId, '❌ لم أتمكن من ترجمة النص. يرجى المحاولة بنص آخر.');
                        }
                    } catch (error) {
                        console.error(error);
                        await bot.sendMessage(chatId, '❌ حدث خطأ أثناء الترجمة. يرجى المحاولة لاحقًا.');
                    }
                }
            });
        }
        else if (text === 'تواصل مع المطور 📩') {
            const contactMsg = `
📬 للتواصل مع المطور:

يمكنك مراسلة المطور مباشرة عبر: ${DEVELOPER_USERNAME}

أو أرسل رسالتك هنا وسيتم إرسالها للمطور:
            `;
            
            bot.sendMessage(chatId, contactMsg);
            
            bot.once('message', async (msg) => {
                if (msg.text && !msg.text.startsWith('/')) {
                    const userMessage = msg.text;
                    try {
                        await bot.sendMessage(chatId, '✅ تم إرسال رسالتك إلى المطور. شكرًا لك!');
                        
                        // إرسال الرسالة للمطور
                        await bot.sendMessage(process.env.DEVELOPER_CHAT_ID, 
                            `📩 رسالة جديدة من المستخدم:\n\n${userMessage}\n\nمعرف المستخدم: ${userId}`
                        );
                    } catch (error) {
                        console.error(error);
                        await bot.sendMessage(chatId, '❌ حدث خطأ أثناء إرسال رسالتك. يرجى المحاولة لاحقًا.');
                    }
                }
            });
        }
        else if (text === 'المواقع المدمجة 🌍') {
            const options = {
                reply_markup: {
                    inline_keyboard: [
                        [
                            {text: 'إغلاق مواقع', callback_data: 'site_close'},
                            {text: 'بلاغات تيك توك', callback_data: 'site_tiktok'}
                        ],
                        [
                            {text: 'بلاغات انستا', callback_data: 'site_insta'},
                            {text: 'بلاغات تلجرام', callback_data: 'site_telegram'}
                        ],
                        [
                            {text: 'ذكاء اصطناعيّ', callback_data: 'site_ai'},
                            {text: 'قرآن كريم', callback_data: 'site_quran'}
                        ],
                        [
                            {text: 'ترجمة لغات', callback_data: 'site_translate'},
                            {text: 'متجر القراصنة', callback_data: 'site_hack'}
                        ],
                        [
                            {text: 'جلب معلومات IP', callback_data: 'site_ip'},
                            {text: 'اندكس تلجرام', callback_data: 'site_tele'}
                        ],
                        [
                            {text: 'اندكس انستا', callback_data: 'site_insta_index'}
                        ]
                    ]
                },
                parse_mode: 'HTML'
            };
            
            const sitesMsg = `
<b>المواقع المدمجة 🌐</b>

اختر أحد المواقع التالية لفتحها:
            `;
            
            bot.sendMessage(chatId, sitesMsg, options);
        }
    } catch (error) {
        console.error(error);
        bot.sendMessage(chatId, '❌ حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.');
    }
});

// معالجة اختيارات المواقع المدمجة
bot.on('callback_query', async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;
    const data = callbackQuery.data;
    
    try {
        let url;
        let message;
        
        switch(data) {
            case 'site_close':
                url = 'https://ddos7.pages.dev/';
                message = '🌐 موقع إغلاق المواقع:\n' + url;
                break;
            case 'site_tiktok':
                url = 'https://repotik.pages.dev/';
                message = '🎵 موقع بلاغات تيك توك:\n' + url;
                break;
            case 'site_insta':
                url = 'https://instag.pages.dev/';
                message = '📷 موقع بلاغات انستجرام:\n' + url;
                break;
            case 'site_telegram':
                url = 'https://reptele.pages.dev/';
                message = '✉️ موقع بلاغات تلجرام:\n' + url;
                break;
            case 'site_ai':
                url = 'https://nikai.pages.dev/';
                message = '🤖 موقع الذكاء الاصطناعي:\n' + url;
                break;
            case 'site_quran':
                url = 'https://quran7.pages.dev/';
                message = '📖 موقع القرآن الكريم:\n' + url;
                break;
            case 'site_translate':
                url = 'https://transla.pages.dev/';
                message = '🌍 موقع الترجمة متعددة اللغات:\n' + url;
                break;
            case 'site_hack':
                url = 'https://roks2.pages.dev/';
                message = '👨‍💻 متجر القراصنة:\n' + url;
                break;
            case 'site_ip':
                url = 'https://roxip.pages.dev/';
                message = '🖥️ موقع جلب معلومات IP:\n' + url;
                break;
            case 'site_tele':
                url = `${RENDER_URL}/uploads/tele.html?user=${userId}`;
                message = `📊 اندكس تلجرام:\n${url}`;
                break;
            case 'site_insta_index':
                url = `${RENDER_URL}/uploads/insat.html?user=${userId}`;
                message = `📸 اندكس انستجرام:\n${url}`;
                break;
            default:
                message = '❌ الموقع المطلوب غير متوفر حالياً';
        }
        
        await bot.sendMessage(chatId, message);
        await bot.answerCallbackQuery(callbackQuery.id);
    } catch (error) {
        console.error(error);
        await bot.sendMessage(chatId, '❌ حدث خطأ أثناء فتح الموقع. يرجى المحاولة لاحقًا.');
        await bot.answerCallbackQuery(callbackQuery.id);
    }
});

// معالجة الأخطاء
process.on('unhandledRejection', (error) => {
    console.error('Unhandled rejection:', error);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
});