<?php

function returnFault($message) {
    http_response_code(400);
    die($message);
}
try {

if(!isset($_POST['projectName']) || empty($_POST['projectName']))
    returnFault("Specificeer een project naam");
else if(strlen($_POST['projectName']) > 255)
    returnFault("Project naam kan niet langer dan 255 karakters zijn");
else if(str_contains($_POST['projectName'], '"'))
    returnFault("Project naam kan niet \" erin hebben");
$projectName = $_POST['projectName'];

if(!isset($_POST['projectDescription']) || empty($_POST['projectDescription']))
    returnFault("Specificeer een project omschrijving");
else if(strlen($_POST['projectDescription']) > 65535)
    returnFault("Project omschrijving kan niet langer dan 65535 karakters zijn");
else if(str_contains($_POST['projectDescription'], '"'))
    returnFault("Project omschrijving kan niet \" erin hebben");
$projectDescription = $_POST['projectDescription'];

if(!isset($_POST['amountLinks']) || empty($_POST['amountLinks']))
    returnFault("Specificeer de hoeveelheid linkjes");
else if(!ctype_digit($_POST['amountLinks']))
    returnFault("Hoeveelheid linkjes moet een nummer zijn");
$amountLinks = intval($_POST['amountLinks'], 10);

$links = array_fill(0, $amountLinks, "");
for($i = 1; $i <= $amountLinks; $i++) {
    if(!isset($_POST['link' . $i]) || empty($_POST['link' . $i]))
        returnFault("Specificeer link " . $i);
    else if(strlen($_POST['link' . $i]) > 255)
        returnFault("Link mag niet langer zijn dan 255 karakters");
    else if(!filter_var($_POST['link' . $i], FILTER_VALIDATE_URL))
        returnFault("Link moet valide zijn");
    else if(str_contains($_POST['link' . $i], '"'))
        returnFault("Link kan niet \" erin hebben");
    $links[$i - 1] = $_POST['link' . $i];
}

if(!isset($_POST['projectSuggestor']) || empty($_POST['projectSuggestor']))
    returnFault("Specificeer het persoon die dit voorsteld");
else if(is_numeric($_POST['projectSuggestor']))
    returnFault("Persoon die het voorsteld kan niet langer dan 255 karakters zijn");
else if(str_contains($_POST['projectSuggestor'], '"'))
    returnFault("Persoon die het voorsteld kan niet \" erin hebben");

$projectSuggestor = $_POST['projectSuggestor'];

if(!isset($_POST['projectSuggestorEmail']) || empty($_POST['projectSuggestorEmail']))
    returnFault("Specificeer de email van het persoon die dit voorsteld");
else if(is_numeric($_POST['projectSuggestorEmail']))
    returnFault("Email van het persoon die het voorsteld kan niet langer dan 255 karakters zijn");
else if(!filter_var($_POST['projectSuggestorEmail'], FILTER_VALIDATE_EMAIL))
    returnFault("Specificeer een valide email");
else if(str_contains($_POST['projectSuggestorEmail'], '"'))
    returnFault("Email van het persoon die het voorsteld kan niet \" erin hebben");
$projectSuggestorEmail = $_POST['projectSuggestorEmail'];

$json = '{';
$json .= '"projectName":"' . $projectName . '",';
$json .= '"projectDescription":"' . $projectDescription . '",';
$json .= '"links":[';
for($i = 0; $i < $amountLinks; $i++) {
    if($i != 0)
        $json .= ',';
    $json .= '"' . $links[$i] . '"';
}
$json .= '],';
$json .= '"projectSuggestor":"' . $projectSuggestor . '",';
$json .= '"projectSuggestorEmail":"' . $projectSuggestorEmail . '"';
$json .= '}';

include "../MySQL/ConnectionManager.php";
$connection = new ConnectionManager();
$connection->AddProjectSuggestion($json);

echo 'Project is aangevraagd!';

} catch(Exception $e) {
    returnFault("Er is iets fout gegaan");
}