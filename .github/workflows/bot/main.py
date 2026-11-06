import os
import logging
import json
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ApplicationBuilder, ContextTypes, CommandHandler, CallbackQueryHandler, MessageHandler, filters
from supabase import create_client
import google.generativeai as genai

# Логирование
logging.basicConfig(format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', level=logging.INFO)

# Конфигурация
BOT_TOKEN = os.environ.get("BOT_TOKEN", "9143813888:AAFdZpBU6_buGm7UoUEblrHiyEB1EqoWFzY")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://jncyvopdxarwtqtnmfwh.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "sb_publishable_YHsJtW3rAEN3QTXaW7lxDA_5TS47IFr")

db = create_client(SUPABASE_URL, SUPABASE_KEY)
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-1.5-flash')

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "🤖 Привет, админ! Я бот-помощник AI WorkHub.\n\n"
        "Скинь мне ссылку на новый AI-сервис, и я с помощью ИИ напишу обзор, плюсы, минусы, подготовлю сценарий для TikTok и отправлю карточку на модерацию."
    )

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    url = update.message.text.strip()
    if not url.startswith("http"):
        await update.message.reply_text("Пожалуйста, отправь корректную ссылку на сайт (начинающуюся с http).")
        return

    msg = await update.message.reply_text("🧠 Анализирую сайт с помощью Gemini AI, пишу обзор и сценарий для TikTok...")

    try:
        prompt = f"""
        Проанализируй сайт нейросетевого сервиса по ссылке: {url}
        Верни ответ строго в формате JSON без лишнего текста, содержащий поля:
        - title: название сервиса
        - subtitle: короткий подзаголовок (на русском)
        - description: краткое описание для каталога (2-3 предложения, на русском)
        - full_review: развернутый обзор возможностей (на русском, с HTML тегами <br>)
        - price: ценовая политика (например: Бесплатно / от $10)
        - tags: массив из 3 тегов (на русском или английском)
        - pros: массив из 3 плюсов
        - cons: массив из 2 минусов
        - icon_text: 2 буквы для иконки
        - tiktok_script: готовый короткий сценарий для TikTok ролика (до 30 секунд, динамичный, с призывом перейти в профиль на AI WorkHub)
        """
        
        response = model.generate_content(prompt)
        text_res = response.text.replace("```json", "").replace("```", "").strip()
        
        data = json.loads(text_res)
        
        slug = data['title'].lower().replace(' ', '-').replace('.', '')
        data['slug'] = slug
        data['is_approved'] = False

        res = db.table('tools').insert(data).execute()
        tool_id = res.data[0]['id']

        keyboard = [
            [
                InlineKeyboardButton("✅ Опубликовать на сайт", callback_data=f"app_{tool_id}"),
                InlineKeyboardButton("❌ Удалить", callback_data=f"del_{tool_id}")
            ]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)

        preview_text = (
            f"<b>Новая заявка: {data['title']}</b>\n\n"
            f"📌 <i>{data['subtitle']}</i>\n"
            f"💰 Цена: {data['price']}\n\n"
            f"📝 <b>Описание:</b> {data['description']}\n\n"
            f"🎬 <b>Сценарий TikTok:</b>\n<code>{data.get('tiktok_script', 'Нет сценария')}</code>"
        )

        await msg.edit_text(preview_text, parse_mode='HTML', reply_markup=reply_markup)

    except Exception as e:
        await msg.edit_text(f"❌ Ошибка при обработке ИИ: {str(e)}")

async def button_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    
    action, tool_id = query.data.split('_')
    
    if action == 'app':
        db.table('tools').update({'is_approved': True}).eq('id', tool_id).execute()
        await query.edit_message_text("✅ Сервис успешно одобрен и опубликован! GitHub Actions скоро обновит страницы на сайте.")
    elif action == 'del':
        db.table('tools').delete().eq('id', tool_id).execute()
        await query.edit_message_text("❌ Заявка отклонена и удалена из базы.")

if __name__ == '__main__':
    application = ApplicationBuilder().token(BOT_TOKEN).build()
    
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CallbackQueryHandler(button_handler))
    application.add_handler(MessageHandler(filters.TEXT & (~filters.COMMAND), handle_message))
    
    print("Бот запущен...")
    application.run_polling()
