/* Документ 8. Запуск ПРЯМО: релиз и деплой — инструкция
 * Рецепт R2 + палитра ZE-1 (zinc / emerald / amber — язык дека демо-дня, без синего)
 * Уровень L0 «витрина продаж»: от песочницы концепта до публичного домена с TLS.
 * Инструкция для основателя: сервер, окружение, systemd, Caddy, бэкапы, мониторинг.
 * Пайплайн: bun gen-release.js -> add_toc_placeholders.py -> fix_toc.py -> patch_footers.py -> postcheck.py */
const {
  Paragraph, TextRun, AlignmentType, BorderStyle, ShadingType, WidthType,
  TableLayoutType, TableRow, TableCell, Table,
} = require("docx");
const {
  buildCoverR2, h1, h2, h3, body, bullet, numbered,
  buildDocument, writeDocx, CYR, CYR_BODY,
} = require("./lib");

/* ── Палитра ZE-1: zinc + emerald + amber (синий запрещён) ── */
const P = {
  bg: "18181B", accent: "10B981", headingColor: "18181B", secondary: "52525B",
  cover: { titleColor: "FFFFFF", subtitleColor: "A1A1AA", metaColor: "8E8E96", footerColor: "71717A" },
  table: { headerBg: "10B981", headerText: "09090B", accentLine: "10B981", innerLine: "E4E4E7", surface: "F4F4F5" },
};

/* Цвета вердиктов: emerald = готово/сейчас, amber = внимание/потом, zinc = нейтральное */
const C_OK = "047857";     // emerald-700
const C_WARN = "B45309";   // amber-700
const C_ZINC = "52525B";   // zinc-600
const C_BODY = "000000";

/* Вердикт-ячейка: жирное цветное слово + причина обычным текстом */
const st = (word, color, reason) => [{ t: word + ". ", b: true, c: color }, { t: reason }];
const ok = (r) => st("ГОТОВО", C_OK, r);
const warn = (r) => st("ВНИМАНИЕ", C_WARN, r);
const zinc = (r) => st("ПОТОМ", C_ZINC, r);
const free0 = [{ t: "0 ₽", b: true, c: C_OK }];

/* ── Таблица с поддержкой цветных ячеек (по образцу lib.makeTable) ── */
const NB = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
function makeTableC({ caption, headers, rows, widths, aligns, headerSize = 20, cellSize = 20 }) {
  const t = P.table;
  const out = [];
  if (caption) {
    out.push(new Paragraph({
      keepNext: true, spacing: { before: 200, after: 80, line: 312 },
      children: [new TextRun({ text: caption, bold: true, size: 21, color: P.secondary, font: CYR_BODY })],
    }));
  }
  const normCell = (cell) => {
    if (typeof cell === "string") return [{ t: cell }];
    if (Array.isArray(cell)) return cell.map((x) => (typeof x === "string" ? { t: x } : x));
    return [cell];
  };
  const mkCell = (cell, i, isHeader, rowIdx) => new TableCell({
    width: { size: widths ? widths[i] : Math.floor(100 / headers.length), type: WidthType.PERCENTAGE },
    margins: { top: 70, bottom: 70, left: 110, right: 110 },
    shading: isHeader
      ? { type: ShadingType.CLEAR, fill: t.headerBg }
      : (rowIdx % 2 === 1 ? { type: ShadingType.CLEAR, fill: t.surface } : undefined),
    children: [new Paragraph({
      alignment: aligns && aligns[i] === "r" ? AlignmentType.RIGHT : AlignmentType.LEFT,
      spacing: { line: 276 },
      children: normCell(cell).map((r) => new TextRun({
        text: r.t, bold: isHeader || !!r.b, size: isHeader ? headerSize : cellSize,
        color: isHeader ? t.headerText : (r.c || C_BODY), font: CYR_BODY,
      })),
    })],
  });
  out.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 8, color: t.accentLine },
      bottom: { style: BorderStyle.SINGLE, size: 8, color: t.accentLine },
      left: NB, right: NB,
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: t.innerLine },
      insideVertical: NB,
    },
    rows: [
      new TableRow({ tableHeader: true, cantSplit: true, children: headers.map((x, i) => mkCell(x, i, true, 0)) }),
      ...rows.map((r, ri) => new TableRow({ cantSplit: true, children: r.map((x, i) => mkCell(x, i, false, ri)) })),
    ],
  }));
  out.push(new Paragraph({ spacing: { after: 120 }, children: [] }));
  return out;
}

/* Выноска: янтарная полоса слева — для правил и порогов */
function callout(runs, opts = {}) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { before: opts.before != null ? opts.before : 120, after: 140, line: 312 },
    indent: { left: 240 },
    border: { left: { style: BorderStyle.SINGLE, size: 12, color: "F59E0B", space: 10 } },
    children: (Array.isArray(runs) ? runs : [{ t: runs }]).map((r) => new TextRun({
      text: r.t, bold: !!r.b, size: 24, color: r.c || "3F3F46", font: CYR_BODY,
    })),
  });
}

