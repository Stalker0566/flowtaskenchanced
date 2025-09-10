<?php
/**
 * Create Test User
 * Создание тестового пользователя
 */

require_once 'php/config.php';

echo "<h1>TaskFlow - Создание тестового пользователя</h1>";

try {
    $pdo = getDatabaseConnection();
    
    // Тестовый пользователь
    $email = 'test@taskflow.local';
    $password = 'test123';
    $salt = generateSalt();
    $passwordHash = hashPassword($password, $salt);
    
    // Проверка существования пользователя
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    
    if ($stmt->fetch()) {
        echo "<p style='color: orange;'>⚠️ Пользователь $email уже существует</p>";
    } else {
        // Создание пользователя
        $stmt = $pdo->prepare("
            INSERT INTO users (email, password_hash, salt, is_verified) 
            VALUES (?, ?, ?, TRUE)
        ");
        $stmt->execute([$email, $passwordHash, $salt]);
        
        $userId = $pdo->lastInsertId();
        echo "<p style='color: green;'>✓ Тестовый пользователь создан успешно!</p>";
        echo "<p><strong>Email:</strong> $email</p>";
        echo "<p><strong>Пароль:</strong> $password</p>";
        echo "<p><strong>ID:</strong> $userId</p>";
        
        // Создание тестовых задач
        $testTasks = [
            'Изучить TaskFlow',
            'Настроить базу данных',
            'Создать первую задачу',
            'Протестировать систему'
        ];
        
        foreach ($testTasks as $task) {
            $stmt = $pdo->prepare("
                INSERT INTO user_tasks (user_id, task_text, priority) 
                VALUES (?, ?, ?)
            ");
            $stmt->execute([$userId, $task, 'medium']);
        }
        
        echo "<p style='color: green;'>✓ Создано " . count($testTasks) . " тестовых задач</p>";
    }
    
    echo "<br><p><a href='login.html'>Перейти к странице входа</a></p>";
    echo "<p><a href='index.html'>Перейти к главной странице</a></p>";
    
} catch (Exception $e) {
    echo "<p style='color: red;'>✗ Ошибка: " . $e->getMessage() . "</p>";
    echo "<p>Убедитесь, что база данных создана и схема импортирована.</p>";
}
?>
