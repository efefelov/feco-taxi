# Task ID: 2 — WebSocket ride-engine мини-сервис (порт 3003)

Агент: full-stack-developer
Статус: ГОТОВО, сервис ЗАПУЩЕН и работает (bun --hot, PID смотри в engine.log).

## Что сделано

Проект: `/home/z/my-project/mini-services/ride-engine/` (независимый Bun-проект, ничего в src/ не трогал).

Файлы:
- `package.json` — name "ride-engine", `"dev": "bun --hot index.ts"`, deps: socket.io@4.8.4, devDeps: bun-types
- `tsconfig.json` — strict, module esnext, moduleResolution bundler, target **ESNext** (см. отклонения)
- `index.ts` — весь движок (~850 строк, строгий TypeScript, `bun x tsc --noEmit` — 0 ошибок)
- `engine.log` — логи запущенного сервиса

## Как запустить / перезапустить

```bash
# ВАЖНО: песочница убивает прямых детей шелла после завершения команды Bash,
# поэтому стартуем через двойной форк (subshell + setsid):
cd /home/z/my-project/mini-services/ride-engine
( setsid nohup bun run dev > engine.log 2>&1 < /dev/null & )
# проверка:
curl "http://localhost:3003/socket.io/?EIO=4&transport=polling"   # -> 0{"sid":...}
```

Сейчас сервис уже запущен таким способом и переживает завершение Bash-сессий.

## Контракт событий — статус: ПОЛНОСТЬЮ РЕАЛИЗОВАН

Проверено интеграционным тестом (socket.io-client, 24 PASS за ~61 сек):
driver-сокет: feed:state/demand:state/stats:live/driver:earnings при driver:join, orders:new,
orders:remove(taken|expired), полный цикл driver:accept (arriving->onboard->completed + receipt,
обновление driver:earnings, lastRides хранит 5), accept-failed, go-online/offline, decline (no-op).
Пассажирский сокет: passenger:join, passenger:book -> searching -> arriving -> onboard -> completed
(6-12 сек поиск, водитель из пула 12, прогресс 0->0.25->1.0, eta убывает), receipt, ride:rate -> ride:rated.
Fallback'и: book с пустым payload -> случайные адреса/тариф. Отключение сокета в поездке -> таймер чистится.

Через Caddy-шлюз тоже проверено: `io('/', { path: '/socket.io', query: { XTransformPort: '3003' } })`
работает (websocket + polling), порт 81 проброшен на 3003 корректно.

## Отклонения/дополнения от контракта (безопасные для фронтенда)

1. `ride:state` несёт ДОПОЛНИТЕЛЬНОЕ поле `hint: string` — ротация русских подсказок
   ("Ищем ближайшего водителя...", "Найдено N водителей рядом", "Вы едете к пассажиру"...).
   Аддитивно; фронтенд может игнорировать.
2. `RideDTO.driver === null` пока статус `searching` (водитель ещё не назначен). При `arriving/onboard/completed`
   водитель всегда есть. Фронтенду: рисовать карточку водителя только когда `ride.driver != null`.
   При `searching` ride уже содержит from/to/distanceKm/priceTotal (оценка до подачи).
3. `driver:accept-failed` помимо `reason: 'taken'` может вернуть `reason: 'busy'`
   (сокет-водитель уже в активной поездке). Аддитивное значение.
4. tsconfig `target: "ESNext"` вместо "bun": tsc не принимает "Bun" как target (TS6046).
   На рантайм не влияет — bun исполняет TS напрямую.
5. Стартовые `driver:earnings` рандомизированы вокруг примера из ТЗ (~20-34 поездки,
   gross ~9-17 тыс руб, часы 6.5-9.5), чтобы разные водители видели разные числа.
6. `demand:state` и `stats:live` рассылаются КАЖДОМУ подключённому сокету раз в 5 сек
   (по ТЗ "ALL connected sockets"), а не только joined-ролям.
7. Лента: если уже 8 заказов — новые не создаются, пока слот не освободится (expiry 35-60 c / taken).
8. Тариф "Межгород": multiplier 1.0 в DTO, спец-цена за счёт perKm = 34 руб/км; заказам intercity
   дистанция 18-28 км.
9. Surge: применяется к заказу/поездке, если спрос зоны ПОДАЧИ > 60; коэффициент из зоны (кап 1.5).

## Числа симуляции

- Зоны: 6, координаты по контракту; спрос 5..95 random walk каждые 5 сек;
  surge = 1 + max(0, demand-60)/100 (кап 1.5); waitingDrivers = f(demand) обратно;
  avgWaitMin = 2..12 от спроса; ordersWaiting = реальные заказы ленты зоны + спрос/30.
- Заказы: каждые 4-9 сек, максимум 8; id ORD-XXXX; адреса — 12 улиц на зону (случайный номер дома)
  + 12 фиксированных точек аэропорта; дистанция по геометрии зон (2-28 км), длительность = км*2.2+4;
  цена = (79 + 14/км*км + 6/мин*мин) * множитель * surge, округление до 10 руб; выплата = round(цена*0.92).
- Тарифы: eco 1.0 (вес 45), comfort 1.35 (25), comfort-plus 1.7 (11), business 2.4 (6),
  van 1.5 (9), intercity 34 руб/км (4).
- Статистика каждые 5 сек: activeDrivers 40-90, onlineDrivers 120-260, ordersPerHour 300-700,
  avgWaitSec 90-420, completedToday от ~12400, grossTodayRub от ~5.6 млн; растут от фоновых
  завершённых поездок (~ordersPerHour) + каждая реальная завершённая поездка клиента добавляет цену.
- Поездка пассажира: поиск 6-12 сек (тики 2 сек с хинтами) -> arriving eta 3-7 (3 тика, прогресс до 0.25)
  -> onboard eta = длительность (примерно 20 тиков, прогресс 0.25->1.0) -> ride:completed с чеком.
- Поездка водителя (driver:accept): сразу arriving (водитель = identity сокета), дальше тот же цикл;
  по завершении driver:earnings обновляется, ride встаёт в начало lastRides (макс 5).

## Файлы проверки (вне проекта, можно удалить)

- `/home/z/ride-engine-test/client.ts` — интеграционный тест (24 проверки)
- `/home/z/ride-engine-test/gateway-check.ts` — проверка websocket через Caddy (порт 81)

Следующий агент (Tasks 3-6): подключайся как описано в worklog 3.4 и выше; все события сервера
уже работают ровно по контракту. Учитывай hint в ride:state и driver=null при searching.