/* Код-блок: моноширинные строки на светло-цинковой подложке */
const MONO = { ascii: "Courier New", hAnsi: "Courier New" };
function codeBlock(lines) {
  return lines.map((line, i) => new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { before: i === 0 ? 80 : 0, after: i === lines.length - 1 ? 160 : 0, line: 240 },
    indent: { left: 240, right: 240 },
    shading: { type: ShadingType.CLEAR, fill: "F4F4F5" },
    children: [new TextRun({ text: line.length ? line : " ", size: 17, color: "27272A", font: MONO })],
  }));
}

const B = [];

/* ══ 1. Резюме ══ */
B.push(h1("1. Резюме", P));
B.push(body("Что значит «релиз» для ПРЯМО сейчас: публикация лендинга-витрины и живого демо на публичном домене. Это инструмент продаж и привлечения инвестиций — ссылка, которую можно отправить водителю, журналисту и инвестору вместо скриншотов. Это НЕ запуск перевозок: перевозки — фаза Ф1 «пилотный город» со своей юрструктурой, разрешениями и полевой работой (канон Документа №1)."));
B.push(body([
  { t: "Два уровня запуска. ", b: true },
  { t: "L0 «витрина продаж» — лендинг, демо-движок, пакет документов и сбор лидов waitlist на публичном домене; запускается сразу, ничего не ждёт. L1 «пилотный город» — Ф1: юрструктура, ОРНВП, город-миллионник и бюджет 0,5–0,9 млн ₽ (канон Документа №1); требования к инфраструктуре продаж собраны в отдельном документе пакета — «Инфраструктура продаж». Настоящая инструкция покрывает только L0." },
]));
B.push(body([
  { t: "Что уже готово к L0: ", b: true },
  { t: "приложение Next.js 16 (лендинг, API-роуты, калькулятор демо), мини-сервис ride-engine на bun (аукцион и ETA, порт 3003), база SQLite/Prisma (тарифы, статистика, история демо, лиды waitlist), пакет из 11 документов и QA-пайплайн перегенерации. Позиционирование лендинга — «концепт-демонстрация»: запуск L0 этот статус не меняет — витрина честно подписана, публичность лишь расширяет аудиторию, для которой он подписан." },
]));
B.push(body([
  { t: "Ключевой вывод: ", b: true },
  { t: "L0 запускается за 2–3 дня силами одного человека, бюджет 1–3 тыс ₽/мес (оценка). В коде менять ничего не нужно — меняется только окружение: VPS, systemd, reverse-proxy с TLS и бэкапы. Всё, что публикуется, уже работает в песочнице концепта." },
]));
B.push(callout([
  { t: "Правило инструкции: ", b: true },
  { t: "деплой — это окружение, а не код. Каждый шаг ниже заканчивается проверкой; следующий шаг начинается только после прохождения предыдущего. Ничего не делается «на потом» — включая приватность git-репозитория (раздел 4.3)." },
]));
B.push(body("Как читать цифры: все количественные оценки помечены статусом — (оценка) или (допущение); значения без пометки — канон Документа №1 и факты песочницы концепта. Команды и конфиги приведены как образцы для копирования, домен и IP — плейсхолдеры."));

/* ══ 2. Компоненты релиза ══ */
B.push(h1("2. Компоненты релиза", P));
B.push(body("Витрина L0 — это пять компонентов. Все они уже существуют в песочнице; деплой переносит их на сервер без изменения кода."));
B.push(...makeTableC({
  caption: "Таблица 1. Компоненты релиза L0: роль, порт, что именно деплоим",
  headers: ["Компонент", "Роль в витрине", "Порт", "Что деплоим"],
  widths: [19, 33, 9, 39],
  rows: [
    ["Next.js-приложение", "Лендинг-витрина, API-роуты (калькулятор, тарифы, статистика, waitlist), демо-интерфейсы водителя и пассажира", ":3000", "Production-сборка: bun run build → bun run start; systemd-юнит pryamo-web (раздел 4.7)"],
    ["ride-engine мини-сервис", "WebSocket-симулятор живого рынка: аукцион заказов, ETA, лента stats:live", ":3003", "bun-процесс, юнит pryamo-engine; наружу не публикуется — только через reverse-proxy"],
    ["База SQLite (файл по DATABASE_URL)", "Тарифы, профили драйверов, история демо, рыночная статистика, лиды waitlist", "—", "Схема — bun run db:push, данные — сид-скрипты; предмет ежедневных бэкапов (раздел 6.2)"],
    ["/public/docs — пакет документов", "11 файлов: стратегия, база знаний, GTM, роадмап, финмодель, питч + 4 новые инструкции пакета (включая настоящую)", "через :3000", "Едут внутри сборки (каталог public/), отдаются приложением как статика"],
    ["Caddy", "Reverse-proxy: TLS, gzip, проксирование приложения и WebSocket движка", ":80, :443", "Единственная публичная точка входа; конфиг — раздел 4.8"],
  ],
}));
B.push(body([
  { t: "Почему такая архитектура: ", b: true },
  { t: "мини-сервисы на bun — маленькие процессы с одной задачей, каждый живёт под systemd и рестартует сам; наружу торчит один публичный порт 443 (и 80 для редиректа на TLS), всё остальное — внутренние адреса на 127.0.0.1. Такова же схема песочницы: локальный Caddy на :81 проксирует :3000 и движок — прод всего лишь повторяет её на настоящем домене. Поверхность атаки минимальна, а WebSocket движка поднимается тем же прокси без отдельных настроек." },
]));

