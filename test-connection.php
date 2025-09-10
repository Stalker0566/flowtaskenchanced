<?php
/**
 * Test Database Connection
 * Тест подключения к базе данных
 */

echo "<h1>TaskFlow - Тест подключения</h1>";

// Проверка PHP
echo "<h2>PHP информация:</h2>";
echo "Версия PHP: " . PHP_VERSION . "<br>";
echo "Расширения: ";

$requiredExtensions = ['pdo', 'pdo_mysql', 'json', 'mbstring'];
foreach ($requiredExtensions as $ext) {
    $status = extension_loaded($ext) ? '✓' : '✗';
    echo "$ext $status ";
}
echo "<br><br>";

// Тест подключения к базе данных
echo "<h2>Тест подключения к базе данных:</h2>";

try {
    $dsn = "mysql:host=localhost;dbname=taskflow;charset=utf8mb4";
    $pdo = new PDO($dsn, 'root', '', [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
    
    echo "✓ Подключение к базе данных успешно<br>";
    
    // Проверка таблиц
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    echo "✓ Найдено таблиц: " . count($tables) . "<br>";
    echo "Таблицы: " . implode(', ', $tables) . "<br>";
    
    // Проверка пользователей
    if (in_array('users', $tables)) {
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM users");
        $count = $stmt->fetch()['count'];
        echo "✓ Пользователей в базе: $count<br>";
    }
    
} catch (PDOException $e) {
    echo "✗ Ошибка подключения: " . $e->getMessage() . "<br>";
    echo "<br><strong>Возможные решения:</strong><br>";
    echo "1. Убедитесь, что WAMP Server запущен<br>";
    echo "2. Проверьте, что MySQL работает<br>";
    echo "3. Создайте базу данных 'taskflow'<br>";
    echo "4. Импортируйте схему из db/schema.sql<br>";
}

// Проверка файлов
echo "<h2>Проверка файлов:</h2>";
$requiredFiles = [
    'php/config.php' => 'Конфигурация',
    'php/auth.php' => 'Аутентификация',
    'php/analytics.php' => 'Аналитика',
    'php/tasks.php' => 'Задачи',
    'db/schema.sql' => 'Схема БД',
    'js/auth-ajax.js' => 'AJAX аутентификация'
];

foreach ($requiredFiles as $file => $description) {
    $status = file_exists($file) ? '✓' : '✗';
    echo "$description: $status<br>";
}

echo "<br><h2>Следующие шаги:</h2>";
echo "1. Если все тесты пройдены, перейдите на <a href='index.html'>главную страницу</a><br>";
echo "2. Или запустите <a href='install.php'>установщик</a> для создания администратора<br>";
echo "3. Для разработки используйте <a href='php/config-dev.php'>конфигурацию разработки</a><br>";
?>
