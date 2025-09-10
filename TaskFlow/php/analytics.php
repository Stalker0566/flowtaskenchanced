<?php
/**
 * TaskFlow Analytics System
 * Система аналитики TaskFlow
 */

require_once 'config.php';

// Установка CORS заголовков
setCorsHeaders();

// Обработка preflight запросов
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Проверка метода запроса
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(['error' => 'Метод не поддерживается'], 405);
}

// Получение данных из запроса
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    sendJsonResponse(['error' => 'Неверный формат данных'], 400);
}

$action = $input['action'] ?? '';

try {
    $pdo = getDatabaseConnection();
    
    switch ($action) {
        case 'track_page_view':
            handlePageView($pdo, $input);
            break;
            
        case 'track_event':
            handleEvent($pdo, $input);
            break;
            
        case 'get_stats':
            handleGetStats($pdo, $input);
            break;
            
        case 'get_user_analytics':
            handleGetUserAnalytics($pdo, $input);
            break;
            
        default:
            sendJsonResponse(['error' => 'Неизвестное действие'], 400);
    }
    
} catch (Exception $e) {
    logError("Analytics error: " . $e->getMessage(), ['action' => $action]);
    sendJsonResponse(['error' => $e->getMessage()], 500);
}

/**
 * Обработка просмотра страницы
 */