/* ══ 3. Выбор инфраструктуры ══ */
B.push(h1("3. Выбор инфраструктуры", P));
B.push(body("L0 не требует ни облака, ни k8s, ни managed-базы. Один обычный VPS закрывает все пять компонентов с запасом: демо-нагрузка витрины — это десятки одновременных соединений, не тысячи."));
B.push(...makeTableC({
  caption: "Таблица 2. Инфраструктура L0: позиции, варианты, ориентиры цен",
  headers: ["Позиция", "Варианты", "Ориентир цены"],
  widths: [29, 33, 38],
  rows: [
    ["VPS 2 vCPU / 4 ГБ RAM / 40–60 ГБ NVMe", "Timeweb Cloud, Reg.ru, Selectel", "600–2 500 ₽/мес (оценка; промо-тарифы бывают дешевле)"],
    ["Домен .ru", "reg.ru и другие регистраторы", "200–900 ₽/год"],
    ["TLS-сертификат", "Let's Encrypt", [{ t: "0 ₽ — ", b: true, c: C_OK }, { t: "выпуск и продление автоматически через Caddy" }]],
    ["Второй поддомен staging", "beta.домен.ру на том же сервере", [{ t: "0 ₽ ", b: true, c: C_OK }, { t: "дополнительно — та же машина и DNS" }]],
  ],
}));
B.push(h3("Требования к VPS", P));
B.push(bullet("Ubuntu 24.04 LTS — свежий LTS со стандартной поддержкой до 2029 года; все команды инструкции написаны под него.", P));
B.push(bullet("Полный доступ root по SSH и возможность заливки ключей — любой VPS это умеет.", P));
B.push(bullet("Локация РФ: лиды waitlist — персональные данные, их хранение в РФ обязательно по 152-ФЗ; юридическая сторона сбора и хранения — «Инфраструктура продаж», отдельный документ пакета.", P));
B.push(bullet("Поддержка bun: любой Linux x64 — отдельные требования отсутствуют.", P));
B.push(h3("Почему НЕ shared-хостинг", P));
B.push(body("Shared-хостинг умеет PHP и статику. Витрине нужны: собственный рантайм bun, два фоновых процесса под systemd (приложение и движок) и WebSocket. Всё это — определения VPS, а не «верхний тариф хостинга». Попытка вписаться в shared обернётся костылями дороже, чем 600 ₽/мес (оценка) за честную виртуалку."));

