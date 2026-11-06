import fs from 'fs';
import path from 'path';

const SITE_URL = 'https://workhub-mv5.pages.dev';
const INDEXNOW_KEY = 'aiworkhub2026indexnowkey777';

const SUPABASE_URL = 'https://jncyvopdxarwtqtnmfwh.supabase.co';
const SUPABASE_KEY = 'sb_publishable_YHsJtW3rAEN3QTXaW7lxDA_5TS47IFr';

function escapeHtml(str = '') {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function makeSlug(title, id) {
    const base = String(title || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    return base || `tool-${id}`;
}

async function run() {
    console.log('1. Загружаем одобренные нейросети из Supabase...');
    const response = await fetch(`${SUPABASE_URL}/rest/v1/tools?select=*&order=id.asc`, {
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
        }
    });

    if (!response.ok) {
        const errText = await response.text();
        console.error('Ошибка чтения Supabase:', response.status, errText);
        process.exit(1);
    }

    const allData = await response.json();
    const tools = (allData || []).filter(t => t.is_approved !== false);

    console.log(`Найдено сервисов: ${tools.length}`);

    const urls = [`${SITE_URL}/`];

    // 2. Создаём ключевой файл для верификации IndexNow
    fs.writeFileSync(`${INDEXNOW_KEY}.txt`, INDEXNOW_KEY, 'utf8');

    // 3. Генерируем отдельную HTML-страницу для каждой нейросети
    for (const tool of tools) {
        const slug = tool.slug || makeSlug(tool.title, tool.id);
        const dir = path.join('tool', slug);
        fs.mkdirSync(dir, { recursive: true });

        const pageUrl = `${SITE_URL}/tool/${slug}/`;
        urls.push(pageUrl);

        const title = escapeHtml(tool.title);
        const subtitle = escapeHtml(tool.subtitle || 'ИИ-инструмент для работы и бизнеса');
        const desc = escapeHtml(tool.description || '');
        const price = escapeHtml(tool.price || 'Бесплатно');
        const fullReview = tool.full_review
            ? escapeHtml(tool.full_review).replace(/\n/g, '<br>')
            : `${desc}<br><br>Нейросеть <strong>${title}</strong> (${subtitle}) — проверенный инструмент из каталога AI WorkHub. Помогает автоматизировать рутинные задачи, экономить время и повышать продуктивность.`;

        const prosList = (tool.pros && tool.pros.length ? tool.pros : [
            'Быстрая автоматизация рутинных процессов',
            `Доступный режим старта (${price})`,
            'Удобный интерфейс без сложной настройки'
        ]).map(p => `<li class="flex items-start gap-2 text-slate-300 text-sm"><span class="text-emerald-400">✔</span> ${escapeHtml(p)}</li>`).join('');

        const consList = (tool.cons && tool.cons.length ? tool.cons : [
            'Продвинутые лимиты могут требовать платной подписки'
        ]).map(c => `<li class="flex items-start gap-2 text-slate-300 text-sm"><span class="text-rose-400">✕</span> ${escapeHtml(c)}</li>`).join('');

        const tagsHtml = (tool.tags || [])
            .map(t => `<span class="text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300">${escapeHtml(t)}</span>`)
            .join('');

        const tiktokBtn = tool.tiktok_url
            ? `<a href="${escapeHtml(tool.tiktok_url)}" target="_blank" rel="noopener" class="px-6 py-3.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:opacity-90 text-white font-bold text-sm text-center transition">🎬 Смотреть видеообзор в TikTok</a>`
            : '';

        const html = `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} — обзор нейросети, плюсы, минусы и как пользоваться (2026) | AI WorkHub</title>
    <meta name="description" content="${title} (${subtitle}): ${desc} Подробный обзор, тарифы (${price}), плюсы и минусы на AI WorkHub.">
    <link rel="canonical" href="${pageUrl}">
    <meta property="og:title" content="${title} — обзор и возможности нейросети">
    <meta property="og:description" content="${desc}">
    <meta property="og:url" content="${pageUrl}">
    <meta property="og:type" content="article">
    <script src="https://cdn.tailwindcss.com"></script>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "${title}",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web",
      "description": "${desc}",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      }
    }
    </script>
</head>
<body class="bg-[#090d16] text-slate-100 min-h-screen flex flex-col font-sans">
    <header class="border-b border-white/5 bg-[#090d16]/90 backdrop-blur-md">
        <div class="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
            <a href="/" class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-400 to-indigo-600 flex items-center justify-center font-black text-white">⚡</div>
                <span class="text-lg font-black text-white">AI WorkHub</span>
            </a>
            <a href="/" class="text-xs font-semibold text-sky-400 hover:underline">← Все 50+ нейросетей</a>
        </div>
    </header>

    <main class="flex-grow max-w-4xl mx-auto px-4 py-10 w-full">
        <nav class="text-xs text-slate-500 mb-6">
            <a href="/" class="hover:text-slate-300">Главная</a> / <span class="text-slate-300">${title}</span>
        </nav>

        <article class="bg-slate-900/70 border border-white/10 rounded-3xl p-6 md:p-10">
            <div class="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
                <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-2xl font-bold text-white shrink-0">
                    ${escapeHtml(tool.icon_text || '⚡')}
                </div>
                <div>
                    <span class="text-xs font-mono uppercase text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">${price}</span>
                    <h1 class="text-2xl md:text-4xl font-black text-white mt-2">${title} — обзор и возможности</h1>
                    <p class="text-slate-400 text-sm md:text-base mt-1">${subtitle}</p>
                </div>
            </div>

            <div class="flex flex-wrap gap-2 mb-6">${tagsHtml}</div>

            <div class="text-slate-200 text-sm md:text-base leading-relaxed bg-slate-950/60 p-5 rounded-2xl border border-white/5 mb-8">
                ${fullReview}
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div class="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5">
                    <h2 class="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3">Плюсы сервиса</h2>
                    <ul class="space-y-2">${prosList}</ul>
                </div>
                <div class="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-5">
                    <h2 class="text-xs font-bold uppercase tracking-wider text-rose-400 mb-3">Ограничения</h2>
                    <ul class="space-y-2">${consList}</ul>
                </div>
            </div>

            <div class="flex flex-col sm:flex-row gap-3 pt-6 border-t border-white/10">
                ${tiktokBtn}
                <a href="${escapeHtml(tool.url)}" target="_blank" rel="nofollow noopener" class="flex-grow px-6 py-3.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-sm text-center transition">
                    Перейти на официальный сайт ${title} →
                </a>
                <a href="/" class="px-5 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm text-center transition">
                    Открыть весь каталог
                </a>
            </div>
        </article>
    </main>

    <footer class="border-t border-white/5 py-8 text-center text-xs text-slate-600">
        <p>© 2026 AI WorkHub — Каталог проверенных нейросетей.</p>
    </footer>
</body>
</html>`;

        fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf8');
    }

    // 4. Генерируем sitemap.xml
    const today = new Date().toISOString().split('T')[0];
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${u === `${SITE_URL}/` ? '1.0' : '0.8'}</priority>
  </url>`).join('\n')}
</urlset>`;
    fs.writeFileSync('sitemap.xml', sitemap, 'utf8');

    // 5. Генерируем robots.txt
    const robots = `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;
    fs.writeFileSync('robots.txt', robots, 'utf8');

    // 6. Отправляем пинг в IndexNow (Яндекс + Bing)
    console.log('Отправляем ссылки в IndexNow...');
    const payload = {
        host: 'workhub-mv5.pages.dev',
        key: INDEXNOW_KEY,
        keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
        urlList: urls
    };

    for (const endpoint of ['https://yandex.com/indexnow', 'https://api.indexnow.org/indexnow']) {
        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json; charset=utf-8' },
                body: JSON.stringify(payload)
            });
            console.log(`Ответ от ${endpoint}: статус ${res.status}`);
        } catch (err) {
            console.warn(`Не удалось пингануть ${endpoint}:`, err.message);
        }
    }

    console.log('Готово! Сгенерировано страниц:', urls.length);
}

run();
