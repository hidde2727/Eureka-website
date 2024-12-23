## The Eureka site 
#### Made by Hidde Meiburg 

### Server setup
To run this site you only need a server capabel of running nodejs and a mysql database

To use this project in a local enviroment first install nodejs: https://nodejs.org/en/download/prebuilt-installer/current

To connect the database and other API's create a file called '.env' in the /backend/ folder with this content:

```
NODE_ENV='production/development'

DB_HOST='127.0.0.1'
DB_USER='test'
DB_PASSWORD='insert-password'
DB_DATABASE='test'

UPLOADTHING_TOKEN='insert-token'
UPLOADTHING_KEY='insert-key'

GOOGLE_KEY='insert-key'
```

Next fill in the database credentials, your uploadthing token+key and your youtube api key.

Set NODE_ENV to either production or development. Production will lock down all the development extras from running.

Running the command ``` npm run install:all ``` will setup the front and backend for development (production will need ``` npm run build ``` to also be run)

### Database setup

To setup a quick database use this command (While of course swapping out the names, note that all the names need to be the same as in the .env)

```SQL
CREATE DATABASE testDatabase;
CREATE USER 'user'@'127.0.0.1' IDENTIFIED BY 'password';
GRANT ALL ON testDatabase.* TO 'user'@'127.0.0.1';
```
This statement should only be used in a dev environment as this grants all the priviliges to the database user (you need to replace the granted priviliges for production)

To modify the users password run:
```SQL
ALTER USER 'test'@'localhost' IDENTIFIED BY 'newPassword'
```

All the commands to use the general mysql log:
```SQL
    SET GLOBAL general_log = 'ON';
    SET GLOBAL log_output = 'table';
    SELECT * FROM mysql.general_log;
    TRUNCATE table mysql.general_log;
```

### Starting a development server

Run ``` npm start ``` to start the front- and backend server for development. The server will automaticly setup a pepper and create an account with username='admin' and password='password'

When running the production version delete the part of /backend/server.js that is marked to be deleted