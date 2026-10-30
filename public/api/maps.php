<?php
// Maps: voorlopig de generator-instelling (seed, size, shape, players,
// water, mount, trees); later ook tegeldata uit de map-editor.
require dirname(__DIR__, 2) . '/lib/api.php';
handle_documents('maps', 'validate_generator');
