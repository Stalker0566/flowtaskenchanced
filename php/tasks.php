<?php
/**
 * TaskFlow Tasks Management
 * Управление задачами TaskFlow
 */

require_once 'config.php';

// Установка CORS заголовков
setCorsHeaders();

// Обработка preflight запросов
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Проверка авторизации
$userId = checkAuthentication();

// Проверка метода запроса
if (!in_array($_SERVER['REQUEST_METHOD'], ['GET', 'POST', 'PUT', 'DELETE'])) {
    sendJsonResponse(['error' => 'Метод не поддерживается'], 405);
}

try {
    $pdo = getDatabaseConnection();
    
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            handleGetTasks($pdo, $userId);
            break;
            
        case 'POST':
            handleCreateTask($pdo, $userId);
            break;
            
        case 'PUT':
            handleUpdateTask($pdo, $userId);
            break;
            
        case 'DELETE':
            handleDeleteTask($pdo, $userId);
            break;
    }
    
} catch (Exception $e) {
    logError("Tasks error: " . $e->getMessage(), ['user_id' => $userId]);
    sendJsonResponse(['error' => $e->getMessage()], 500);
}

/**
 * Проверка авторизации пользователя
 */
function checkAuthentication() {
    $sessionToken = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    $sessionToken = str_replace('Bearer ', '', $sessionToken);
    
    if (empty($sessionToken)) {
        sendJsonResponse(['error' => 'Требуется авторизация'], 401);
    }
    
    try {
        $pdo = getDatabaseConnection();
        
        $stmt = $pdo->prepare("
            SELECT u.id 
            FROM users u 
            JOIN user_sessions s ON u.id = s.user_id 
            WHERE s.session_token = ? AND s.is_active = TRUE AND s.expires_at > NOW()
        ");
        $stmt->execute([$sessionToken]);
        $user = $stmt->fetch();
        
        if (!$user) {
            sendJsonResponse(['error' => 'Сессия недействительна'], 401);
        }
        
        return $user['id'];
        
    } catch (Exception $e) {
        sendJsonResponse(['error' => 'Ошибка проверки авторизации'], 401);
    }
}

/**
 * Получение списка задач пользователя
 */
function handleGetTasks($pdo, $userId) {
    $completed = $_GET['completed'] ?? null;
    $limit = (int)($_GET['limit'] ?? 100);
    $offset = (int)($_GET['offset'] ?? 0);
    
    $sql = "SELECT * FROM user_tasks WHERE user_id = ?";
    $params = [$userId];
    
    if ($completed !== null) {
        $sql .= " AND is_completed = ?";
        $params[] = $completed ? 1 : 0;
    }
    
    $sql .= " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    $params[] = $limit;
    $params[] = $offset;
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $tasks = $stmt->fetchAll();
    
    // Получение статистики
    $stmt = $pdo->prepare("
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END) as completed,
            SUM(CASE WHEN is_completed = 0 THEN 1 ELSE 0 END) as pending
        FROM user_tasks 
        WHERE user_id = ?
    ");
    $stmt->execute([$userId]);
    $stats = $stmt->fetch();
    
    sendJsonResponse([
        'success' => true,
        'tasks' => $tasks,
        'stats' => $stats,
        'pagination' => [
            'limit' => $limit,
            'offset' => $offset,
            'total' => $stats['total']
        ]
    ]);
}

/**
 * Создание новой задачи
 */
function handleCreateTask($pdo, $userId) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        sendJsonResponse(['error' => 'Неверный формат данных'], 400);
    }
    
    $taskText = trim($input['task_text'] ?? '');
    $priority = $input['priority'] ?? 'medium';
    
    if (empty($taskText)) {
        sendJsonResponse(['error' => 'Текст задачи обязателен'], 400);
    }
    
    if (!in_array($priority, ['low', 'medium', 'high'])) {
        $priority = 'medium';
    }
    
    $stmt = $pdo->prepare("
        INSERT INTO user_tasks (user_id, task_text, priority) 
        VALUES (?, ?, ?)
    ");
    $stmt->execute([$userId, $taskText, $priority]);
    
    $taskId = $pdo->lastInsertId();
    
    // Получение созданной задачи
    $stmt = $pdo->prepare("SELECT * FROM user_tasks WHERE id = ?");
    $stmt->execute([$taskId]);
    $task = $stmt->fetch();
    
    // Запись аналитики
    recordAnalytics($pdo, $userId, 'task_created');
    
    sendJsonResponse([
        'success' => true,
        'message' => 'Задача создана',
        'task' => $task
    ]);
}

