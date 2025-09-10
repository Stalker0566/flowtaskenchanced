# TaskFlow - Система управления задачами с PHP

TaskFlow - это современное веб-приложение для управления задачами с полноценной системой аутентификации, аналитики и хранением данных в базе данных.

## 🚀 Возможности

- **Система аутентификации**: Регистрация, вход, восстановление пароля
- **Управление задачами**: Создание, редактирование, удаление задач
- **Аналитика**: Отслеживание активности пользователей
- **Безопасность**: Хеширование паролей с солью (SHA-256)
- **AJAX**: Работа без перезагрузки страницы
- **Адаптивный дизайн**: Работает на всех устройствах

## 📋 Требования

- PHP 7.4 или выше
- MySQL 5.7 или выше (или SQLite)
- Веб-сервер (Apache/Nginx)
- XAMPP/WAMP/MAMP (для локальной разработки)

## 🛠️ Установка

### 1. Клонирование проекта

```bash
git clone <repository-url>
cd TaskFlow
```

### 2. Настройка базы данных

#### Для MySQL:

1. Создайте базу данных:
```sql
CREATE DATABASE taskflow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. Импортируйте схему:
```bash
mysql -u root -p taskflow < db/schema.sql
```

#### Для SQLite:

1. Создайте файл базы данных:
```bash
sqlite3 db/taskflow.db < db/schema.sql
```

### 3. Настройка конфигурации

Отредактируйте файл `php/config.php`:

```php
// Настройки базы данных
define('DB_HOST', 'localhost');
define('DB_NAME', 'taskflow');
define('DB_USER', 'root');
define('DB_PASS', '');
```

### 4. Настройка веб-сервера

#### Apache (.htaccess)

Создайте файл `.htaccess` в корне проекта:

```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.html [QSA,L]

# Безопасность
<Files "*.php">
    Order Allow,Deny
    Allow from all
</Files>

<Files "config.php">
    Order Deny,Allow
    Deny from all
</Files>
```

#### Nginx

```nginx
server {
    listen 80;
    server_name localhost;
    root /path/to/TaskFlow;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~ \.php$ {
        fastcgi_pass 127.0.0.1:9000;
        fastcgi_index index.php;
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    }
}
```

## 🚀 Запуск

### Локальная разработка (XAMPP)

1. Скопируйте проект в папку `htdocs` (XAMPP) или `www` (WAMP)
2. Запустите Apache и MySQL
3. Откройте браузер: `http://localhost/TaskFlow`

### Продакшн

1. Загрузите файлы на сервер
2. Настройте виртуальный хост
3. Убедитесь, что PHP и MySQL работают
4. Откройте сайт в браузере

## 📁 Структура проекта

```
TaskFlow/
├── css/                    # Стили
│   └── styles.css
├── js/                     # JavaScript файлы
│   ├── auth-ajax.js       # AJAX аутентификация
│   ├── login.js           # Логика входа
│   ├── script.js          # Основная логика
│   └── ...
├── php/                    # PHP скрипты
│   ├── config.php         # Конфигурация
│   ├── auth.php           # Аутентификация
│   ├── analytics.php      # Аналитика
│   └── tasks.php          # Управление задачами
├── db/                     # База данных
│   └── schema.sql         # SQL схема
├── index.html             # Главная страница
├── login.html             # Страница входа
└── README.md              # Документация
```

## 🔧 API Endpoints

### Аутентификация (`php/auth.php`)

- `POST /auth.php` - Вход, регистрация, восстановление пароля
- Действия: `login`, `signup`, `verify`, `recovery`, `reset_password`, `logout`

### Аналитика (`php/analytics.php`)

- `POST /analytics.php` - Отслеживание событий и статистика
- Действия: `track_page_view`, `track_event`, `get_stats`

### Задачи (`php/tasks.php`)

- `GET /tasks.php` - Получение списка задач
- `POST /tasks.php` - Создание задачи
- `PUT /tasks.php` - Обновление задачи
- `DELETE /tasks.php` - Удаление задачи

## 🔐 Безопасность

- Пароли хешируются с помощью SHA-256 + соль
- Сессии защищены токенами
- CORS настроен для безопасности
- SQL-инъекции предотвращены через prepared statements
- XSS защита через экранирование данных

## 📊 Аналитика

Система собирает следующую информацию:
- IP адрес пользователя
- User Agent
- Страницы посещения
- Время сессий
- События пользователя
- Геолокация (если доступна)

## 🐛 Отладка

### Включение отладки

В файле `php/config.php`:

```php
define('DEVELOPMENT', true);
```

### Логи ошибок

Ошибки записываются в системный лог PHP. Для просмотра:

```bash
tail -f /var/log/apache2/error.log
```

## 🔄 Обновления

1. Сделайте резервную копию базы данных
2. Обновите файлы проекта
3. Запустите миграции (если есть)
4. Проверьте работоспособность

## 📝 Лицензия

MIT License

## 🤝 Поддержка

Если у вас возникли проблемы:

1. Проверьте логи ошибок
2. Убедитесь, что все требования выполнены
3. Проверьте настройки базы данных
4. Создайте issue в репозитории

## 🎯 Планы развития

- [ ] Email уведомления
- [ ] Мобильное приложение
- [ ] API для сторонних приложений
- [ ] Расширенная аналитика
- [ ] Многопользовательские проекты
- [ ] Интеграция с календарем
