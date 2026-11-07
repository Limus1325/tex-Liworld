LIworld Support — закрытая панель сотрудников

ВАЖНО: это стартовый проект. Пока Firebase не настроен, вход не работает. Не выкладывай сайт в интернет с незаполненными правилами безопасности.

НАСТРОЙКА
1. Создай Firebase project: https://console.firebase.google.com/
2. В Authentication включи Email/Password.
3. Создай Firestore Database.
4. Вставь web app config в support-portal/app.js.
5. Опубликуй firestore.rules в Firestore Rules.
6. Создай учётные записи сотрудников в Firebase Authentication (не делай публичную регистрацию).
7. Выдай сотрудникам custom claim supportStaff=true с помощью Admin SDK. Пример ниже.

Выдача доступа (локально на своём компьютере):
- Установи Node.js.
- В отдельной безопасной папке: npm init -y && npm install firebase-admin
- Скачай service account key в Firebase Console > Project settings > Service accounts.
- Сохрани его как serviceAccountKey.json рядом со скриптом. НИКОМУ НЕ ОТПРАВЛЯЙ ЭТОТ ФАЙЛ и не загружай в сайт/GitHub.
- Создай grant-staff.js:

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const email = process.argv[2];
if (!email) throw new Error('Usage: node grant-staff.js staff@example.com');
(async () => {
  const user = await admin.auth().getUserByEmail(email);
  await admin.auth().setCustomUserClaims(user.uid, { supportStaff: true });
  console.log('Staff access granted to', email);
  process.exit(0);
})();

Запусти: node grant-staff.js staff@example.com
После смены custom claim сотруднику нужно выйти и войти заново.

ТЕКУЩИЕ ОГРАНИЧЕНИЯ
- Панель уже содержит вход, список заявок, фильтры, закрытие/открытие и добавление внутренних ответов.
- Пока публичная форма на основном сайте не подключена к Firestore. Правила разрешают создавать заявки, но интерфейс создания заявок ещё нужно связать с Firebase.
- Ответы сейчас сохраняются как внутренние записи панели. Автоматическое письмо игроку не подключено.
- Для публикации используй Firebase Hosting или другой HTTPS-хостинг.
- Добавь App Check и ограничения от спама перед публичным запуском.
- Не используй реальные пароли в исходном коде. Пароли хранятся только в Firebase Authentication.
