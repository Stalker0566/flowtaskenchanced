<?php
/**
 * TaskFlow Installation Script
 * Скрипт установки TaskFlow
 */

// Проверка версии PHP
if (version_compare(PHP_VERSION, '7.4.0', '<')) {
    die('TaskFlow requires PHP 7.4 or higher. Current version: ' . PHP_VERSION);
}

// Проверка необходимых расширений
$requiredExtensions = ['pdo', 'pdo_mysql', 'json', 'mbstring'];
$missingExtensions = [];

foreach ($requiredExtensions as $ext) {
    if (!extension_loaded($ext)) {
        $missingExtensions[] = $ext;
    }
}

if (!empty($missingExtensions)) {
    die('Missing required PHP extensions: ' . implode(', ', $missingExtensions));
}

?>
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TaskFlow - Установка</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
            background: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            text-align: center;
            margin-bottom: 30px;
        }
        .step {
            margin-bottom: 30px;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 5px;
        }
        .step h2 {
            color: #2c3e50;
            margin-top: 0;
        }
        .form-group {
            margin-bottom: 15px;
        }
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: 500;
        }
        input, select {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
        }
        button {
            background: #3498db;
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
        }
        button:hover {
            background: #2980b9;
        }
        .success {
            color: #27ae60;
            font-weight: bold;
        }
        .error {
            color: #e74c3c;
            font-weight: bold;
        }
        .info {
            background: #ecf0f1;
            padding: 15px;
            border-radius: 4px;
            margin-bottom: 20px;
        }
        .checklist {
            list-style: none;
            padding: 0;
        }
        .checklist li {
            padding: 5px 0;
        }
        .checklist li:before {
            content: "✓ ";
            color: #27ae60;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 TaskFlow - Установка</h1>
        
        <?php if ($_SERVER['REQUEST_METHOD'] === 'POST'): ?>
            <?php
            // Обработка формы установки
            $dbHost = $_POST['db_host'] ?? 'localhost';
            $dbName = $_POST['db_name'] ?? 'taskflow';
            $dbUser = $_POST['db_user'] ?? 'root';
            $dbPass = $_POST['db_pass'] ?? '';
            $adminEmail = $_POST['admin_email'] ?? '';
            $adminPassword = $_POST['admin_password'] ?? '';
            
            $errors = [];
            $success = [];
            
            // Валидация
            if (empty($dbName)) $errors[] = 'Название базы данных обязательно';
            if (empty($dbUser)) $errors[] = 'Пользователь базы данных обязателен';
            if (empty($adminEmail)) $errors[] = 'Email администратора обязателен';
            if (empty($adminPassword)) $errors[] = 'Пароль администратора обязателен';
            
            if (empty($errors)) {
                try {
                    // Тестирование подключения к базе данных
                    $dsn = "mysql:host=$dbHost;charset=utf8mb4";
                    $pdo = new PDO($dsn, $dbUser, $dbPass, [
                        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
                    ]);
                    $success[] = 'Подключение к базе данных успешно';
                    
                    // Создание базы данных
                    $pdo->exec("CREATE DATABASE IF NOT EXISTS `$dbName` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
                    $pdo->exec("USE `$dbName`");
                    $success[] = 'База данных создана';
                    
                    // Импорт схемы
                    $schema = file_get_contents('db/schema.sql');
                    $statements = explode(';', $schema);
                    
                    foreach ($statements as $statement) {
                        $statement = trim($statement);
                        if (!empty($statement)) {
                            $pdo->exec($statement);
                        }
                    }
                    $success[] = 'Схема базы данных импортирована';
                    
                    // Создание администратора
                    $salt = bin2hex(random_bytes(16));
                    $passwordHash = hash('sha256', $adminPassword . $salt);
                    
                    $stmt = $pdo->prepare("
                        INSERT INTO users (email, password_hash, salt, is_verified) 
                        VALUES (?, ?, ?, TRUE)
                    ");
                    $stmt->execute([$adminEmail, $passwordHash, $salt]);
                    $success[] = 'Администратор создан';
                    
                    // Создание конфигурационного файла
                    $configContent = "<?php
// TaskFlow Configuration
define('DB_HOST', '$dbHost');
define('DB_NAME', '$dbName');
define('DB_USER', '$dbUser');
define('DB_PASS', '$dbPass');
define('DB_CHARSET', 'utf8mb4');

define('SESSION_LIFETIME', 7 * 24 * 60 * 60);
define('VERIFICATION_CODE_LIFETIME', 15 * 60);
define('RECOVERY_CODE_LIFETIME', 30 * 60);
define('SALT_LENGTH', 32);

define('APP_NAME', 'TaskFlow');
define('APP_VERSION', '2.0.0');
define('APP_URL', 'http://' . \$_SERVER['HTTP_HOST'] . dirname(\$_SERVER['REQUEST_URI']));

define('ANALYTICS_ENABLED', true);
define('ANALYTICS_RETENTION_DAYS', 365);

define('MAX_LOGIN_ATTEMPTS', 5);
define('LOGIN_LOCKOUT_TIME', 15 * 60);
define('PASSWORD_MIN_LENGTH', 6);

define('CORS_ORIGINS', [
    'http://' . \$_SERVER['HTTP_HOST'],
    'https://' . \$_SERVER['HTTP_HOST']
]);

// Остальные функции из config.php
require_once __DIR__ . '/config.php';
?>";
                    
                    file_put_contents('php/config-installed.php', $configContent);
                    $success[] = 'Конфигурационный файл создан';
                    
                    // Переименование config.php для использования установленной конфигурации
                    if (file_exists('php/config.php')) {
                        rename('php/config.php', 'php/config-original.php');
                    }
                    rename('php/config-installed.php', 'php/config.php');
                    
                    $success[] = 'Установка завершена успешно!';
                    
                } catch (Exception $e) {
                    $errors[] = 'Ошибка установки: ' . $e->getMessage();
                }
            }
            ?>
            
            <?php if (!empty($errors)): ?>
                <div class="error">
                    <h3>Ошибки установки:</h3>
                    <ul>
                        <?php foreach ($errors as $error): ?>
                            <li><?= htmlspecialchars($error) ?></li>
                        <?php endforeach; ?>
                    </ul>
                </div>
            <?php endif; ?>
            
            <?php if (!empty($success)): ?>
                <div class="success">
                    <h3>Установка завершена:</h3>
                    <ul>
                        <?php foreach ($success as $msg): ?>
                            <li><?= htmlspecialchars($msg) ?></li>
                        <?php endforeach; ?>
                    </ul>
                    <p><strong>Администратор:</strong> <?= htmlspecialchars($adminEmail) ?></p>
                    <p><a href="index.html" style="color: #3498db;">Перейти к приложению →</a></p>
                </div>
            <?php endif; ?>
            
        <?php else: ?>
            <div class="info">
                <h3>Проверка системы</h3>
                <ul class="checklist">
                    <li>PHP версия: <?= PHP_VERSION ?> ✓</li>
                    <li>Расширения PHP: <?= implode(', ', $requiredExtensions) ?> ✓</li>
                    <li>Права на запись: <?= is_writable('.') ? 'Да' : 'Нет' ?></li>
                </ul>
            </div>
            
            <form method="POST">
                <div class="step">
                    <h2>1. Настройка базы данных</h2>
                    <div class="form-group">
                        <label for="db_host">Хост базы данных:</label>
                        <input type="text" id="db_host" name="db_host" value="localhost" required>
                    </div>
                    <div class="form-group">
                        <label for="db_name">Название базы данных:</label>
                        <input type="text" id="db_name" name="db_name" value="taskflow" required>
                    </div>
                    <div class="form-group">
                        <label for="db_user">Пользователь:</label>
                        <input type="text" id="db_user" name="db_user" value="root" required>
                    </div>
                    <div class="form-group">
                        <label for="db_pass">Пароль:</label>
                        <input type="password" id="db_pass" name="db_pass">
                    </div>
                </div>
                
                <div class="step">
                    <h2>2. Создание администратора</h2>
                    <div class="form-group">
                        <label for="admin_email">Email администратора:</label>
                        <input type="email" id="admin_email" name="admin_email" required>
                    </div>
                    <div class="form-group">
                        <label for="admin_password">Пароль администратора:</label>
                        <input type="password" id="admin_password" name="admin_password" minlength="6" required>
                    </div>
                </div>
                
                <button type="submit">Установить TaskFlow</button>
            </form>
        <?php endif; ?>
    </div>
</body>
</html>
