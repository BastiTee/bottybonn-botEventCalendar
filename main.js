'use strict;'

const shared = require('../../modules/sharedFunctions');
const dotenv = require('dotenv').config();
const format = require('string-template');
const when = require('when');
const rpromise = require('request-promise');

const botName = 'botEventCalendarBonn';
const location = 'Bonn';
const serviceURL = 'http://www.bonn.de/tools/mobil/api.json.php';
const overviewQuery = 'mod=veranstaltungen';
const config = {
  'variables': dotenv
};
const NO_SERVICE_REQUEST = true;

const botDialog = [
  function(session, args, next) {
    console.log('========================================================');
    console.log('= BOT EVENT CALENDAR BONN');
    console.log('========================================================');
    let context = getMessageContext(session);
    calendarRequest(context).then(
      function(serviceResponse) {
        context.serviceResponse = serviceResponse;
        generateAnswerText(context);
        session.trans(context.answerText).then(
          function(answerTextTranslated) {
            context.answerText = answerTextTranslated;
            generateAnswerJson(context);
            answerJson = session.toMessage(context.answerJson);
            session.endDialog(answerJson);
          });
      });
  }
];

const getMessageContext = function(session) {
  console.log(session.message);
  console.log('========================================================');
  // TODO: Obtain structured information from message
  return {
    session: session,
    message: session.message,
  }
}

const calendarRequest = function(context) {

  if (NO_SERVICE_REQUEST) {
    return when.join(function() {}).then(function(values) {
      return require('./example-response.json');
    });
    return;
  }

  var overviewPromise = rpromise({
    uri: serviceURL + '?' + overviewQuery,
    json: true
  });

  return when.join(overviewPromise).then(function(values) {
    var result = values[0];
    return result;
  });
}

const generateAnswerText = function(context) {
  // TODO Bot could pick up structured info and design a nicer output
  context.answerText = 'Hier sind Veranstaltungen, die dich interessieren könnten.';
}

const convertServiceResponseItem = function(item) {
  let title = item.title;
  let href = decodeURIComponent(item.link);
  return {
    'title': title,
    'href': href,
  }
}

const generateAnswerJson = function(context) {
  let data = [];
  let items = context.serviceResponse.items;
  for (let i = 0; i < items.length && i < 10; i++) {
    data.push(convertServiceResponseItem(items[i]))
  };

  context.answerJson = JSON.stringify({
    'botname': botName,
    'type': 'link_list',
    'data': data,
    'text': context.answerText,
    'language': context.session.userData.language,
    'location': location
  });
}


module.exports = botDialog;
