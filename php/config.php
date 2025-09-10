<?php
/**
 * TaskFlow Database Configuration
 * Конфигурация базы данных для TaskFlow
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
define('APP_URL', 'http://localhost/TaskFlow');

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
    'http://127.0.0.1:3000'
]);

// Функция для создания подключения к базе данных
function getDatabaseConnection() {
    static $pdo = null;
    
    if ($pdo === null) {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES " . DB_CHARSET
            ];
            
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            error_log("Database connection failed: " . $e->getMessage());
            throw new Exception("Ошибка подключения к базе данных");
        }
    }
    
    return $pdo;
}

// Функция для генерации случайной соли
function generateSalt($length = SALT_LENGTH) {
    return bin2hex(random_bytes($length / 2));
}

// Функция для хеширования пароля с солью
function hashPassword($password, $salt) {
    return hash('sha256', $password . $salt);
}

// Функция для проверки пароля
function verifyPassword($password, $hash, $salt) {
    return hashPassword($password, $salt) === $hash;
}

// Функция для генерации токена сессии
function generateSessionToken() {
    return bin2hex(random_bytes(32));
}

// Функция для генерации кода подтверждения
function generateVerificationCode($length = 6) {
    return str_pad(random_int(0, pow(10, $length) - 1), $length, '0', STR_PAD_LEFT);
}

// Функция для установки CORS заголовков
function setCorsHeaders() {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    
    if (in_array($origin, CORS_ORIGINS)) {
        header("Access-Control-Allow-Origin: $origin");
    }
    
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
    header("Access-Control-Allow-Credentials: true");
    header("Access-Control-Max-Age: 86400");
}

// Функция для отправки JSON ответа
function sendJsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

// Функция для логирования ошибок
function logError($message, $context = []) {
    $logMessage = date('Y-m-d H:i:s') . " - " . $message;
    if (!empty($context)) {
        $logMessage .= " - Context: " . json_encode($context);
    }
    error_log($logMessage);
}

// Функция для получения IP адреса пользователя
function getUserIP() {
    $ipKeys = ['HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'HTTP_X_FORWARDED', 
               'HTTP_X_CLUSTER_CLIENT_IP', 'HTTP_FORWARDED_FOR', 'HTTP_FORWARDED', 'REMOTE_ADDR'];
    
    foreach ($ipKeys as $key) {
        if (array_key_exists($key, $_SERVER) === true) {
            $ip = $_SERVER[$key];
            if (strpos($ip, ',') !== false) {
                $ip = explode(',', $ip)[0];
            }
            $ip = trim($ip);
            if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                return $ip;
            }
        }
    }
    
    return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
}

// Функция для получения User Agent
function getUserAgent() {
    return $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown';
}

// Автозагрузка классов (если понадобится)
spl_autoload_register(function ($class) {
    $file = __DIR__ . '/classes/' . $class . '.php';
    if (file_exists($file)) {
        require_once $file;
    }
});

// Установка часового пояса
date_default_timezone_set('Europe/Moscow');

// Включение отображения ошибок в режиме разработки
if (defined('DEVELOPMENT') && DEVELOPMENT) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}
?>
