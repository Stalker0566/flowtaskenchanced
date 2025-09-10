<?php
/**
 * TaskFlow Authentication System
 * Система аутентификации TaskFlow
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
$email = trim($input['email'] ?? '');
$password = $input['password'] ?? '';
$remember = $input['remember'] ?? false;

try {
    $pdo = getDatabaseConnection();
    
    switch ($action) {
        case 'login':
            handleLogin($pdo, $email, $password, $remember);
            break;
            
        case 'signup':
            handleSignup($pdo, $email, $password);
            break;
            
        case 'verify':
            $code = $input['code'] ?? '';
            handleVerification($pdo, $email, $code);
            break;
            
        case 'resend_code':
            handleResendCode($pdo, $email);
            break;
            
        case 'recovery':
            handleRecovery($pdo, $email);
            break;
            
        case 'reset_password':
            $code = $input['code'] ?? '';
            $newPassword = $input['new_password'] ?? '';
            handlePasswordReset($pdo, $email, $code, $newPassword);
            break;
            
        case 'logout':
            handleLogout($pdo);
            break;
            
        case 'check_session':
            handleSessionCheck($pdo);
            break;
            
        default:
            sendJsonResponse(['error' => 'Неизвестное действие'], 400);
    }
    
} catch (Exception $e) {
    logError("Auth error: " . $e->getMessage(), ['action' => $action, 'email' => $email]);
    sendJsonResponse(['error' => $e->getMessage()], 500);
}

/**
 * Обработка входа пользователя
 */
function handleLogin($pdo, $email, $password, $remember) {
    if (empty($email) || empty($password)) {
        sendJsonResponse(['error' => 'Email и пароль обязательны'], 400);
    }
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        sendJsonResponse(['error' => 'Неверный формат email'], 400);
    }
    
    // Поиск пользователя
    $stmt = $pdo->prepare("SELECT id, email, password_hash, salt, is_verified FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();
    
    if (!$user) {
        sendJsonResponse(['error' => 'Неверный email или пароль'], 401);
    }
    
    if (!$user['is_verified']) {
        sendJsonResponse(['error' => 'Аккаунт не подтвержден. Проверьте email'], 401);
    }
    
    // Проверка пароля
    if (!verifyPassword($password, $user['password_hash'], $user['salt'])) {
        sendJsonResponse(['error' => 'Неверный email или пароль'], 401);
    }
    
    // Создание сессии
    $sessionToken = generateSessionToken();
    $expiresAt = date('Y-m-d H:i:s', time() + ($remember ? SESSION_LIFETIME : 24 * 60 * 60));
    
    $stmt = $pdo->prepare("
        INSERT INTO user_sessions (user_id, session_token, expires_at, ip_address, user_agent) 
        VALUES (?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        $user['id'],
        $sessionToken,
        $expiresAt,
        getUserIP(),
        getUserAgent()
    ]);
    
    // Обновление времени последнего входа
    $stmt = $pdo->prepare("UPDATE users SET last_login = NOW() WHERE id = ?");
    $stmt->execute([$user['id']]);
    
    // Запись аналитики
    recordAnalytics($pdo, $user['id'], 'login');
    
    sendJsonResponse([
        'success' => true,
        'user' => [
            'id' => $user['id'],
            'email' => $user['email']
        ],
        'session_token' => $sessionToken,
        'expires_at' => $expiresAt
    ]);
}

/**
 * Обработка регистрации пользователя
 */
function handleSignup($pdo, $email, $password) {
    if (empty($email) || empty($password)) {
        sendJsonResponse(['error' => 'Email и пароль обязательны'], 400);
    }
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        sendJsonResponse(['error' => 'Неверный формат email'], 400);
    }
    
    if (strlen($password) < PASSWORD_MIN_LENGTH) {
        sendJsonResponse(['error' => 'Пароль должен содержать минимум ' . PASSWORD_MIN_LENGTH . ' символов'], 400);
    }
    
    // Проверка существования пользователя
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        sendJsonResponse(['error' => 'Пользователь с таким email уже существует'], 409);
    }
    
    // Генерация соли и хеширование пароля
    $salt = generateSalt();
    $passwordHash = hashPassword($password, $salt);
    
    // Генерация кода подтверждения
    $verificationCode = generateVerificationCode();
    $expiresAt = date('Y-m-d H:i:s', time() + VERIFICATION_CODE_LIFETIME);
    
    // Сохранение данных регистрации
    $stmt = $pdo->prepare("
        INSERT INTO signup_verifications (email, verification_code, password_hash, salt, expires_at) 
        VALUES (?, ?, ?, ?, ?)
    ");
    $stmt->execute([$email, $verificationCode, $passwordHash, $salt, $expiresAt]);
    
    // В реальном приложении здесь бы отправлялся email
    // Для демонстрации возвращаем код в ответе
    
    sendJsonResponse([
        'success' => true,
        'message' => 'Код подтверждения отправлен на email',
        'email' => $email,
        'verification_code' => $verificationCode, // Только для демо!
        'expires_at' => $expiresAt
    ]);
}

