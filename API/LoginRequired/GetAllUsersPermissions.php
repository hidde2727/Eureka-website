<?php

require_once $_SERVER['DOCUMENT_ROOT'] . "/Utils/Login.php";
if(!CheckSession()) {
    http_response_code(401);
    die("Je moet ingelogd zijn om dit deel van de API te gebruiken");
}
else if(!HasSessionUserPermission("modify_users")) {
    http_response_code(401);
    die("Geen permissie voor dit deel van de API");
}

function ReturnFault($message) {
    http_response_code(400);
    die($message);
}

require_once $_SERVER['DOCUMENT_ROOT'] . "/Utils/MySQL/ConnectionManager.php";

$users = $MySQLConnection->GetAllUserData();
$firstEntry = true;

header('Content-Type: application/json');

echo "[";
foreach($users as &$user) {
    if(!$firstEntry)
        echo ',';
    echo '{';
    echo '"username":"' . $user["username"] . '",';
    echo '"modifyUsers":"' . $user["modify_users"] . '","addFiles":"' . $user["add_files"] . '","modifyInspiration":"' . $user["modify_inspiration"] . '","modifyProjects":"' . $user["modify_projects"] . '"';
    echo '}';

    $firstEntry = false;
}
echo ']';