<?php
// config.php
// Configuración de la base de datos MySQL

define('DB_HOST', 'localhost');
define('DB_NAME', 'nombre_de_tu_base_de_datos');
define('DB_USER', 'tu_usuario');
define('DB_PASS', 'tu_contraseña');

// Configuración de errores para desarrollo (cambiar a 0 en producción)
error_reporting(E_ALL);
ini_set('display_errors', 1);

function get_db_connection() {
    try {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];
        return new PDO($dsn, DB_USER, DB_PASS, $options);
    } catch (\PDOException $e) {
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Connection failed: ' . $e->getMessage()]);
        exit;
    }
}