/**
 * Обработка подтверждения регистрации
 */
function handleVerification($pdo, $email, $code) {
    if (empty($email) || empty($code)) {
        sendJsonResponse(['error' => 'Email и код обязательны'], 400);
    }
    
    // Поиск записи подтверждения
    $stmt = $pdo->prepare("
        SELECT * FROM signup_verifications 
        WHERE email = ? AND verification_code = ? AND is_used = FALSE AND expires_at > NOW()
    ");
    $stmt->execute([$email, $code]);
    $verification = $stmt->fetch();
    
    if (!$verification) {
        sendJsonResponse(['error' => 'Неверный или просроченный код'], 400);
    }
    
    // Создание пользователя
    $stmt = $pdo->prepare("
        INSERT INTO users (email, password_hash, salt, is_verified) 
        VALUES (?, ?, ?, TRUE)
    ");
    $stmt->execute([
        $verification['email'],
        $verification['password_hash'],
        $verification['salt']
    ]);
    
    $userId = $pdo->lastInsertId();
    
    // Создание сессии
    $sessionToken = generateSessionToken();
    $expiresAt = date('Y-m-d H:i:s', time() + SESSION_LIFETIME);
    
    $stmt = $pdo->prepare("
        INSERT INTO user_sessions (user_id, session_token, expires_at, ip_address, user_agent) 
        VALUES (?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        $userId,
        $sessionToken,
        $expiresAt,
        getUserIP(),
        getUserAgent()
    ]);
    
    // Удаление использованной записи подтверждения
    $stmt = $pdo->prepare("DELETE FROM signup_verifications WHERE id = ?");
    $stmt->execute([$verification['id']]);
    
    // Запись аналитики
    recordAnalytics($pdo, $userId, 'signup_verified');
    
    sendJsonResponse([
        'success' => true,
        'message' => 'Регистрация успешно завершена',
        'user' => [
            'id' => $userId,
            'email' => $email
        ],
        'session_token' => $sessionToken,
        'expires_at' => $expiresAt
    ]);
}

/**
 * Повторная отправка кода подтверждения
 */
function handleResendCode($pdo, $email) {
    if (empty($email)) {
        sendJsonResponse(['error' => 'Email обязателен'], 400);
    }
    
    // Поиск активной записи подтверждения
    $stmt = $pdo->prepare("
        SELECT * FROM signup_verifications 
        WHERE email = ? AND is_used = FALSE AND expires_at > NOW()
    ");
    $stmt->execute([$email]);
    $verification = $stmt->fetch();
    
    if (!$verification) {
        sendJsonResponse(['error' => 'Нет активной регистрации для этого email'], 400);
    }
    
    // Генерация нового кода
    $newCode = generateVerificationCode();
    $expiresAt = date('Y-m-d H:i:s', time() + VERIFICATION_CODE_LIFETIME);
    
    $stmt = $pdo->prepare("
        UPDATE signup_verifications 
        SET verification_code = ?, expires_at = ? 
        WHERE id = ?
    ");
    $stmt->execute([$newCode, $expiresAt, $verification['id']]);
    
    sendJsonResponse([
        'success' => true,
        'message' => 'Новый код отправлен на email',
        'verification_code' => $newCode, // Только для демо!
        'expires_at' => $expiresAt
    ]);
}

/**
 * Обработка запроса восстановления пароля
 */
function handleRecovery($pdo, $email) {
    if (empty($email)) {
        sendJsonResponse(['error' => 'Email обязателен'], 400);
    }
    
    // Проверка существования пользователя
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ? AND is_verified = TRUE");
    $stmt->execute([$email]);
    if (!$stmt->fetch()) {
        sendJsonResponse(['error' => 'Пользователь не найден'], 404);
    }
    
    // Генерация кода восстановления
    $recoveryCode = generateVerificationCode();
    $expiresAt = date('Y-m-d H:i:s', time() + RECOVERY_CODE_LIFETIME);
    
    // Удаление старых кодов восстановления
    $stmt = $pdo->prepare("DELETE FROM password_recovery WHERE email = ?");
    $stmt->execute([$email]);
    
    // Сохранение нового кода
    $stmt = $pdo->prepare("
        INSERT INTO password_recovery (email, recovery_code, expires_at) 
        VALUES (?, ?, ?)
    ");
    $stmt->execute([$email, $recoveryCode, $expiresAt]);
    
    sendJsonResponse([
        'success' => true,
        'message' => 'Код восстановления отправлен на email',
        'recovery_code' => $recoveryCode, // Только для демо!
        'expires_at' => $expiresAt
    ]);
}

/**
 * Обработка сброса пароля
 */
function handlePasswordReset($pdo, $email, $code, $newPassword) {
    if (empty($email) || empty($code) || empty($newPassword)) {
        sendJsonResponse(['error' => 'Все поля обязательны'], 400);
    }
    
    if (strlen($newPassword) < PASSWORD_MIN_LENGTH) {
        sendJsonResponse(['error' => 'Пароль должен содержать минимум ' . PASSWORD_MIN_LENGTH . ' символов'], 400);
    }
    
    // Поиск кода восстановления
    $stmt = $pdo->prepare("
        SELECT * FROM password_recovery 
        WHERE email = ? AND recovery_code = ? AND is_used = FALSE AND expires_at > NOW()
    ");
    $stmt->execute([$email, $code]);
    $recovery = $stmt->fetch();
    
    if (!$recovery) {
        sendJsonResponse(['error' => 'Неверный или просроченный код'], 400);
    }
    
    // Обновление пароля
    $salt = generateSalt();
    $passwordHash = hashPassword($newPassword, $salt);
    
    $stmt = $pdo->prepare("
        UPDATE users 
        SET password_hash = ?, salt = ?, updated_at = NOW() 
        WHERE email = ?
    ");
    $stmt->execute([$passwordHash, $salt, $email]);
    
    // Удаление использованного кода
    $stmt = $pdo->prepare("DELETE FROM password_recovery WHERE id = ?");
    $stmt->execute([$recovery['id']]);
    
    // Удаление всех сессий пользователя
    $stmt = $pdo->prepare("DELETE FROM user_sessions WHERE user_id = (SELECT id FROM users WHERE email = ?)");
    $stmt->execute([$email]);
    
    sendJsonResponse([
        'success' => true,
        'message' => 'Пароль успешно изменен'
    ]);
}

/**
 * Обработка выхода пользователя
 */
function handleLogout($pdo) {
    $sessionToken = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    $sessionToken = str_replace('Bearer ', '', $sessionToken);
    
    if (empty($sessionToken)) {
        sendJsonResponse(['error' => 'Токен сессии не найден'], 400);
    }
    
    // Деактивация сессии
    $stmt = $pdo->prepare("UPDATE user_sessions SET is_active = FALSE WHERE session_token = ?");
    $stmt->execute([$sessionToken]);
    
    sendJsonResponse([
        'success' => true,
        'message' => 'Выход выполнен успешно'
    ]);
}

/**
 * Проверка сессии пользователя
 */
function handleSessionCheck($pdo) {
    $sessionToken = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    $sessionToken = str_replace('Bearer ', '', $sessionToken);
    
    if (empty($sessionToken)) {
        sendJsonResponse(['error' => 'Токен сессии не найден'], 401);
    }
    
    // Поиск активной сессии
    $stmt = $pdo->prepare("
        SELECT u.id, u.email, s.expires_at 
        FROM users u 
        JOIN user_sessions s ON u.id = s.user_id 
        WHERE s.session_token = ? AND s.is_active = TRUE AND s.expires_at > NOW()
    ");
    $stmt->execute([$sessionToken]);
    $session = $stmt->fetch();
    
    if (!$session) {
        sendJsonResponse(['error' => 'Сессия недействительна'], 401);
    }
    
    sendJsonResponse([
        'success' => true,
        'user' => [
            'id' => $session['id'],
            'email' => $session['email']
        ],
        'expires_at' => $session['expires_at']
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
