<?php
include "ConnectionData.php";
class ConnectionManager {

    public $connection;
    function __construct() {
        global $servername, $username, $password, $database;
        $this->connection = new mysqli($servername, $username, $password, $database);
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
        $this->ExecuteStatement("INSERT INTO suggestions (type, json) VALUES('project','" . $this->connection->real_escape_string($json) . "')");
    }

}