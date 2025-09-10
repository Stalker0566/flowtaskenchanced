<?php
/**
 * TaskFlow Development Configuration
 * Конфигурация для разработки TaskFlow
 */

// Включение режима разработки
define('DEVELOPMENT', true);

// Настройки базы данных для разработки
define('DB_HOST', 'localhost');
define('DB_NAME', 'taskflow_dev');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

// Настройки безопасности (менее строгие для разработки)
define('SESSION_LIFETIME', 24 * 60 * 60); // 1 день
define('VERIFICATION_CODE_LIFETIME', 60 * 60); // 1 час
define('RECOVERY_CODE_LIFETIME', 60 * 60); // 1 час
define('SALT_LENGTH', 32);

// Настройки приложения
define('APP_NAME', 'TaskFlow Dev');
define('APP_VERSION', '2.0.0-dev');
define('APP_URL', 'http://localhost/TaskFlow');

// Настройки email (для разработки - отключены)
define('SMTP_HOST', '');
define('SMTP_PORT', 587);
define('SMTP_USER', '');
define('SMTP_PASS', '');
define('FROM_EMAIL', 'dev@taskflow.local');
define('FROM_NAME', 'TaskFlow Dev');

// Настройки аналитики
define('ANALYTICS_ENABLED', true);
define('ANALYTICS_RETENTION_DAYS', 30); // Хранить аналитику 30 дней

// Настройки безопасности (менее строгие)
define('MAX_LOGIN_ATTEMPTS', 10);
define('LOGIN_LOCKOUT_TIME', 5 * 60); // 5 минут
define('PASSWORD_MIN_LENGTH', 4); // Для тестирования
define('PASSWORD_REQUIRE_UPPERCASE', false);
define('PASSWORD_REQUIRE_NUMBERS', false);
define('PASSWORD_REQUIRE_SPECIAL', false);

// Настройки CORS (более разрешительные)
define('CORS_ORIGINS', [
    'http://localhost',
    'http://localhost:3000',
    'http://localhost:8080',
    'http://127.0.0.1',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:8080'
]);

// Включение отображения ошибок
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../logs/php_errors.log');

// Создание папки для логов, если её нет
$logDir = __DIR__ . '/../logs';
if (!is_dir($logDir)) {
    mkdir($logDir, 0755, true);
}

// Функция для логирования в файл (для разработки)
function devLog($message, $context = []) {
    $logFile = __DIR__ . '/../logs/dev.log';
    $timestamp = date('Y-m-d H:i:s');
    $logMessage = "[$timestamp] $message";
    
    if (!empty($context)) {
        $logMessage .= " - Context: " . json_encode($context);
    }
    
    $logMessage .= PHP_EOL;
    file_put_contents($logFile, $logMessage, FILE_APPEND | LOCK_EX);
}

// Функция для создания тестовых данных
function createTestData() {
    try {
        $pdo = getDatabaseConnection();
        
        // Создание тестового пользователя
        $testEmail = 'test@taskflow.dev';
        $testPassword = 'test123';
        $salt = generateSalt();
        $passwordHash = hashPassword($testPassword, $salt);
        
        // Проверка существования тестового пользователя
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$testEmail]);
        
        if (!$stmt->fetch()) {
            $stmt = $pdo->prepare("
                INSERT INTO users (email, password_hash, salt, is_verified) 
                VALUES (?, ?, ?, TRUE)
            ");
            $stmt->execute([$testEmail, $passwordHash, $salt]);
            
            $userId = $pdo->lastInsertId();
            devLog("Created test user: $testEmail (ID: $userId)");
            
            // Создание тестовых задач
            $testTasks = [
                'Изучить PHP',
                'Настроить базу данных',
                'Создать API',
                'Написать документацию'
            ];
            
            foreach ($testTasks as $task) {
                $stmt = $pdo->prepare("
                    INSERT INTO user_tasks (user_id, task_text, priority) 
                    VALUES (?, ?, ?)
                ");
                $stmt->execute([$userId, $task, 'medium']);
            }
            
            devLog("Created test tasks for user $userId");
        }
        
    } catch (Exception $e) {
        devLog("Error creating test data: " . $e->getMessage());
    }
}

// Автоматическое создание тестовых данных в режиме разработки
if (DEVELOPMENT) {
    createTestData();
}

// Функция для очистки тестовых данных
function clearTestData() {
    try {
        $pdo = getDatabaseConnection();
        
        // Удаление тестового пользователя и связанных данных
        $stmt = $pdo->prepare("DELETE FROM users WHERE email = 'test@taskflow.dev'");
        $stmt->execute();
        
        devLog("Cleared test data");
        
    } catch (Exception $e) {
        devLog("Error clearing test data: " . $e->getMessage());
    }
}

// Функция для получения информации о системе
function getSystemInfo() {
    return [
        'php_version' => PHP_VERSION,
        'mysql_version' => getDatabaseConnection()->query('SELECT VERSION()')->fetchColumn(),
        'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
        'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'Unknown',
        'memory_limit' => ini_get('memory_limit'),
        'max_execution_time' => ini_get('max_execution_time'),
        'upload_max_filesize' => ini_get('upload_max_filesize'),
        'post_max_size' => ini_get('post_max_size')
    ];
}

// Функция для проверки состояния системы
function checkSystemHealth() {
    $health = [
        'database' => false,
        'php_extensions' => [],
        'permissions' => [],
        'errors' => []
    ];
    
    try {
        // Проверка подключения к базе данных
        $pdo = getDatabaseConnection();
        $pdo->query('SELECT 1');
        $health['database'] = true;
    } catch (Exception $e) {
        $health['errors'][] = 'Database connection failed: ' . $e->getMessage();
    }
    
    // Проверка PHP расширений
    $requiredExtensions = ['pdo', 'pdo_mysql', 'json', 'mbstring'];
    foreach ($requiredExtensions as $ext) {
        $health['php_extensions'][$ext] = extension_loaded($ext);
    }
    
    // Проверка прав доступа
    $directories = [
        __DIR__ . '/../logs' => 'writable',
        __DIR__ . '/../db' => 'readable'
    ];
    
    foreach ($directories as $dir => $permission) {
        if ($permission === 'writable') {
            $health['permissions'][$dir] = is_writable($dir);
        } else {
            $health['permissions'][$dir] = is_readable($dir);
        }
    }
    
    return $health;
}

// Включение основной конфигурации
require_once 'config.php';
?>