function handlePageView($pdo, $input) {
    if (!ANALYTICS_ENABLED) {
        sendJsonResponse(['success' => true, 'message' => 'Analytics disabled']);
        return;
    }
    
    $userId = $input['user_id'] ?? null;
    $pageUrl = $input['page_url'] ?? $_SERVER['REQUEST_URI'] ?? '';
    $referrer = $input['referrer'] ?? $_SERVER['HTTP_REFERER'] ?? '';
    $sessionId = $input['session_id'] ?? session_id();
    
    // Получение дополнительной информации о пользователе
    $userInfo = getUserInfo($input);
    
    $stmt = $pdo->prepare("
        INSERT INTO analytics (
            user_id, ip_address, user_agent, page_url, referrer, session_id,
            country, city, device_type, browser, os, screen_resolution, 
            language, timezone, visit_timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    ");
    
    $stmt->execute([
        $userId,
        getUserIP(),
        getUserAgent(),
        $pageUrl,
        $referrer,
        $sessionId,
        $userInfo['country'],
        $userInfo['city'],
        $userInfo['device_type'],
        $userInfo['browser'],
        $userInfo['os'],
        $userInfo['screen_resolution'],
        $userInfo['language'],
        $userInfo['timezone']
    ]);
    
    sendJsonResponse([
        'success' => true,
        'message' => 'Page view tracked',
        'analytics_id' => $pdo->lastInsertId()
    ]);
}

/**
 * Обработка события
 */
function handleEvent($pdo, $input) {
    if (!ANALYTICS_ENABLED) {
        sendJsonResponse(['success' => true, 'message' => 'Analytics disabled']);
        return;
    }
    
    $userId = $input['user_id'] ?? null;
    $eventName = $input['event_name'] ?? '';
    $eventData = $input['event_data'] ?? [];
    
    if (empty($eventName)) {
        sendJsonResponse(['error' => 'Название события обязательно'], 400);
    }
    
    // Создание таблицы событий, если её нет
    createEventsTableIfNotExists($pdo);
    
    $stmt = $pdo->prepare("
        INSERT INTO analytics_events (
            user_id, event_name, event_data, ip_address, user_agent, 
            session_id, visit_timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, NOW())
    ");
    
    $stmt->execute([
        $userId,
        $eventName,
        json_encode($eventData),
        getUserIP(),
        getUserAgent(),
        session_id()
    ]);
    
    sendJsonResponse([
        'success' => true,
        'message' => 'Event tracked',
        'event_id' => $pdo->lastInsertId()
    ]);
}

/**
 * Получение общей статистики
 */
function handleGetStats($pdo, $input) {
    $userId = $input['user_id'] ?? null;
    $period = $input['period'] ?? '7d'; // 1d, 7d, 30d, 90d, 1y
    
    $dateCondition = getDateCondition($period);
    
    $stats = [];
    
    // Общее количество посещений
    $sql = "SELECT COUNT(*) as total_visits FROM analytics WHERE visit_timestamp >= $dateCondition";
    $params = [];
    
    if ($userId) {
        $sql .= " AND user_id = ?";
        $params[] = $userId;
    }
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $stats['total_visits'] = $stmt->fetchColumn();
    
    // Уникальные посетители
    $sql = "SELECT COUNT(DISTINCT ip_address) as unique_visitors FROM analytics WHERE visit_timestamp >= $dateCondition";
    $params = [];
    
    if ($userId) {
        $sql .= " AND user_id = ?";
        $params[] = $userId;
    }
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $stats['unique_visitors'] = $stmt->fetchColumn();
    
    // Топ страниц
    $sql = "SELECT page_url, COUNT(*) as views FROM analytics WHERE visit_timestamp >= $dateCondition";
    $params = [];
    
    if ($userId) {
        $sql .= " AND user_id = ?";
        $params[] = $userId;
    }
    
    $sql .= " GROUP BY page_url ORDER BY views DESC LIMIT 10";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $stats['top_pages'] = $stmt->fetchAll();
    
    // Статистика по браузерам
    $sql = "SELECT browser, COUNT(*) as count FROM analytics WHERE visit_timestamp >= $dateCondition AND browser IS NOT NULL";
    $params = [];
    
    if ($userId) {
        $sql .= " AND user_id = ?";
        $params[] = $userId;
    }
    
    $sql .= " GROUP BY browser ORDER BY count DESC LIMIT 5";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $stats['browsers'] = $stmt->fetchAll();
    
    // Статистика по устройствам
    $sql = "SELECT device_type, COUNT(*) as count FROM analytics WHERE visit_timestamp >= $dateCondition AND device_type IS NOT NULL";
    $params = [];
    
    if ($userId) {
        $sql .= " AND user_id = ?";
        $params[] = $userId;
    }
    
    $sql .= " GROUP BY device_type ORDER BY count DESC";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $stats['devices'] = $stmt->fetchAll();
    
    // Статистика по дням
    $sql = "SELECT DATE(visit_timestamp) as date, COUNT(*) as visits FROM analytics WHERE visit_timestamp >= $dateCondition";
    $params = [];
    
    if ($userId) {
        $sql .= " AND user_id = ?";
        $params[] = $userId;
    }
    
    $sql .= " GROUP BY DATE(visit_timestamp) ORDER BY date DESC LIMIT 30";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $stats['daily_visits'] = $stmt->fetchAll();
    
    sendJsonResponse([
        'success' => true,
        'stats' => $stats,
        'period' => $period
    ]);
}

/**
 * Получение аналитики пользователя
 */
function handleGetUserAnalytics($pdo, $input) {
    $userId = $input['user_id'] ?? null;
    
    if (!$userId) {
        sendJsonResponse(['error' => 'ID пользователя обязателен'], 400);
    }
    
    // Проверка существования пользователя
    $stmt = $pdo->prepare("SELECT id, email, created_at, last_login FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();
    
    if (!$user) {
        sendJsonResponse(['error' => 'Пользователь не найден'], 404);
    }
    
    // Статистика пользователя
    $stmt = $pdo->prepare("
        SELECT 
            COUNT(*) as total_visits,
            COUNT(DISTINCT DATE(visit_timestamp)) as active_days,
            MIN(visit_timestamp) as first_visit,
            MAX(visit_timestamp) as last_visit
        FROM analytics 
        WHERE user_id = ?
    ");
    $stmt->execute([$userId]);
    $userStats = $stmt->fetch();
    
    // Топ страниц пользователя
    $stmt = $pdo->prepare("
        SELECT page_url, COUNT(*) as views 
        FROM analytics 
        WHERE user_id = ? 
        GROUP BY page_url 
        ORDER BY views DESC 
        LIMIT 10
    ");
    $stmt->execute([$userId]);
    $userPages = $stmt->fetchAll();
    
    // Активность по дням
    $stmt = $pdo->prepare("
        SELECT DATE(visit_timestamp) as date, COUNT(*) as visits 
        FROM analytics 
        WHERE user_id = ? 
        GROUP BY DATE(visit_timestamp) 
        ORDER BY date DESC 
        LIMIT 30
    ");
    $stmt->execute([$userId]);
    $userActivity = $stmt->fetchAll();
    
    sendJsonResponse([
        'success' => true,
        'user' => $user,
        'stats' => $userStats,
        'top_pages' => $userPages,
        'activity' => $userActivity
    ]);
}

/**
 * Получение информации о пользователе из браузера
 */
function getUserInfo($input) {
    $userAgent = getUserAgent();
    
    return [
        'country' => $input['country'] ?? null,
        'city' => $input['city'] ?? null,
        'device_type' => detectDeviceType($userAgent),
        'browser' => detectBrowser($userAgent),
        'os' => detectOS($userAgent),
        'screen_resolution' => $input['screen_resolution'] ?? null,
        'language' => $input['language'] ?? $_SERVER['HTTP_ACCEPT_LANGUAGE'] ?? null,
        'timezone' => $input['timezone'] ?? null
    ];
}

/**
 * Определение типа устройства
 */
function detectDeviceType($userAgent) {
    if (preg_match('/Mobile|Android|iPhone|iPad/', $userAgent)) {
        return 'mobile';
    } elseif (preg_match('/Tablet|iPad/', $userAgent)) {
        return 'tablet';
    } else {
        return 'desktop';
    }
}

/**
 * Определение браузера
 */
function detectBrowser($userAgent) {
    if (preg_match('/Chrome/', $userAgent)) {
        return 'Chrome';
    } elseif (preg_match('/Firefox/', $userAgent)) {
        return 'Firefox';
    } elseif (preg_match('/Safari/', $userAgent)) {
        return 'Safari';
    } elseif (preg_match('/Edge/', $userAgent)) {
        return 'Edge';
    } elseif (preg_match('/Opera/', $userAgent)) {
        return 'Opera';
    } else {
        return 'Unknown';
    }
}

/**
 * Определение операционной системы
 */
function detectOS($userAgent) {
    if (preg_match('/Windows/', $userAgent)) {
        return 'Windows';
    } elseif (preg_match('/Mac/', $userAgent)) {
        return 'macOS';
    } elseif (preg_match('/Linux/', $userAgent)) {
        return 'Linux';
    } elseif (preg_match('/Android/', $userAgent)) {
        return 'Android';
    } elseif (preg_match('/iOS/', $userAgent)) {
        return 'iOS';
    } else {
        return 'Unknown';
    }
}

/**
 * Получение условия даты для SQL запросов
 */
function getDateCondition($period) {
    switch ($period) {
        case '1d':
            return "DATE_SUB(NOW(), INTERVAL 1 DAY)";
        case '7d':
            return "DATE_SUB(NOW(), INTERVAL 7 DAY)";
        case '30d':
            return "DATE_SUB(NOW(), INTERVAL 30 DAY)";
        case '90d':
            return "DATE_SUB(NOW(), INTERVAL 90 DAY)";
        case '1y':
            return "DATE_SUB(NOW(), INTERVAL 1 YEAR)";
        default:
            return "DATE_SUB(NOW(), INTERVAL 7 DAY)";
    }
}

/**
 * Создание таблицы событий, если её не существует
 */
function createEventsTableIfNotExists($pdo) {
    $sql = "
        CREATE TABLE IF NOT EXISTS analytics_events (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NULL,
            event_name VARCHAR(100) NOT NULL,
            event_data JSON,
            ip_address VARCHAR(45),
            user_agent TEXT,
            session_id VARCHAR(255),
            visit_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_user_id (user_id),
            INDEX idx_event_name (event_name),
            INDEX idx_visit_timestamp (visit_timestamp)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ";
    
    $pdo->exec($sql);
}
?>