/**
 * Обновление задачи
 */
function handleUpdateTask($pdo, $userId) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        sendJsonResponse(['error' => 'Неверный формат данных'], 400);
    }
    
    $taskId = (int)($input['id'] ?? 0);
    
    if (!$taskId) {
        sendJsonResponse(['error' => 'ID задачи обязателен'], 400);
    }
    
    // Проверка принадлежности задачи пользователю
    $stmt = $pdo->prepare("SELECT * FROM user_tasks WHERE id = ? AND user_id = ?");
    $stmt->execute([$taskId, $userId]);
    $task = $stmt->fetch();
    
    if (!$task) {
        sendJsonResponse(['error' => 'Задача не найдена'], 404);
    }
    
    $updates = [];
    $params = [];
    
    if (isset($input['task_text'])) {
        $taskText = trim($input['task_text']);
        if (empty($taskText)) {
            sendJsonResponse(['error' => 'Текст задачи не может быть пустым'], 400);
        }
        $updates[] = "task_text = ?";
        $params[] = $taskText;
    }
    
    if (isset($input['is_completed'])) {
        $isCompleted = (bool)$input['is_completed'];
        $updates[] = "is_completed = ?";
        $params[] = $isCompleted ? 1 : 0;
        
        if ($isCompleted && !$task['is_completed']) {
            $updates[] = "completed_at = NOW()";
        } elseif (!$isCompleted && $task['is_completed']) {
            $updates[] = "completed_at = NULL";
        }
    }
    
    if (isset($input['priority'])) {
        $priority = $input['priority'];
        if (in_array($priority, ['low', 'medium', 'high'])) {
            $updates[] = "priority = ?";
            $params[] = $priority;
        }
    }
    
    if (empty($updates)) {
        sendJsonResponse(['error' => 'Нет данных для обновления'], 400);
    }
    
    $updates[] = "updated_at = NOW()";
    $params[] = $taskId;
    
    $sql = "UPDATE user_tasks SET " . implode(', ', $updates) . " WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    
    // Получение обновленной задачи
    $stmt = $pdo->prepare("SELECT * FROM user_tasks WHERE id = ?");
    $stmt->execute([$taskId]);
    $updatedTask = $stmt->fetch();
    
    // Запись аналитики
    $action = isset($input['is_completed']) && $input['is_completed'] ? 'task_completed' : 'task_updated';
    recordAnalytics($pdo, $userId, $action);
    
    sendJsonResponse([
        'success' => true,
        'message' => 'Задача обновлена',
        'task' => $updatedTask
    ]);
}

/**
 * Удаление задачи
 */
function handleDeleteTask($pdo, $userId) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        sendJsonResponse(['error' => 'Неверный формат данных'], 400);
    }
    
    $taskId = (int)($input['id'] ?? 0);
    
    if (!$taskId) {
        sendJsonResponse(['error' => 'ID задачи обязателен'], 400);
    }
    
    // Проверка принадлежности задачи пользователю
    $stmt = $pdo->prepare("SELECT * FROM user_tasks WHERE id = ? AND user_id = ?");
    $stmt->execute([$taskId, $userId]);
    $task = $stmt->fetch();
    
    if (!$task) {
        sendJsonResponse(['error' => 'Задача не найдена'], 404);
    }
    
    // Удаление задачи
    $stmt = $pdo->prepare("DELETE FROM user_tasks WHERE id = ? AND user_id = ?");
    $stmt->execute([$taskId, $userId]);
    
    // Запись аналитики
    recordAnalytics($pdo, $userId, 'task_deleted');
    
    sendJsonResponse([
        'success' => true,
        'message' => 'Задача удалена'
    ]);
}

/**
 * Запись аналитики
 */
function recordAnalytics($pdo, $userId, $action) {
    if (!ANALYTICS_ENABLED) {
        return;
    }
    
    try {
        $stmt = $pdo->prepare("
            INSERT INTO analytics (user_id, ip_address, user_agent, page_url, session_id, visit_timestamp) 
            VALUES (?, ?, ?, ?, ?, NOW())
        ");
        $stmt->execute([
            $userId,
            getUserIP(),
            getUserAgent(),
            $_SERVER['REQUEST_URI'] ?? '',
            session_id()
        ]);
    } catch (Exception $e) {
        logError("Analytics recording failed: " . $e->getMessage());
    }
}
?>
