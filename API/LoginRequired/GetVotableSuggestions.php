<?php

require_once $_SERVER['DOCUMENT_ROOT'] . "/Utils/Login.php";
if(!CheckSession()) {
    http_response_code(401);
    die("Je moet ingelogd zijn om dit deel van de API te gebruiken");
}

function ReturnFault($message) {
    http_response_code(400);
    die($message);
}

$suggestions = $MySQLConnection->GetVotableRequestsForUser();
$firstEntry = true;

header('Content-Type: application/json');

echo "[";
foreach($suggestions as &$suggestion) {
    if(!$firstEntry)
        echo ',';
    echo '{';
    echo '"id":"' . $suggestion["id"] . '",';
    echo '"type":"' . $suggestion["type"] . '",';
    echo '"json":' . $suggestion["json"];
    echo '}';

    $firstEntry = false;
}
echo ']';