/* ══ 4. Пошаговый деплой L0 ══ */
B.push(h1("4. Пошаговый деплой L0", P));
B.push(body("Десять шагов от чистого VPS до публичного домена. Ориентир по дням (оценка): день 1 — шаги 4.1–4.5 (сервер, окружение, код, база, сборка), день 2 — шаги 4.6–4.9 (движок, systemd, Caddy, DNS), день 3 — smoke-тест и публикация ссылки. Команды выполняются от пользователя deploy, если не указано sudo."));
B.push(h2("4.1. Подготовка сервера", P));
B.push(body("Создать VPS у провайдера (Ubuntu 24.04 LTS, тариф из Таблицы 2) и записать выделенный IP. Войти по SSH от root и сделать первичную настройку: пользователь deploy с sudo и ключом."));
B.push(...codeBlock([
  "ssh root@IP_СЕРВЕРА",
  "adduser deploy",
  "usermod -aG sudo deploy",
  "# с машины разработчика — залить свой ключ:",
  "ssh-copy-id deploy@IP_СЕРВЕРА",
]));
B.push(body("Проверить вход ключом в НОВОЙ сессии (ssh deploy@IP_СЕРВЕРА без пароля), затем закрыть пароли и root-вход — файл /etc/ssh/sshd_config:"));
B.push(...codeBlock([
  "PasswordAuthentication no",
  "PermitRootLogin no",
]));
B.push(...codeBlock([
  "sudo systemctl restart ssh",
]));
B.push(body("Файрвол и обновления: наружу открыты только SSH и два веб-порта; порты 3000 и 3003 в ufw НЕ открываются никогда — их публикует Caddy."));
B.push(...codeBlock([
  "sudo ufw allow OpenSSH",
  "sudo ufw allow 80/tcp",
  "sudo ufw allow 443/tcp",
  "sudo ufw enable",
  "sudo apt update && sudo apt upgrade -y",
]));
B.push(callout([
  { t: "Правило SSH-сессии: ", b: true },
  { t: "не закрывайте текущую сессию, пока не проверили вход по ключу в новой. Одна закрытая до проверки сессия — и сервер переустанавливается через панель провайдера." },
]));
B.push(h2("4.2. Окружение", P));
B.push(body("Рантайм всего проекта — bun: на нём работает и запуск Next.js, и движок. Плюс git для кода и sqlite3 для бэкапов (раздел 6.2)."));
B.push(...codeBlock([
  "curl -fsSL https://bun.sh/install | bash     # под пользователем deploy",
  "sudo apt install -y git sqlite3",
  "bun --version && git --version && sqlite3 --version",
]));
B.push(body("Важно для следующих шагов: bun устанавливается в /home/deploy/.bun/bin/bun. systemd не читает PATH пользователя, поэтому в юнитах (4.6–4.7) ExecStart пишется абсолютным путём."));
B.push(h2("4.3. Код и секреты", P));
B.push(body("Репозиторий переводится в ПРИВАТНЫЙ до деплоя (подтверждение — открытый вопрос 5 раздела 9): в нём тексты концепта и структура секретов. Клонирование в /opt/pryamo:"));
B.push(...codeBlock([
  "sudo mkdir -p /opt/pryamo && sudo chown deploy:deploy /opt/pryamo",
  "git clone git@ВАШ_ХОСТИНГ:АККАУНТ/pryamo.git /opt/pryamo",
]));
B.push(body("Файл .env — единственное место секретов. В песочнице он содержит DATABASE_URL с абсолютным путём машины разработчика; на сервере путь меняется на серверный — это частая ошибка первого деплоя."));
B.push(...codeBlock([
  "mkdir -p /opt/pryamo/db",
  "nano /opt/pryamo/.env",
  "chmod 600 /opt/pryamo/.env",
]));
B.push(...codeBlock([
  "DATABASE_URL=file:/opt/pryamo/db/custom.db",
  "# секреты будущих интеграций (почта, платёжка) — сюда же",
]));
B.push(callout([
  { t: "Правило секретов: ", b: true },
  { t: ".env никогда не попадает в git (проверить .gitignore), права 600, ротация при каждой смене доступа подрядчика. Утечка DATABASE_URL — это утечка всех лидов waitlist." },
]));
B.push(h2("4.4. База", P));
B.push(body("Схема накатывается через prisma db push, затем — сиды песочницы: prisma/seed.ts (семь тарифов с народными именами, профили драйверов, история демо, рыночная статистика) и prisma/seed-waitlist.ts (демо-набор лидов). Демо-лиды на публичной витрине — по решению основателя: честность «концепт-демонстрации» дороже красивой цифры в счётчике."));
B.push(...codeBlock([
  "cd /opt/pryamo",
  "bun install",
  "(cd mini-services/ride-engine && bun install)",
  "bun run db:push",
  "bun prisma/seed.ts",
  "bun prisma/seed-waitlist.ts",
  "ls -la db/custom.db",
]));
B.push(body("Зависимости ставятся в ДВУХ местах: корень (Next.js) и mini-services/ride-engine (socket.io движка). Забытый второй install — вторая по частоте ошибка первого деплоя."));
B.push(h2("4.5. Сборка фронтенда", P));
B.push(...codeBlock([
  "bun run build",
  "bun run start        # ручная проверка; остановить Ctrl+C",
  "curl -fsS -o /dev/null http://127.0.0.1:3000/",
]));
B.push(body("Примечание: в песочнице концепта работал dev-режим (next dev с HMR и dev.log). В проде — production build: быстрее отдача, стабильнее память, нет файлового вотчера. Код тот же — меняется только режим запуска. После ручной проверки процесс останавливается и передаётся systemd."));
B.push(h2("4.6. Мини-сервис ride-engine", P));
B.push(body("Движок — bun-процесс с socket.io; порт 3003 фиксирован контрактом и не читается из окружения. Наружу он не публикуется: браузер ходит на домен сайта, а Caddy проксирует WebSocket на 127.0.0.1:3003 (раздел 4.8). Юнит /etc/systemd/system/pryamo-engine.service:"));
B.push(...codeBlock([
  "[Unit]",
  "Description=PRYAMO ride-engine (аукцион и ETA демо, порт 3003)",
  "After=network.target",
  "",
  "[Service]",
  "Type=simple",
  "User=deploy",
  "WorkingDirectory=/opt/pryamo/mini-services/ride-engine",
  "ExecStart=/home/deploy/.bun/bin/bun run index.ts",
  "Restart=always",
  "RestartSec=3",
  "Environment=NODE_ENV=production",
  "",
  "[Install]",
  "WantedBy=multi-user.target",
]));
B.push(...codeBlock([
  "sudo systemctl daemon-reload",
  "sudo systemctl enable --now pryamo-engine.service",
  "systemctl status pryamo-engine --no-pager",
]));
B.push(body("Restart=always — не украшение, а часть защиты от OOM (раздел 7.2): если процесс умрёт, systemd поднимет его через 3 секунды."));
B.push(h2("4.7. systemd для Next.js", P));
B.push(body("Юнит приложения /etc/systemd/system/pryamo-web.service. Приложение слушает только loopback (HOSTNAME=127.0.0.1) — двойная защита вместе с ufw: даже ошибочно открытый порт не опубликует приложение наружу."));
B.push(...codeBlock([
  "[Unit]",
  "Description=PRYAMO web (Next.js 16, production, порт 3000)",
  "After=network.target pryamo-engine.service",
  "",
  "[Service]",
  "Type=simple",
  "User=deploy",
  "WorkingDirectory=/opt/pryamo",
  "ExecStart=/home/deploy/.bun/bin/bun run start",
  "Restart=always",
  "RestartSec=3",
  "Environment=NODE_ENV=production",
  "Environment=PORT=3000",
  "Environment=HOSTNAME=127.0.0.1",
  "",
  "[Install]",
  "WantedBy=multi-user.target",
]));
B.push(...codeBlock([
  "sudo systemctl daemon-reload",
  "sudo systemctl enable --now pryamo-web.service",
  "curl -fsS -o /dev/null http://127.0.0.1:3000/",
]));
B.push(...makeTableC({
  caption: "Таблица 3. systemd-юниты витрины L0",
  headers: ["Юнит", "Служба", "ExecStart", "Автозапуск"],
  widths: [22, 26, 30, 22],
  rows: [
    ["pryamo-web.service", "Next.js-приложение, :3000", "/home/deploy/.bun/bin/bun run start", [{ t: "enable + ", b: true }, { t: "Restart=always" }]],
    ["pryamo-engine.service", "ride-engine, :3003", "/home/deploy/.bun/bin/bun run index.ts", [{ t: "enable + ", b: true }, { t: "Restart=always" }]],
    ["caddy.service", "Reverse-proxy, TLS", "пакетный (apt), правка не нужна", [{ t: "enable", b: true }, { t: " — штатный юнит пакета" }]],
    ["pryamo-web-beta.service", "Staging-копия, :3100 (опция)", "тот же start в /opt/pryamo-beta", zinc("по решению основателя — вопрос 4 раздела 9")],
  ],
}));
B.push(h2("4.8. Caddy reverse-proxy", P));
B.push(body("Caddy — единственная публичная дверь витрины: Terminates TLS, сжимает gzip и проксирует трафик. Установка из официального apt-репозитория:"));
B.push(...codeBlock([
  "sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl",
  "curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg",
  "curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list",
  "sudo apt update && sudo apt install -y caddy",
]));
B.push(body("Конфиг /etc/caddy/Caddyfile — прод-версия уже проверенного конфига песочницы (там Caddy на :81 проксирует :3000 и движок по параметру XTransformPort). Отличия: настоящий домен вместо :81 и суженный матчер — в проде проксируется только порт 3003, а не любой."));
B.push(...codeBlock([
  "домен.ру {",
  "    encode gzip",
  "",
  "    # WebSocket демо-движка: браузер ходит на тот же домен",
  "    @engine query XTransformPort=3003",
  "    handle @engine {",
  "        reverse_proxy 127.0.0.1:3003",
  "    }",
  "",
  "    # всё остальное — Next.js-приложение",
  "    handle {",
  "        reverse_proxy 127.0.0.1:3000",
  "    }",
  "}",
]));
B.push(...codeBlock([
  "sudo systemctl reload caddy",
]));
B.push(body("TLS: Caddy сам получает сертификат Let's Encrypt при первом обращении к домену и сам же продлевает его в дальнейшем — certbot не нужен, ручной перевыпуск не нужен. WebSocket поднимается тем же reverse_proxy без отдельных настроек. Если Caddy уже запущен с дефолтным конфигом на :80 — файл заменяется целиком, затем reload."));
B.push(h2("4.9. DNS", P));
B.push(body("У регистратора домена добавляются записи из Таблицы 4. Проверка: dig +short домен.ру должен вернуть IP сервера. TTL 3600 — час на расползание кэша DNS при сменах."));
B.push(...makeTableC({
  caption: "Таблица 4. DNS-записи домена L0",
  headers: ["Запись", "Тип", "Значение", "TTL", "Назначение"],
  widths: [11, 9, 24, 9, 47],
  rows: [
    ["@", "A", "IP сервера", "3600", "Основной домен: домен.ру → VPS витрины"],
    ["www", "CNAME", "домен.ру", "3600", "Привычный алиас (опционально, редирект делает Caddy)"],
    ["beta", "A", "IP сервера", "3600", "Staging-стенд — добавляется сразу, используется по решению (вопрос 4)"],
  ],
}));
B.push(body("Запись beta добавляется в тот же момент, даже если staging пока не нужен: DNS будет готово заранее и сто́ит 0 ₽."));
B.push(h2("4.10. Smoke-тест после деплоя", P));
B.push(body("Финальная проверка перед публикацией ссылки — и обязательная проверка после КАЖДОГО обновления (раздел 6), а не только первого деплоя. Прогоняется целиком:"));
B.push(numbered("Страница / открывается и рендерится: заголовок, секции, калькулятор на месте; первый ответ сервера — до 1 секунды (оценка).", "nl-smoke"));
B.push(numbered("Калькулятор демо отвечает: POST /api/calculator возвращает расчёт поездки с раскладкой 88/12.", "nl-smoke"));
B.push(numbered("Документы отдаются: HEAD-запросы к /docs/*.docx и остальным файлам пакета — статус 200; всего 11 файлов после публикации пакета (7 сегодняшних + 4 новые инструкции, включая настоящий документ).", "nl-smoke"));
B.push(numbered("WebSocket демо живой: статус движка в шапке меняется, лента заказов идёт — значит Caddy проксирует порт 3003, а движок работает.", "nl-smoke"));
B.push(numbered("Мобильная ширина 375 пикселей: горизонтальный скролл отсутствует.", "nl-smoke"));
B.push(numbered("Футер прижат к низу на коротких страницах; в консоли браузера — 0 ошибок.", "nl-smoke"));
B.push(callout([
  { t: "Чек-лист «перед публикацией ссылки»: ", b: true },
  { t: "прогнать smoke-тест целиком; открыть консоль браузера и убедиться в 0 ошибок; кликнуть все ссылки футера — каждый документ должен скачиваться (7 сегодня, 11 после выхода пакета). Только после этого домен публикуется в каналах, письмах и презентациях." },
]));

