var express = require('express');
var bodyParser = require('body-parser');
var mysql      = require('mysql');
var crypto = require('crypto');
var algebra = require('algebra.js');
var bcrypt = require('bcrypt-nodejs');
var sync = require('synchronize');
var fiber = sync.fiber;
var await = sync.await;
var defer = sync.defer;
var Fraction = algebra.Fraction;
var Expression = algebra.Expression;
var Equation = algebra.Equation;

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

app.get('/multianalysis/:surveyID', function(req, res) {
   try {
       fiber(function() {
           var questions = [];
           var queryQuestions = await(db.query('SELECT * FROM survey_questions WHERE question_survey_id = ?', req.params.surveyID, defer()));
           for(var i = 0; i < queryQuestions.length; i++) {
               var queryChoices = await(db.query('SELECT * FROM questions_choices WHERE question_id = ?', queryQuestions[i].question_id, defer()));
               questions.push({
                   question_id: queryQuestions[i].question_id,
                   question_text: queryQuestions[i].question_text,
                   question_type: queryQuestions[i].question_type,
                   question_choices: queryChoices
               });
           }


           var questionsWithCount = [];
           var maxAnswersArr = [];
           for(var i=0;i<questions.length;i++) {
               var question = questions[i];

               var questionObj = {};
               var maxCount = 0;
               var labelMaxCountChoice;
               for (var ii=0; ii<question.question_choices.length;ii++){
                   var choice = question.question_choices[ii];

                   var choiceAnswers = await(db.query('SELECT qc.choice_label, COUNT(a.answer) as choice_count FROM answers a ' +
                       'JOIN survey_questions sq ON a.answer_question_id = sq.question_id ' +
                       'JOIN questions_choices qc ON qc.question_id = sq.question_id ' +
                       'WHERE sq.question_id = ? AND qc.choice_value = ? AND a.answer = ? GROUP BY qc.choice_label', [choice.question_id, choice.choice_value, choice.choice_value], defer())
                   );
                   questionObj[choiceAnswers[0].choice_label] = choiceAnswers[0].choice_count;
                   if(choiceAnswers[0].choice_count > maxCount) {
                       maxCount = choiceAnswers[0].choice_count;
                       labelMaxCountChoice = choiceAnswers[0].choice_label;
                   }
               }
               questionsWithCount.push(questionObj);
               maxAnswersArr.push({
                   "choice": labelMaxCountChoice,
                   "value": maxCount
               });
           }

           var geoMeanObj = {};
           for(var i=0;i<questions.length;i++) {
               var keys = Object.keys(questionsWithCount[i]);
               for(var ii=0;ii<keys.length;ii++){
                   var val = (questionsWithCount[i][keys[ii]] / maxAnswersArr[i].value);
                   if(geoMeanObj[keys[ii]] === undefined) geoMeanObj[keys[ii]] = val + "##";
                   else geoMeanObj[keys[ii]] += val + "##";
               }
           }

           var geometricMeanFunc = function(x) {
               var n = x.length;
               var GM_log = 0.0;
               for (var i = 0; i < n; ++i) {
                   if (x[i] == 0) {
                       return 0.0;
                   }
                   GM_log += Math.log(x[i]);
               }
               return Math.exp(GM_log / n);
           };

           var geoMeanArr = [];
           for(var key in geoMeanObj) {
               var splitVals = geoMeanObj[key].split("##");
               for(var i = 0; i< splitVals.length; i++) {
                   if(splitVals[i] !== "") splitVals[i] = parseFloat(splitVals[i]);
                   else splitVals.splice(i, 1);
               }
               geoMeanArr.push({
                   key: key,
                   mean: geometricMeanFunc(splitVals)
               })
           }
           geoMeanArr.sort(function(a,b) { return parseFloat(b.mean) - parseFloat(a.mean) } );


           res.send(geoMeanArr);
       })
   }  catch (err) {
       throw err;
   }
});

