<?php
// progress.php
// API para gestionar la sincronización de progreso

require_once 'config.php';

// Manejo de CORS (Permitir peticiones desde tu web local o Netlify)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

// Manejar peticiones OPTIONS (Pre-flight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$db = get_db_connection();
$method = $_SERVER['REQUEST_METHOD'];

// --- GET: Recuperar Progreso ---
if ($method === 'GET') {
    $user_id = $_GET['user_id'] ?? null;
    
    if (!$user_id) {
        http_response_code(400);
        echo json_encode(['error' => 'Falta user_id']);
        exit;
    }

    $stmt = $db->prepare("SELECT answers, settings FROM user_progress WHERE user_id = ?");
    $stmt->execute([$user_id]);
    $result = $stmt->fetch();

    if ($result) {
        // Devolvemos los datos decodificados para que el JS los use directamente
        echo json_encode([
            'success' => true,
            'data' => [
                'answers' => json_decode($result['answers']),
                'settings' => json_decode($result['settings'])
            ]
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Usuario nuevo']);
    }
}

// --- POST: Guardar/Actualizar Progreso ---
else if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $user_id = $input['user_id'] ?? null;
    $answers = $input['answers'] ?? null;
    $settings = $input['settings'] ?? null;

    if (!$user_id) {
        http_response_code(400);
        echo json_encode(['error' => 'Datos incompletos']);
        exit;
    }

    // Convertimos arrays a strings JSON para guardar en MySQL
    $answers_json = json_encode($answers);
    $settings_json = json_encode($settings);

    // UPSERT (Si existe actualiza, si no inserta)
    $sql = "INSERT INTO user_progress (user_id, answers, settings) 
            VALUES (:uid, :ans, :set) 
            ON DUPLICATE KEY UPDATE 
            answers = VALUES(answers), 
            settings = VALUES(settings), 
            updated_at = CURRENT_TIMESTAMP";

    $stmt = $db->prepare($sql);
    $success = $stmt->execute([
        ':uid' => $user_id,
        ':ans' => $answers_json,
        ':set' => $settings_json
    ]);

    echo json_encode(['success' => $success]);
}