/* ══ 5. Стенды и управление версиями ══ */
B.push(h1("5. Стенды и управление версиями", P));
B.push(h2("5.1. Три стенда", P));
B.push(body("Стенд dev — это и есть песочница концепта: браузерные тесты в ней ходят через локальный Caddy на :81 — тот же паттерн проксирования, что и в проде, поэтому «работало в песочнице» переносится на домен почти дословно."));
B.push(...makeTableC({
  caption: "Таблица 5. Стенды ПРЯМО: домены, назначение, доступ",
  headers: ["Стенд", "Домен", "Назначение", "Кто видит"],
  widths: [11, 29, 34, 26],
  rows: [
    ["dev", "localhost песочницы (:3000 прямой, :81 через Caddy)", "Разработка, QA-пайплайн, генерация docx из docs-src", "Только машина разработчика"],
    ["staging", "beta.домен.ру", "Предрелизная проверка тега на сервере до prod", "Основатель и доверенные проверяющие"],
    ["prod", "домен.ру", "Публичная витрина L0", "Все: водители, пассажиры, инвесторы"],
  ],
}));
B.push(body("Staging разворачивается на той же машине: отдельная директория /opt/pryamo-beta, порт 3100, юнит pryamo-web-beta и блок beta.домен.ру в Caddyfile. Нужен ли он уже на L0 — открытый вопрос 4 раздела 9: у одного администратора и замороженной витрины предрелизная проверка может быть избыточна."));
B.push(h2("5.2. Версии: теги, CHANGELOG, feature freeze", P));
B.push(body("Каждый релиз витрины — тег по семверу: v0.1.0 — первый публичный деплой, v0.1.1 — патч, v0.2.0 — содержательное изменение. Каждому тегу — запись в CHANGELOG.md: что изменилось, почему, кем проверено. Тег ставится на машине разработчика; сервер получает его через update.sh (раздел 6.1)."));
B.push(body([
  { t: "Правило главного сейчас: ", b: true },
  { t: "feature freeze — код витрины заморожен (решение основателя). В prod идут только исправления из списка критических багов. Содержательные доработки живут в ветках, попадают на staging и ждут своего тега — так публичная витрина остаётся предсказуемой, а история изменений читается одной страницей." },
]));
B.push(body("Пайплайн перегенерации docx (add_toc_placeholders → fix_toc → patch_footers → postcheck) живёт на машине разработчика и на сервер не переезжает: в prod едут уже готовые файлы через git."));

