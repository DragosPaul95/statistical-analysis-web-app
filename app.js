var express = require('express');
var bodyParser = require('body-parser');
var mysql      = require('mysql');

var app = express();
app.use("/", express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : '',
    database : 'website'
});



/*app.get('/', function (request, response) {

    connection.query('SELECT * FROM surveys', function(err, rows, fields) {
        if (err) throw err;

        response.send(rows);
    });
});*/

app.get('*', function(req, res) {
    res.sendFile('public/index.html', { root: __dirname });
});

app.post('/savesurvey', function (req, res) {
    var post = {
        survey_topic: req.body.survey_topic,
        survey_description: req.body.survey_description,
        survey_client_id: 1
    };
    connection.query("INSERT INTO surveys SET ?", post, function(err, result){
       if (!err) res.sendStatus(200);
        else res.sendStatus(500);
    });

});

app.post('/login', function (req, res) {
    var post = {
        user_email: req.body.username,
        user_password: req.body.password
    };
    connection.query("SELECT * FROM users WHERE user_email = ?", [req.body.username], function(err, result, fields){
       if (!err) {
           if(result[0] && result[0].user_email == post.user_email) {
               if(result[0].user_password == post.user_password) {
                   // authenticated
                   res.sendStatus(200);
               }
           }
           else {
               res.sendStatus(401);
           }
       }
        else res.sendStatus(500);
    });

});


var server = app.listen(3000, function () {
    console.log("server started");
});

