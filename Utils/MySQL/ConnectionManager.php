<?php
require_once $_SERVER['DOCUMENT_ROOT'] . "/Utils/MySQL/ConnectionData.php";
class ConnectionManager {

    public $connection;
    function __construct() {
        global $dbServername, $dbUsername, $dbPassword, $dbDatabase;
        $this->connection = new mysqli($dbServername, $dbUsername, $dbPassword, $dbDatabase);
        if ($this->connection->connect_error) {
            die("Connection failed: " . $this->connection->connect_error);
        }
    }

    function ExecuteStatement($statement) {
        $result = $this->connection->query($statement);
        if ($result)
            return $result;
          else
            die("Executing stament failed: " . $this->connection->error);
    }

    function AddProjectSuggestion($json) {
        $statement = $this->connection->prepare("INSERT INTO suggestions (type, json) VALUES(?,?)");
        $statement->bind_param("ss", $type, $json);
        $type = "project";
        $statement->execute();
    }
    function CreateUser($username, $password) {
        $statement = $this->connection->prepare("INSERT INTO users (username, password) VALUES(?,UNHEX(?))");
        $statement->bind_param("ss", $username, $hexPassword);
        $hexPassword = bin2hex($password);
        $statement->execute();
    }
    function CreateSession($id, $credential, $username) {
        $userID = $this->GetUserID($username);
        if($userID == null)
            die("Unknow user");
        
        $statement = $this->connection->prepare("INSERT INTO sessions (id, credential, username, user_ID) VALUES(UNHEX(?),UNHEX(?),?,?)");
        $statement->bind_param("sssi", $hexID, $hexCredential, $username, $userID);
        $hexID = bin2hex($id);
        $hexCredential = bin2hex($credential);
        $statement->execute();
    }

    function IsTableEmpty($tableName) {
        $result = $this->connection->execute_query("SELECT CASE WHEN EXISTS(SELECT 1 FROM $tableName) THEN 0 ELSE 1 END");
        return $result->fetch_column() == "1";
    }
    function DoesSessionIDExist($id) {
        $statement = $this->connection->prepare("SELECT CASE WHEN EXISTS(SELECT 1 FROM sessions WHERE id=UNHEX(?)) THEN 0 ELSE 1 END");
        $statement->bind_param("s", $hexID);
        $hexID = bin2hex($id);
        $statement->execute();
        return $statement->get_result()->fetch_column() == "1";
    }


    function GetUserPassword($username) {
        $statement = $this->connection->prepare("SELECT password FROM users WHERE username=?");
        $statement->bind_param("s", $username);
        $statement->execute();
        $result = $statement->get_result();
        return $result->num_rows == 0 ? null : $result->fetch_column();
    }
    function GetUserID($username) {
        $statement = $this->connection->prepare("SELECT id FROM users WHERE username=?");
        $statement->bind_param("s", $username);
        $statement->execute();
        $result = $statement->get_result();
        return $result->num_rows == 0 ? null : $result->fetch_column();
    }
    function GetSession($sessionID) {
        $this->connection->execute_query("DELETE FROM sessions WHERE invalid_at<CURRENT_TIMESTAMP"); // First remove all the session that are over

        $statement = $this->connection->prepare("SELECT * FROM sessions WHERE id=UNHEX(?)");
        $statement->bind_param("s", $hexSessonID);
        $hexSessonID = bin2hex($sessionID);
        $statement->execute();
        $result = $statement->get_result();
        return $result->num_rows == 0 ? null : $result->fetch_assoc();
    }
    function GetUser($username) {
        $statement = $this->connection->prepare("SELECT * FROM users WHERE username=?");
        $statement->bind_param("s", $username);
        $statement->execute();
        $result = $statement->get_result();
        return $result->num_rows == 0 ? null : $result->fetch_assoc();
    }

}
$MySQLConnection = new ConnectionManager();