/* ══ 6. Обновления и откат ══ */
B.push(h1("6. Обновления и откат", P));
B.push(h2("6.1. Деплой-скрипт update.sh", P));
B.push(body("Обновление — всегда тег, никогда ветка и никогда «последний коммит». Скрипт /opt/pryamo/update.sh:"));
B.push(...codeBlock([
  "#!/usr/bin/env bash",
  "# Деплой тега на prod: ./update.sh v0.1.1",
  "set -euo pipefail",
  "cd /opt/pryamo",
  'TAG="${1:?укажите тег, например: ./update.sh v0.1.1}"',
  "",
  "# 1. бэкап до деплоя — правило раздела 6.2",
  './backup.sh "pre-deploy-$TAG"',
  "",
  "# 2. код тега",
  "git fetch --tags",
  'git checkout "$TAG"',
  "",
  "# 3. зависимости: корень + движок",
  "bun install",
  "(cd mini-services/ride-engine && bun install)",
  "",
  "# 4. схема базы",
  "bun run db:push",
  "",
  "# 5. сборка и рестарт",
  "bun run build",
  "sudo systemctl restart pryamo-engine pryamo-web",
  "",
  "# 6. smoke-минимум",
  'curl -fsS -o /dev/null http://127.0.0.1:3000/ || { echo "FAIL: :3000 не отвечает"; exit 1; }',
  'echo "OK: деплой $TAG завершён"',
]));
B.push(body("Предостережение по шагу 4: db:push с флагом --accept-data-loss может стереть данные при деструктивной смене схемы. Если prisma предлагает потерю данных — остановиться, проверить бэкап (шаг 1 уже сделан) и перечитать миграцию глазами. Полный smoke-тест раздела 4.10 прогоняется после каждого update.sh."));
B.push(callout([
  { t: "Правило живого прошлого тега: ", b: true },
  { t: "деплой разрешён только при живом предыдущем теге — прошлом рабочем состоянии, к которому можно откатиться. Прошлые теги не удаляются ни из репозитория, ни с сервера." },
]));
B.push(h2("6.2. Бэкапы", P));
B.push(body("Мотивация проста: база — единственное место, где живут лиды waitlist и история демо; всё остальное пересобирается из git за минуты. Скрипт /opt/pryamo/backup.sh:"));
B.push(...codeBlock([
  "#!/usr/bin/env bash",
  "# Бэкап L0: база + документы + секреты → /backups, хранение 30 дней",
  "set -euo pipefail",
  'STAMP="${1:-$(date +%F)}"',
  "mkdir -p /backups",
  'sqlite3 /opt/pryamo/db/custom.db ".backup /backups/db-$STAMP.sqlite"',
  "cp -r /opt/pryamo/public/docs /backups/docs-$STAMP",
  "cp /opt/pryamo/.env /backups/env-$STAMP && chmod 600 /backups/env-$STAMP",
  "find /backups -type f -mtime +30 -delete",
]));
B.push(body("Автоматика — cron пользователя deploy (crontab -e):"));
B.push(...codeBlock([
  "0 4 * * * /opt/pryamo/backup.sh >> /var/log/pryamo-backup.log 2>&1",
]));
B.push(...makeTableC({
  caption: "Таблица 6. Объекты бэкапа L0: способ, частота, хранение",
  headers: ["Объект", "Способ", "Частота", "Хранение"],
  widths: [26, 26, 24, 24],
  rows: [
    ["База SQLite (db/custom.db)", "sqlite3 .backup — онлайн, без остановки сервисов", "Ежедневно в 4:00 + перед каждым деплоем", "30 дней на сервере; офлайн-копия раз в неделю"],
    ["Пакет /public/docs (11 файлов)", "Копия каталога в /backups", "Ежедневно в 4:00", "30 дней на сервере"],
    [".env", "Копия с правами 600", "При изменении + перед деплоем", "30 дней; офлайн-копия вместе с базой"],
    ["Git-репозиторий", "push тегов в приватный remote", "На каждый коммит и релиз", "У хостинга кода — бессрочно"],
  ],
}));
B.push(body("Офлайн-копия: раз в неделю скачать свежий бэкап базы и .env на личный диск или в облако (вопрос 6 раздела 9). Серверный RAID — не бэкап: при закрытии аккаунта провайдера исчезает всё сразу."));
B.push(h2("6.3. Откат", P));
B.push(body("Последовательность отката на прошлый тег: остановить сервисы, вернуться на прошлый тег, при необходимости восстановить базу из бэкапа, запустить:"));
B.push(...codeBlock([
  "sudo systemctl stop pryamo-web pryamo-engine",
  "cd /opt/pryamo",
  "git checkout v0.1.0                # прошлый живой тег",
  "bun install",
  "bun run build",
  "cp /backups/db-pre-deploy-v0.1.1.sqlite /opt/pryamo/db/custom.db   # если менялась схема",
  "sudo systemctl start pryamo-engine pryamo-web",
]));
B.push(...makeTableC({
  caption: "Таблица 7. Сценарии отката L0 и ориентиры времени (оценка)",
  headers: ["Сценарий", "Действия", "Ориентир времени"],
  widths: [28, 48, 24],
  rows: [
    ["Битый релиз: сборка или рантайм-ошибка", "checkout прошлого тега, install, build, restart", "10–15 минут"],
    ["Битая смена схемы базы", "restore базы из бэкапа pre-deploy + checkout прошлого тега", "15–30 минут"],
    ["Ошибка в контенте витрины", "ветка-фикс → тег-патч v0.1.1 → update.sh (без простоя: жив прошлый тег)", "часы, публикация не прерывается"],
    ["Потеря сервера целиком", "новый VPS, шаги 4.1–4.9, restore базы из офлайн-копии", "3–4 часа"],
  ],
}));

