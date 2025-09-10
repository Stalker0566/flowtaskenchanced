<?php
/**
 * TaskFlow Configuration Example
 * Пример конфигурации TaskFlow
 * 
 * Скопируйте этот файл в config.php и настройте под ваши нужды
 */

// Настройки базы данных
define('DB_HOST', 'localhost');
define('DB_NAME', 'taskflow');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

// Настройки безопасности
define('SESSION_LIFETIME', 7 * 24 * 60 * 60); // 7 дней в секундах
define('VERIFICATION_CODE_LIFETIME', 15 * 60); // 15 минут в секундах
define('RECOVERY_CODE_LIFETIME', 30 * 60); // 30 минут в секундах
define('SALT_LENGTH', 32); // Длина соли для хеширования паролей

// Настройки приложения
define('APP_NAME', 'TaskFlow');
define('APP_VERSION', '2.0.0');
define('APP_URL', 'http://localhost/TaskFlow'); // Замените на ваш URL

// Настройки email (для будущего использования)
define('SMTP_HOST', 'smtp.gmail.com');
define('SMTP_PORT', 587);
define('SMTP_USER', '');
define('SMTP_PASS', '');
define('FROM_EMAIL', 'noreply@taskflow.com');
define('FROM_NAME', 'TaskFlow');

// Настройки аналитики
define('ANALYTICS_ENABLED', true);
define('ANALYTICS_RETENTION_DAYS', 365); // Хранить аналитику 1 год

// Настройки безопасности
define('MAX_LOGIN_ATTEMPTS', 5);
define('LOGIN_LOCKOUT_TIME', 15 * 60); // 15 минут блокировки
define('PASSWORD_MIN_LENGTH', 6);
define('PASSWORD_REQUIRE_UPPERCASE', false);
define('PASSWORD_REQUIRE_NUMBERS', false);
define('PASSWORD_REQUIRE_SPECIAL', false);

// Настройки CORS
define('CORS_ORIGINS', [
    'http://localhost',
    'http://localhost:3000',
    'http://127.0.0.1',
    'http://127.0.0.1:3000',
    // Добавьте ваши домены
]);

// Включение основной конфигурации
require_once 'config.php';
?>
