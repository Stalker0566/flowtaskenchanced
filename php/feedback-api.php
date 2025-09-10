<?php
/**
 * Feedback API - Обработка отзывов и обратной связи
 * Поддерживает анонимные отзывы и отзывы от авторизованных пользователей
 */

require_once 'config.php';
require_once 'auth.php';

// Настройка заголовков для CORS и JSON
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Обработка preflight запросов
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

try {
    $pdo = get_db_connection();
    
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'POST':
            handleSubmitFeedback($pdo);
            break;
        case 'GET':
            handleGetFeedback($pdo);
            break;
        default:
            throw new Exception('Method not allowed');
    }
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

/**
 * Обработка отправки отзыва
 */
function handleSubmitFeedback($pdo) {
    // Получение данных из запроса
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        $input = $_POST;
    }
    
    // Валидация обязательных полей
    $required_fields = ['name', 'email', 'subject', 'message'];
    foreach ($required_fields as $field) {
        if (empty($input[$field])) {
            throw new Exception("Field '$field' is required");
        }
    }
    
    // Валидация email
    if (!filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
        throw new Exception('Invalid email address');
    }
    
    // Валидация рейтинга (если указан)
    $rating = null;
    if (isset($input['rating']) && !empty($input['rating'])) {
        $rating = (int)$input['rating'];
        if ($rating < 1 || $rating > 5) {
            throw new Exception('Rating must be between 1 and 5');
        }
    }
    
    // Валидация категории
    $valid_categories = ['bug_report', 'feature_request', 'general_feedback', 'complaint', 'praise'];
    $category = $input['category'] ?? 'general_feedback';
    if (!in_array($category, $valid_categories)) {
        throw new Exception('Invalid category');
    }
    
    // Получение информации о пользователе (если авторизован)
    $user_id = null;
    try {
        $user_id = get_current_user_id();
    } catch (Exception $e) {
        // Пользователь не авторизован - это нормально для анонимных отзывов
    }
    
    // Получение IP адреса и User Agent
    $ip_address = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
    
    // Подготовка данных для вставки
    $data = [
        'user_id' => $user_id,
        'name' => trim($input['name']),
        'email' => trim($input['email']),
        'subject' => trim($input['subject']),
        'message' => trim($input['message']),
        'rating' => $rating,
        'category' => $category,
        'ip_address' => $ip_address,
        'user_agent' => $user_agent
    ];
    
    // Вставка в базу данных
    $sql = "INSERT INTO feedback (user_id, name, email, subject, message, rating, category, ip_address, user_agent) 
            VALUES (:user_id, :name, :email, :subject, :message, :rating, :category, :ip_address, :user_agent)";
    
    $stmt = $pdo->prepare($sql);
    $result = $stmt->execute($data);
    
    if (!$result) {
        throw new Exception('Failed to save feedback');
    }
    
    $feedback_id = $pdo->lastInsertId();
    
    // Отправка уведомления администратору (опционально)
    sendAdminNotification($data, $feedback_id);
    
    echo json_encode([
        'success' => true,
        'message' => 'Thank you for your feedback! We will review it and respond if necessary.',
        'feedback_id' => $feedback_id
    ]);
}

/**
 * Получение отзывов (только для администраторов)
 */
function handleGetFeedback($pdo) {
    // Проверка авторизации администратора
    $user_id = get_current_user_id();
    if (!$user_id) {
        throw new Exception('Authentication required');
    }
    
    // Проверка прав администратора (можно расширить)
    // Здесь можно добавить проверку роли пользователя
    
    $page = (int)($_GET['page'] ?? 1);
    $limit = (int)($_GET['limit'] ?? 20);
    $status = $_GET['status'] ?? null;
    $category = $_GET['category'] ?? null;
    
    $offset = ($page - 1) * $limit;
    
    // Построение запроса с фильтрами
    $where_conditions = [];
    $params = [];
    
    if ($status) {
        $where_conditions[] = "status = :status";
        $params['status'] = $status;
    }
    
    if ($category) {
        $where_conditions[] = "category = :category";
        $params['category'] = $category;
    }
    
    $where_clause = $where_conditions ? 'WHERE ' . implode(' AND ', $where_conditions) : '';
    
    // Получение отзывов
    $sql = "SELECT id, user_id, name, email, subject, message, rating, category, status, 
                   created_at, updated_at, admin_response, admin_response_at
            FROM feedback 
            $where_clause
            ORDER BY created_at DESC 
            LIMIT :limit OFFSET :offset";
    
    $stmt = $pdo->prepare($sql);
    foreach ($params as $key => $value) {
        $stmt->bindValue(":$key", $value);
    }
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    
    $feedback = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Получение общего количества
    $count_sql = "SELECT COUNT(*) as total FROM feedback $where_clause";
    $count_stmt = $pdo->prepare($count_sql);
    foreach ($params as $key => $value) {
        $count_stmt->bindValue(":$key", $value);
    }
    $count_stmt->execute();
    $total = $count_stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    echo json_encode([
        'success' => true,
        'data' => $feedback,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total' => (int)$total,
            'pages' => ceil($total / $limit)
        ]
    ]);
}

/**
 * Отправка уведомления администратору
 */
function sendAdminNotification($feedback_data, $feedback_id) {
    // Здесь можно добавить отправку email уведомления
    // или интеграцию с системой уведомлений
    
    $subject = "New Feedback Received - ID: $feedback_id";
    $message = "New feedback has been submitted:\n\n";
    $message .= "Name: " . $feedback_data['name'] . "\n";
    $message .= "Email: " . $feedback_data['email'] . "\n";
    $message .= "Subject: " . $feedback_data['subject'] . "\n";
    $message .= "Category: " . $feedback_data['category'] . "\n";
    $message .= "Rating: " . ($feedback_data['rating'] ? $feedback_data['rating'] . '/5' : 'Not rated') . "\n";
    $message .= "Message: " . $feedback_data['message'] . "\n";
    
    // Логирование для отладки
    error_log("Feedback notification: " . $message);
    
    // В реальном приложении здесь была бы отправка email:
    // mail('admin@taskflow.com', $subject, $message);
}
?>