/* ══ 7. Мониторинг и безопасность ══ */
B.push(h1("7. Мониторинг и безопасность", P));
B.push(h2("7.1. Пять рисков и инструменты", P));
B.push(body("Все инструменты бесплатны; платится только VPS и домен. Uptime-мониторинг заводится в день публикации домена — до первой рассылки ссылки, а не после первого падения."));
B.push(...makeTableC({
  caption: "Таблица 8. Риски L0: инструменты, цена, реакция",
  headers: ["Риск", "Инструмент", "Цена", "Реакция и вердикт"],
  widths: [17, 32, 8, 43],
  rows: [
    ["Падение сайта", "Uptime-бот с алертом в Telegram (бесплатный тариф внешнего сервиса или свой cron-curl)", free0, ok("алерт приходит быстрее 5 минут; сервис поднимет systemd (Restart=always) — бот нужен чтобы узнать об этом")],
    ["OOM — кончилась память", "Своп 2 ГБ на VPS + контроль free -m в еженедельном обходе", free0, warn("главный технический риск L0 — раздел 7.2; автоподъём есть, узнать надо раньше")],
    ["Диск забит логами", "logrotate + лимит журнала systemd (SystemMaxUse=500M)", free0, ok("ротация по расписанию, внимания почти не требует")],
    ["Взлом сервера", "Ключи вместо паролей (4.1), fail2ban, обновления ОС раз в неделю", free0, ok("sudo apt install -y fail2ban — дефолтов для sshd достаточно; apt upgrade по напоминанию в календаре")],
    ["Утечка секретов", ".env с правами 600 и вне git (4.3); ротация при смене подрядчиков", free0, warn("процедурный риск: закрывается дисциплиной, а не софтом")],
  ],
}));
B.push(h2("7.2. Памятка OOM: из песочницы — в прод", P));
B.push(body("В песочнице концепта был живой прецедент: dev-процесс умирал от нехватки памяти, контроль — curl :3000 и free -m. Памятка переносится в прод с тремя поправками уровня L0: production build ест заметно меньше dev (нет вотчера HMR — проверяется первой неделей, допущение), своп обязателен, а оба юнита уже имеют Restart=always."));
B.push(...codeBlock([
  "sudo fallocate -l 2G /swapfile",
  "sudo chmod 600 /swapfile",
  "sudo mkswap /swapfile && sudo swapon /swapfile",
  "echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab",
]));
B.push(callout([
  { t: "Порог тревоги памяти: ", b: true },
  { t: "при свободной памяти ниже ~300 МБ (оценка) или появлении своп-активности в спокойные часы — разбираться в тот же день: смотреть free -m, journalctl -u pryamo-web и при необходимости поднимать тариф VPS на ступень (600 ₽/мес, оценка)." },
]));

