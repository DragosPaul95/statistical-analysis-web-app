var express = require('express');
var bodyParser = require('body-parser');
var mysql      = require('mysql');
var crypto = require('crypto');
var sync = require('synchronize');
var fiber = sync.fiber;
var await = sync.await;
var defer = sync.defer;

var app = express();
app.use("/", express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
var db = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : '',
    database : 'website'
});

db.connect(function(err) {
    if (err) {
        console.error('error connecting: ' + err.stack);
    }
});


app.get('/getSurvey/:surveyID', function(req, res) {
    var survey = {};
    try {
        fiber(function() {
            var querySurvey = await(db.query('SELECT * FROM surveys WHERE survey_id = ?', req.params.surveyID, defer()));
            survey.title = querySurvey[0].survey_topic;
            survey.description = querySurvey[0].survey_description;
            survey.questions = [];
            var queryQuestions = await(db.query('SELECT * FROM survey_questions WHERE question_survey_id = ?', req.params.surveyID, defer()));
            for(var i = 0; i < queryQuestions.length; i++) {
                var queryChoices = await(db.query('SELECT * FROM questions_choices WHERE question_id = ?', queryQuestions[i].question_id, defer()));
                survey.questions.push({
                    question_id: queryQuestions[i].question_id,
                    question_text: queryQuestions[i].question_text,
                    question_type: queryQuestions[i].question_type,
                    question_choices: queryChoices
                });
            }
        res.send(survey);
        });
    } catch (err) {
        throw err;
    }

});


app.get('*', function(req, res) {
    res.sendFile('public/index.html', { root: __dirname });
});

app.post('/answer/:surveyID', function (req, res) {
    var answers = req.body;
    Object.keys(answers).forEach(function (key) {
        var val = answers[key];
        var insertData = {
            answer_question_id: key,
            answer: val
        };
        try {
            fiber(function() {
                var queryAnswer = await(db.query('INSERT INTO answers SET ?', insertData, defer()));
            });
        } catch (err) {
            throw err;
        }
    });
    return res.sendStatus(200);
});

app.post('/savesurvey', function (req, res) {
    var survey = req.body.survey;
    var userAuth = req.body.userAuth;
    var surveyData = {
        survey_topic: survey.survey_topic,
        survey_description: survey.survey_description,
        survey_user_id: userAuth.userId
    };
    try {
        fiber(function() {
            //check token
            var unauthorized = false;
            var queryUser = await(db.query('SELECT user_token FROM users WHERE user_id = ?', userAuth.userId, defer()));
            if(queryUser[0].user_token != userAuth.token) {
                unauthorized = true;
            }
            if(!unauthorized) {
                var query = await(db.query('INSERT INTO surveys SET ?', surveyData, defer()));
                for(var i = 0; i < survey.questions.length; i++) {
                    var questionData = {
                        question_qid: survey.questions[i].id,
                        question_survey_id: query.insertId,
                        question_text: survey.questions[i].text,
                        question_type: survey.questions[i].type
                    };
                    var questionChoices = survey.questions[i].choices;
                    var query2 = await(db.query('INSERT INTO survey_questions SET ?', questionData, defer()));
                    for(var ii = 0; ii < questionChoices.length; ii++){
                        var choicesData = {
                            question_id: query2.insertId,
                            choice_value: questionChoices[ii].value,
                            choice_label: questionChoices[ii].label
                        };
                        var query3 = await(db.query('INSERT INTO questions_choices SET ?', choicesData, defer()));
                    }
                }
            }
            if(unauthorized) res.sendStatus(401);
            else res.sendStatus(200);
        });
    } catch (err) {
        res.sendStatus(500);
        throw err;
    }
});

app.post('/login', function (req, res) {
    var post = {
        user_email: req.body.username,
        user_password: req.body.password
    };
    var token = crypto.randomBytes(20).toString('hex');
    db.query("SELECT * FROM users WHERE user_email = ?", [req.body.username], function(err, result){
       if (!err) {
           if(result[0] && result[0].user_email == post.user_email) {
               if(result[0].user_password == post.user_password) {
                   // authenticated
                   var authObj = {
                       userId: result[0].user_id,
                       token: ""
                   };
                   db.query("UPDATE users SET user_token = ? WHERE user_id = ?", [token, result[0].user_id], function (err, result) {
                       if(err) { throw err;}
                       else {
                           authObj.token = token;
                           res.send(JSON.stringify({
                               status: 200,
                               auth: authObj
                           })
                           );
                       }
                   });
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

