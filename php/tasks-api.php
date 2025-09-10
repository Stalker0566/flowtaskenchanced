<?php
/**
 * Tasks API for React Integration
 * Handles CRUD operations for tasks via AJAX
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'config.php';

// Initialize response
$response = ['success' => false, 'message' => '', 'data' => null];

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET,
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );

    $method = $_SERVER['REQUEST_METHOD'];
    $input = json_decode(file_get_contents('php://input'), true);

    // Get user session (simplified for demo)
    $userId = 1; // In real app, get from session/auth

    switch ($method) {
        case 'GET':
            // Get all tasks with extended fields
            $stmt = $pdo->prepare("
                SELECT id, title, description, done, priority, category, tags, 
                       due_date, completed_at, sort_order, created_at, updated_at 
                FROM tasks 
                WHERE user_id = ? 
                ORDER BY sort_order ASC, created_at DESC
            ");
            $stmt->execute([$userId]);
            $tasks = $stmt->fetchAll();
            
            // Decode JSON tags
            foreach ($tasks as &$task) {
                $task['tags'] = $task['tags'] ? json_decode($task['tags'], true) : [];
            }

            $response = [
                'success' => true,
                'tasks' => $tasks,
                'message' => 'Tasks loaded successfully'
            ];
            break;

        case 'POST':
            $action = $input['action'] ?? '';

            switch ($action) {
                case 'add':
                    // Add new task with extended fields
                    $title = trim($input['title'] ?? '');
                    if (empty($title)) {
                        throw new Exception('Task title is required');
                    }

                    $description = trim($input['description'] ?? '');
                    $priority = $input['priority'] ?? 'medium';
                    $category = $input['category'] ?? 'general';
                    $tags = isset($input['tags']) ? json_encode($input['tags']) : null;
                    $dueDate = $input['due_date'] ?? null;
                    
                    // Get next sort order
                    $stmt = $pdo->prepare("SELECT COALESCE(MAX(sort_order), 0) + 1 as next_order FROM tasks WHERE user_id = ?");
                    $stmt->execute([$userId]);
                    $nextOrder = $stmt->fetch()['next_order'];

                    $stmt = $pdo->prepare("
                        INSERT INTO tasks (user_id, title, description, priority, category, tags, due_date, sort_order, done, created_at, updated_at) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, NOW(), NOW())
                    ");
                    $stmt->execute([$userId, $title, $description, $priority, $category, $tags, $dueDate, $nextOrder]);

                    $taskId = $pdo->lastInsertId();
                    
                    // Get the created task
                    $stmt = $pdo->prepare("
                        SELECT id, title, description, done, priority, category, tags, 
                               due_date, completed_at, sort_order, created_at, updated_at 
                        FROM tasks 
                        WHERE id = ?
                    ");
                    $stmt->execute([$taskId]);
                    $task = $stmt->fetch();
                    
                    // Decode JSON tags
                    $task['tags'] = $task['tags'] ? json_decode($task['tags'], true) : [];

                    $response = [
                        'success' => true,
                        'task' => $task,
                        'message' => 'Task added successfully'
                    ];
                    break;

                case 'toggle':
                    // Toggle task completion
                    $taskId = $input['id'] ?? 0;
                    if (!$taskId) {
                        throw new Exception('Task ID is required');
                    }

                    $stmt = $pdo->prepare("
                        UPDATE tasks 
                        SET done = NOT done, updated_at = NOW() 
                        WHERE id = ? AND user_id = ?
                    ");
                    $stmt->execute([$taskId, $userId]);

                    if ($stmt->rowCount() === 0) {
                        throw new Exception('Task not found');
                    }

                    $response = [
                        'success' => true,
                        'message' => 'Task updated successfully'
                    ];
                    break;

                case 'delete':
                    // Delete task
                    $taskId = $input['id'] ?? 0;
                    if (!$taskId) {
                        throw new Exception('Task ID is required');
                    }

                    $stmt = $pdo->prepare("
                        DELETE FROM tasks 
                        WHERE id = ? AND user_id = ?
                    ");
                    $stmt->execute([$taskId, $userId]);

                    if ($stmt->rowCount() === 0) {
                        throw new Exception('Task not found');
                    }

                    $response = [
                        'success' => true,
                        'message' => 'Task deleted successfully'
                    ];
                    break;

                case 'edit':
                    // Edit task
                    $taskId = $input['id'] ?? 0;
                    $title = trim($input['title'] ?? '');
                    
                    if (!$taskId || empty($title)) {
                        throw new Exception('Task ID and title are required');
                    }

                    $stmt = $pdo->prepare("
                        UPDATE tasks 
                        SET title = ?, updated_at = NOW() 
                        WHERE id = ? AND user_id = ?
                    ");
                    $stmt->execute([$title, $taskId, $userId]);

                    if ($stmt->rowCount() === 0) {
                        throw new Exception('Task not found');
                    }

                    $response = [
                        'success' => true,
                        'message' => 'Task updated successfully'
                    ];
                    break;

                case 'clear':
                    // Clear all tasks
                    $stmt = $pdo->prepare("
                        DELETE FROM tasks 
                        WHERE user_id = ?
                    ");
                    $stmt->execute([$userId]);

                    $response = [
                        'success' => true,
                        'message' => 'All tasks cleared successfully'
                    ];
                    break;

                case 'clear_completed':
                    // Clear only completed tasks
                    $stmt = $pdo->prepare("
                        DELETE FROM tasks 
                        WHERE user_id = ? AND done = 1
                    ");
                    $stmt->execute([$userId]);

                    $response = [
                        'success' => true,
                        'message' => 'Completed tasks cleared successfully'
                    ];
                    break;

                case 'update':
                    // Update task with all fields
                    $taskId = $input['id'] ?? 0;
                    if (!$taskId) {
                        throw new Exception('Task ID is required');
                    }

                    $title = trim($input['title'] ?? '');
                    $description = trim($input['description'] ?? '');
                    $priority = $input['priority'] ?? 'medium';
                    $category = $input['category'] ?? 'general';
                    $tags = isset($input['tags']) ? json_encode($input['tags']) : null;
                    $dueDate = $input['due_date'] ?? null;

                    $stmt = $pdo->prepare("
                        UPDATE tasks 
                        SET title = ?, description = ?, priority = ?, category = ?, 
                            tags = ?, due_date = ?, updated_at = NOW()
                        WHERE id = ? AND user_id = ?
                    ");
                    $stmt->execute([$title, $description, $priority, $category, $tags, $dueDate, $taskId, $userId]);

                    if ($stmt->rowCount() === 0) {
                        throw new Exception('Task not found');
                    }

                    $response = [
                        'success' => true,
                        'message' => 'Task updated successfully'
                    ];
                    break;

                case 'reorder':
                    // Update sort order for drag & drop
                    $taskOrders = $input['task_orders'] ?? [];
                    if (empty($taskOrders)) {
                        throw new Exception('Task orders are required');
                    }

                    $pdo->beginTransaction();
                    try {
                        foreach ($taskOrders as $order) {
                            $stmt = $pdo->prepare("
                                UPDATE tasks 
                                SET sort_order = ? 
                                WHERE id = ? AND user_id = ?
                            ");
                            $stmt->execute([$order['sort_order'], $order['id'], $userId]);
                        }
                        $pdo->commit();

                        $response = [
                            'success' => true,
                            'message' => 'Tasks reordered successfully'
                        ];
                    } catch (Exception $e) {
                        $pdo->rollBack();
                        throw $e;
                    }
                    break;

                default:
                    throw new Exception('Invalid action');
            }
            break;

        default:
            throw new Exception('Method not allowed');
    }

} catch (Exception $e) {
    $response = [
        'success' => false,
        'message' => $e->getMessage()
    ];
    http_response_code(400);
} catch (PDOException $e) {
    $response = [
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ];
    http_response_code(500);
}

echo json_encode($response);
?>