/* ══ 8. Бюджет L0 ══ */
B.push(h1("8. Бюджет L0", P));
B.push(body("Смета витрины — это одна позиция с ценой и три бесплатных. Ни одна строка не требует решения «по бюджету»: всё в пределах карманных расходов проекта."));
B.push(...makeTableC({
  caption: "Таблица 9. Бюджет L0: месяц и год (оценка)",
  headers: ["Статья", "В месяц", "В год"],
  widths: [42, 28, 30],
  aligns: [null, "r", "r"],
  rows: [
    ["VPS 2 vCPU / 4 ГБ / 40–60 ГБ NVMe", "600–2 500 ₽", "7 200–30 000 ₽"],
    ["Домен .ru (200–900 ₽/год в пересчёте)", "0–75 ₽", "200–900 ₽"],
    ["TLS, мониторинг, fail2ban, бэкапы", "0 ₽", "0 ₽"],
    [{ t: "Итого витрина L0", b: true }, { t: "700–2 600 ₽/мес (оценка)", b: true }, { t: "8 400–31 200 ₽ (оценка)", b: true }],
  ],
}));
B.push(body("Труд: 2–3 дня первого деплоя по настоящей инструкции и 1–2 часа в месяц на сопровождение — обновления, бэкапы, обход монитора (допущение; при подрядчике на сопровождении — та же часовая рамка, вопрос 3 раздела 9)."));
B.push(callout([
  { t: "Весь бюджет запуска витрины — меньше одного дня платного трафика. ", b: true },
  { t: "На старте Ф1 платный трафик запрещён порогом бюджета (канон Документа №1), а витрина при этом работает на привлечение каждый день. У L0 нет причины не существовать." },
]));

/* ══ 9. Открытые вопросы основателю ══ */
B.push(h1("9. Открытые вопросы основателю", P));
B.push(body("Шесть решений до первого деплоя — каждое закрывается одной строкой ответа:"));
B.push(numbered("Имя домена: pryamo.ru / pryamo.taxi / транслит — проверить занятость до регистрации (занятый домен обнуляет половину DNS-шага); на выбор — вечер.", "nl-open"));
B.push(numbered("Провайдер VPS: предпочтение по цене и поддержке. Рекомендация: начать с любого из трёх (Таблица 2) — миграция VPS на VPS по этой инструкции занимает вечер.", "nl-open"));
B.push(numbered("Кто администрирует: основатель сам по настоящей инструкции или подрядчик на сопровождении (1–2 часа/мес, допущение) — от ответа зависит, писать ли пароли доступа в договор подряда.", "nl-open"));
B.push(numbered("Нужен ли staging на L0 или только на L1: у замороженной витрины предрелизная проверка может быть избыточна (раздел 5.1) — но beta-поддомен бесплатен и заведён заранее.", "nl-open"));
B.push(numbered("Приватизация git-репозитория до первого деплоя — обязательный шаг (раздел 4.3): подтвердить, и он выполняется до клонирования на сервер.", "nl-open"));
B.push(numbered("Куда складывать офлайн-бэкапы: личный диск или облако (раздел 6.2) — место и периодичность ручной копии раз в неделю.", "nl-open"));

/* ── Сборка ── */
const doc = buildDocument({
  coverChildren: buildCoverR2({
    title: "Запуск ПРЯМО: релиз и деплой",
    subtitle: "Инструкция от песочницы до публичного домена",
    englishLabel: "PRYAMO RELEASE & DEPLOY GUIDE",
    metaLines: [
      "Уровень L0 витрина продаж: 2–3 дня (оценка)",
      "VPS + домен + TLS: 1–3 тыс ₽/мес (оценка)",
      "Деплой-скрипты, systemd, Caddy, бэкапы, мониторинг",
      "Версия 1.0 · октябрь 2026",
    ],
    footerRight: "ПРЯМО · Конфиденциально",
    palette: P,
  }),
  bodyChildren: B,
  runningTitle: "ПРЯМО · Релиз и деплой",
  numberingRefs: ["nl-smoke", "nl-open"],
});

writeDocx(doc, "../public/docs/pryamo-release-deploy-guide.docx");
