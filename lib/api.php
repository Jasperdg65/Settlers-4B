<?php
// Gedeelde code voor public/api/*.php: config, SQLite, JSON-antwoorden,
// token-controle en een generieke handler voor opgeslagen JSON-documenten
// (maps en savegames). Staat buiten de webroot.

declare(strict_types=1);

ini_set('display_errors', '0');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

final class ApiError extends Exception
{
    public function __construct(public int $status, public string $errCode, string $message)
    {
        parent::__construct($message);
    }
}

set_exception_handler(function (Throwable $e): void {
    if ($e instanceof ApiError) {
        respond($e->status, ['error' => ['code' => $e->errCode, 'message' => $e->getMessage()]]);
    }
    error_log('kolonie api: ' . $e);
    respond(500, ['error' => ['code' => 'server_error', 'message' => 'Er ging iets mis op de server.']]);
});

function respond(int $status, array $body): never
{
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function config(): array
{
    static $cfg;
    if ($cfg === null) {
        $file = dirname(__DIR__) . '/data/config.php';
        if (!is_file($file)) throw new ApiError(503, 'not_configured', 'De API is nog niet ingesteld (data/config.php ontbreekt).');
        $cfg = (require $file) + ['max_bytes' => 2 * 1024 * 1024, 'db' => dirname(__DIR__) . '/data/kolonie.sqlite'];
    }
    return $cfg;
}

function db(): PDO
{
    static $pdo;
    if ($pdo === null) {
        $pdo = new PDO('sqlite:' . config()['db'], null, null, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
        $pdo->exec('PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 3000; PRAGMA foreign_keys = ON');
        foreach (['maps', 'saves'] as $t) {
            $pdo->exec("CREATE TABLE IF NOT EXISTS $t (
                id      INTEGER PRIMARY KEY AUTOINCREMENT,
                name    TEXT    NOT NULL,
                size    INTEGER,
                version INTEGER NOT NULL,
                bytes   INTEGER NOT NULL,
                data    BLOB    NOT NULL,          -- gzcompress(JSON)
                created TEXT    NOT NULL,
                updated TEXT    NOT NULL
            )");
        }
    }
    return $pdo;
}

function require_token(): void
{
    $token = (string) (config()['token'] ?? '');
    if ($token === '' || $token === 'VERVANG-MIJ') {
        throw new ApiError(503, 'not_configured', 'Schrijven is uitgeschakeld: stel een token in data/config.php in.');
    }
    $given = '';
    $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    if (preg_match('/^Bearer\s+(\S+)$/i', $auth, $m)) $given = $m[1];
    elseif (isset($_SERVER['HTTP_X_KOLONIE_TOKEN'])) $given = (string) $_SERVER['HTTP_X_KOLONIE_TOKEN'];
    if ($given === '' || !hash_equals($token, $given)) {
        throw new ApiError(401, 'unauthorized', 'Geldig token vereist.');
    }
}

function read_json_body(): array
{
    $max = (int) config()['max_bytes'];
    if ((int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > $max) {
        throw new ApiError(413, 'too_large', "Request is groter dan $max bytes.");
    }
    $type = strtolower(trim(explode(';', $_SERVER['CONTENT_TYPE'] ?? '')[0]));
    if ($type !== 'application/json') {
        throw new ApiError(415, 'unsupported_type', 'Stuur de body als application/json.');
    }
    $raw = file_get_contents('php://input', false, null, 0, $max + 1);
    if ($raw === false || strlen($raw) > $max) {
        throw new ApiError(413, 'too_large', "Request is groter dan $max bytes.");
    }
    try {
        $body = json_decode($raw, true, 64, JSON_THROW_ON_ERROR);
    } catch (JsonException) {
        throw new ApiError(400, 'invalid_json', 'Body is geen geldige JSON.');
    }
    if (!is_array($body) || array_is_list($body)) {
        throw new ApiError(400, 'invalid_json', 'Body moet een JSON-object zijn.');
    }
    return $body;
}

function query_id(): ?int
{
    if (!isset($_GET['id'])) return null;
    $id = $_GET['id'];
    if (!is_string($id) || !preg_match('/^[1-9][0-9]{0,15}$/', $id)) {
        throw new ApiError(400, 'invalid_id', 'id moet een positief geheel getal zijn.');
    }
    return (int) $id;
}

function valid_name(mixed $name): string
{
    if (!is_string($name)) throw new ApiError(422, 'invalid_name', 'name is verplicht (tekst).');
    $name = trim(preg_replace('/\s+/u', ' ', $name) ?? '');
    if ($name === '' || mb_strlen($name) > 100 || preg_match('/[\p{C}]/u', $name)) {
        throw new ApiError(422, 'invalid_name', 'name moet 1 tot 100 gewone tekens zijn.');
    }
    return $name;
}

// Generator-instelling van een map. Velden zijn optioneel zodat latere
// versies (met tegeldata uit de editor) dezelfde opslag kunnen gebruiken,
// maar als ze er zijn moeten ze kloppen.
function validate_generator(array $d): void
{
    $num = fn($k, $lo, $hi) => !array_key_exists($k, $d)
        || ((is_int($d[$k]) || is_float($d[$k])) && $d[$k] >= $lo && $d[$k] <= $hi)
        || throw new ApiError(422, 'invalid_data', "data.$k moet een getal tussen $lo en $hi zijn.");
    if (array_key_exists('seed', $d) && (!is_string($d['seed']) || mb_strlen($d['seed']) > 64)) {
        throw new ApiError(422, 'invalid_data', 'data.seed moet tekst van hoogstens 64 tekens zijn.');
    }
    if (array_key_exists('size', $d) && !in_array($d['size'], [128, 192, 256, 320, 384], true)) {
        throw new ApiError(422, 'invalid_data', 'data.size moet 128, 192, 256, 320 of 384 zijn.');
    }
    if (array_key_exists('shape', $d) && !in_array($d['shape'], ['continent', 'eilanden', 'binnenland'], true)) {
        throw new ApiError(422, 'invalid_data', 'data.shape moet continent, eilanden of binnenland zijn.');
    }
    if (array_key_exists('players', $d) && !(is_int($d['players']) && $d['players'] >= 2 && $d['players'] <= 8)) {
        throw new ApiError(422, 'invalid_data', 'data.players moet een geheel getal van 2 tot 8 zijn.');
    }
    $num('water', 0, 1);
    $num('mount', 0, 1);
    $num('trees', 0, 1);
}

/**
 * Handelt GET/POST/DELETE af voor een tabel met JSON-documenten.
 * POST-body: {"name": "...", "version": 1, "data": {...}, "id": optioneel om te overschrijven}
 */
function handle_documents(string $table, ?callable $validate = null): never
{
    if (!in_array($table, ['maps', 'saves'], true)) throw new LogicException("Onbekende tabel $table");
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    $id = query_id();

    if ($method === 'GET' && $id === null) {
        $rows = db()->query("SELECT id, name, size, version, bytes, created, updated FROM $table ORDER BY updated DESC, id DESC LIMIT 1000")->fetchAll();
        respond(200, ['items' => $rows]);
    }

    if ($method === 'GET') {
        $st = db()->prepare("SELECT id, name, size, version, data, created, updated FROM $table WHERE id = ?");
        $st->execute([$id]);
        $row = $st->fetch() ?: throw new ApiError(404, 'not_found', 'Niet gevonden.');
        $json = gzuncompress($row['data']);
        if ($json === false) throw new RuntimeException("$table #$id: data niet te lezen");
        $row['data'] = json_decode($json);   // als objecten, zodat {} ook {} blijft
        respond(200, $row);
    }

    if ($method === 'POST') {
        require_token();
        $b = read_json_body();
        $name = valid_name($b['name'] ?? null);
        $version = $b['version'] ?? 1;
        if (!is_int($version) || $version < 1 || $version > 1000) {
            throw new ApiError(422, 'invalid_version', 'version moet een geheel getal van 1 tot 1000 zijn.');
        }
        if (!isset($b['data']) || !is_array($b['data']) || ($b['data'] && array_is_list($b['data']))) {
            throw new ApiError(422, 'invalid_data', 'data is verplicht en moet een JSON-object zijn.');
        }
        if ($validate) $validate($b['data']);
        // Leeg object blijft {} (PHP zou er [] van maken)
        $json = $b['data'] ? json_encode($b['data'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRESERVE_ZERO_FRACTION) : '{}';
        $size = is_int($b['data']['size'] ?? null) ? $b['data']['size'] : null;
        $blob = gzcompress($json, 6);
        $now = gmdate('Y-m-d\TH:i:s\Z');

        $target = $b['id'] ?? null;
        if ($target !== null) {
            if (!is_int($target) || $target < 1) throw new ApiError(422, 'invalid_id', 'id moet een positief geheel getal zijn.');
            $st = db()->prepare("UPDATE $table SET name = ?, size = ?, version = ?, bytes = ?, data = ?, updated = ? WHERE id = ?");
            $st->bindValue(1, $name);
            $st->bindValue(2, $size, $size === null ? PDO::PARAM_NULL : PDO::PARAM_INT);
            $st->bindValue(3, $version, PDO::PARAM_INT);
            $st->bindValue(4, strlen($json), PDO::PARAM_INT);
            $st->bindValue(5, $blob, PDO::PARAM_LOB);
            $st->bindValue(6, $now);
            $st->bindValue(7, $target, PDO::PARAM_INT);
            $st->execute();
            if ($st->rowCount() === 0) throw new ApiError(404, 'not_found', 'Niet gevonden.');
            respond(200, ['id' => $target, 'updated' => $now]);
        }
        $st = db()->prepare("INSERT INTO $table (name, size, version, bytes, data, created, updated) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $st->bindValue(1, $name);
        $st->bindValue(2, $size, $size === null ? PDO::PARAM_NULL : PDO::PARAM_INT);
        $st->bindValue(3, $version, PDO::PARAM_INT);
        $st->bindValue(4, strlen($json), PDO::PARAM_INT);
        $st->bindValue(5, $blob, PDO::PARAM_LOB);
        $st->bindValue(6, $now);
        $st->bindValue(7, $now);
        $st->execute();
        respond(201, ['id' => (int) db()->lastInsertId(), 'created' => $now]);
    }

    if ($method === 'DELETE') {
        require_token();
        if ($id === null) throw new ApiError(400, 'invalid_id', 'id is verplicht.');
        $st = db()->prepare("DELETE FROM $table WHERE id = ?");
        $st->execute([$id]);
        if ($st->rowCount() === 0) throw new ApiError(404, 'not_found', 'Niet gevonden.');
        respond(200, ['deleted' => $id]);
    }

    header('Allow: GET, POST, DELETE');
    throw new ApiError(405, 'method_not_allowed', 'Gebruik GET, POST of DELETE.');
}
