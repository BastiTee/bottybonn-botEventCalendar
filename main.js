var config = null;
try {
  config = require("platformsh").config();
} catch (e) {
  config = {
    "variables": require('dotenv').config()
  };
}
var format = require("string-template");
var shared = require('../../modules/sharedFunctions');
var when = require('when');
var rp = require('request-promise');

var botName = 'botEventCalendarBonn';
var botRoute = '/' + botName;

var location = 'Bonn';
var serviceURL = 'http://www.bonn.de/tools/mobil/api.json.php';
var overviewQuery = 'mod=veranstaltungen';

var botDialog = [
  function(session, args, next) {
    console.log('========================================================');
    console.log('= BOT EVENT CALENDAR BONN');
    console.log('========================================================');
    console.log('>>> ARGS: ' + args);
    calendarRequest().then(
      function(calendarResult) {
        var answerText = generateAnswerText(calendarResult);
        session.trans(answerText).then(function(responseTranslated) {
          var answerJson = generateAnswerJson(session, calendarResult, responseTranslated);
          answerJson = session.toMessage(answerJson);
          session.endDialog(answerJson);
        });
      });
  }
];

function calendarRequest() {
  var overviewPromise = rp({
    uri: serviceURL + '?' + overviewQuery,
    json: true
  });

  return when.join(overviewPromise).then(function(values) {
    var result = values[0];
    return result;
  });
}

function generateAnswerText(calendarResult) {
  var answerTextRaw = resolveAnswers[shared.randomWithRange(0, resolveAnswers.length)];

  var value = calendarResult.items[0].title;

  answerText = format(answerTextRaw, {
    location: location,
    value: value
  });

  return answerText;
}

function generateAnswerJson(session, calendarResult, answerText) {
  return JSON.stringify({
    "botname": botName,
    "type": "pegelstand",
    "data": calendarResult,
    "text": answerText,
    "language": session.userData.language,
    "location": location
  });
}

var resolveAnswers = [
  'In {location} ist heute "{value}".',
];

module.exports = botDialog;