app.get('/regression/:qId1/:qId2', function(req, res) {
    var survey = {};
    try {
        fiber(function() {
            var x = await(db.query('SELECT answer FROM `answers` WHERE answer_question_id = ?', req.params.qId1, defer()));
            var y = await(db.query('SELECT answer FROM `answers` WHERE answer_question_id = ?', req.params.qId2, defer()));
            var sumX = 0;
            var sumY = 0;
            var sumXsq = 0;
            var sumXY = 0;
            for(var i=0;i<x.length;i++) {
                sumX += parseInt(x[i].answer);
                sumY += parseInt(y[i].answer);
                sumXsq += Math.pow(parseInt(x[i].answer), 2);
                sumXY += (parseInt(x[i].answer) * parseInt(y[i].answer));
            }
            var eq1_1String = "";
            eq1_1String += x.length + " * a + " + sumX + " * b";
            var eq1_2String = sumY.toString();
            var eq1_1 = algebra.parse(eq1_1String);
            var eq1_2 = algebra.parse(eq1_2String);
            var eq1 = new Equation(eq1_1, eq1_2);
            var bEqVal = eq1.solveFor("b");

            var eq2_1String = "";
            eq2_1String += sumX + " * a + " + sumXsq + " * (" + bEqVal.toString() + ")";
            var eq2_2String = sumXY.toString();
            var eq2_1 = algebra.parse(eq2_1String);
            var eq2_2 = algebra.parse(eq2_2String);
            var eq2 = new Equation(eq2_1, eq2_2);
            var aVal = eq2.solveFor("a");

            var eq3_1String = x.length + " * " + aVal.toString() + " + " + sumX + " * b";
            var eq3_1 = algebra.parse(eq3_1String);
            var eq3_2 = eq1_2;
            var eq3 = new Equation(eq3_1, eq3_2);
            var bVal = eq3.solveFor("b");

            res.send({
                "questionId": req.params.qId1,
                "a": aVal.numer / aVal.denom,
                "b": bVal.numer / bVal.denom
            });

        });
    } catch (err) {
        throw err;
    }

});


app.get('/correlation/:questionId1/:questionId2', function (req,res) {
    try {
        fiber(function() {
            var queryAnswers1 = await(db.query('SELECT answer FROM `answers` WHERE answer_question_id = ?', req.params.questionId1, defer()));
            var queryAnswers2 = await(db.query('SELECT answer FROM `answers` WHERE answer_question_id = ?', req.params.questionId2, defer()));
            var xMean, yMean;
            var sumX = 0;
            var sumY = 0;
            var sumUpper = 0;
            var sumYMsq = 0;
            var sumXMsq = 0;
            var scatterPlotValues = [];
            for(var i = 0; i < queryAnswers1.length; i++) {
                sumX += parseInt(queryAnswers1[i].answer);
                sumY += parseInt(queryAnswers2[i].answer);
                scatterPlotValues.push({
                    "ax": parseInt(queryAnswers1[i].answer),
                    "ay": parseInt(queryAnswers2[i].answer)
                });
            }
            xMean = sumX/queryAnswers1.length;
            yMean = sumY/queryAnswers2.length;

            for(var i = 0; i < queryAnswers1.length; i++) {
                sumUpper += (parseInt(queryAnswers1[i].answer)-xMean) * (parseInt(queryAnswers2[i].answer)-yMean);
                sumXMsq += Math.pow( parseInt(queryAnswers1[i].answer) - xMean  ,2);
                sumYMsq += Math.pow( parseInt(queryAnswers2[i].answer) - yMean  ,2);
            }
            var pearsonR = sumUpper / (Math.sqrt(sumXMsq) * Math.sqrt(sumYMsq));
            res.send({
                questionId: req.params.questionId1,
                pearsonCoefficient: pearsonR,
                scatterPlotValues: scatterPlotValues
            })
        });
    } catch (err) {
        throw err;
    }
});

app.get('/getstats/:questionId', function (req,res) {
    try {
        fiber(function() {
            var questionStatistics = {};
            var getStandardDeviation = function () {
                var queryAnswers = await(db.query('SELECT answer FROM `answers` WHERE answer_question_id = ?', req.params.questionId, defer()));
                var sum = queryAnswers.reduce(function(a, b) {
                    return {answer: parseInt(a.answer) + parseInt(b.answer)};
                });
                var avg = sum.answer / queryAnswers.length;
                var sumOfSquares = 0 ;
                for(var i = 0, len=queryAnswers.length; i<len; i++) {
                    sumOfSquares += Math.pow((queryAnswers[i].answer-avg), 2);
                }
                //bessel correction(n-1) when using sample mean
                var variance = sumOfSquares/(queryAnswers.length-1);
                questionStatistics.stdev = (Math.sqrt(variance)).toFixed(6);
            };

            getStandardDeviation();

            res.send({
                questionId: req.params.questionId,
                stats: questionStatistics
            });
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
                    "valuePercentage": ( (queryAnswers[iterator].count/totalAnswers)*100).toFixed(2),
                    "valueRaw": queryAnswers[iterator].count
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
                    if(questionData.question_type != "text") {
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
               if(bcrypt.compareSync(post.user_password, result[0].user_password_hash))  {
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
               else {
                   res.sendStatus(403);
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

