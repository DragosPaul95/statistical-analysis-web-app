var express = require('express');
var bodyParser = require('body-parser');
var mysql      = require('mysql');
var crypto = require('crypto');
//var bcrypt = require('bcrypt');
var sync = require('synchronize');
var fiber = sync.fiber;
var await = sync.await;
var defer = sync.defer;

var app = express();
app.use("/", express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
var db = mysql.createConnection({
    //localhost if internet, 127.0.0.1 if no internet
    host     : '127.0.0.1',
    user     : 'root',
    password : '',
    database : 'student_forms'
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
            survey.title = querySurvey[0].survey_title;
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

app.get('/questionstats/:questionId', function(req, res) {
    try {
        fiber(function() {
            var iterator;
            var answersObj = [];
            var labelsObj = {};
            var queryQuestion = await(db.query('SELECT * FROM survey_questions WHERE question_id = ?', req.params.questionId, defer()))[0];
            var queryQuestionLabels = await(db.query('SELECT choice_value, choice_label FROM `questions_choices` WHERE question_id = ?', req.params.questionId, defer()));
            for(iterator = 0; iterator<queryQuestionLabels.length; iterator++) {
                labelsObj[queryQuestionLabels[iterator].choice_value] = queryQuestionLabels[iterator].choice_label;
            }
            var queryAnswers = await(db.query('SELECT answer, COUNT(answer) as count FROM `answers` WHERE answer_question_id = ? GROUP BY answer', req.params.questionId, defer()));
            var totalAnswers = 0;
            for(iterator = 0; iterator<queryAnswers.length; iterator++) {
                totalAnswers += queryAnswers[iterator].count;
            }
            for(iterator = 0; iterator<queryAnswers.length; iterator++) {
                answersObj.push({
                   "option":  labelsObj[queryAnswers[iterator].answer],
                    "value": ( (queryAnswers[iterator].count/totalAnswers)*100).toFixed(2)
                });
            }
            queryQuestion.totalAnswers = totalAnswers;
            queryQuestion.answers = answersObj;
            res.send(queryQuestion);
        });
    } catch (err) {
        throw err;
    }

});



app.post('/surveysByUser', function(req, res) {
    var userAuth = req.body.userAuth;
    try {
        fiber(function() {
            var surveyIterator, questionsIterator;
            var userQuests = [];
            var surveyCountPerUser = await(db.query('SELECT survey_id FROM surveys WHERE survey_user_id = ?', userAuth.userId, defer()));
            for(surveyIterator = 0; surveyIterator < surveyCountPerUser.length; surveyIterator++) {
                var survey = {};
                var querySurvey = await(db.query('SELECT * FROM surveys WHERE survey_id = ?', surveyCountPerUser[surveyIterator].survey_id, defer()));
                survey.total_answers = await(db.query('SELECT FLOOR(COUNT(a.answer_id)/COUNT(DISTINCT a.answer_question_id)) as total_answers FROM `answers` a JOIN survey_questions sq ON sq.question_id=a.answer_question_id JOIN surveys s ON s.survey_id = sq.question_survey_id WHERE s.survey_id = ?', surveyCountPerUser[surveyIterator].survey_id, defer()))[0].total_answers;
                survey.id = surveyCountPerUser[surveyIterator].survey_id;
                survey.title = querySurvey[0].survey_title;
                survey.description = querySurvey[0].survey_description;
                survey.date = querySurvey[0].survey_datetime;
                survey.questions = [];
                var queryQuestions = await(db.query('SELECT * FROM survey_questions WHERE question_survey_id = ?', surveyCountPerUser[surveyIterator].survey_id, defer()));
                for(questionsIterator = 0; questionsIterator < queryQuestions.length; questionsIterator++) {
                    var queryChoices = await(db.query('SELECT * FROM questions_choices WHERE question_id = ?', queryQuestions[questionsIterator].question_id, defer()));
                    survey.questions.push({
                        question_id: queryQuestions[questionsIterator].question_id,
                        question_text: queryQuestions[questionsIterator].question_text,
                        question_type: queryQuestions[questionsIterator].question_type,
                        question_choices: queryChoices
                    });
                }
                userQuests.push(survey);
            }
            res.send(userQuests);

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
        var splitValues = answers[key].split(',');
        try {
            fiber(function() {
                for(var i = 0; i < splitValues.length; i++) {
                    var insertData = {
                        answer_question_id: key,
                        answer: splitValues[i]
                    };
                    var queryAnswer = await(db.query('INSERT INTO answers SET ?', insertData, defer()));
                }
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
        survey_title: survey.survey_title,
        survey_description: survey.survey_description,
        survey_user_id: userAuth.userId,
        survey_datetime: new Date()
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
               if(result[0].user_password_hash == post.user_password) {
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

