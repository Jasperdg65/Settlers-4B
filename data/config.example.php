<?php
// Kopieer naar data/config.php en vul een eigen token in:
//   php -r 'echo bin2hex(random_bytes(32)), "\n";'
return [
    'token'     => 'VERVANG-MIJ',
    'db'        => __DIR__ . '/kolonie.sqlite',
    'max_bytes' => 2 * 1024 * 1024,   // maximale requestgrootte
];
