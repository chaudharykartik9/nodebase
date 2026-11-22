// The Google Apps Script to paste into a Google Form. It runs every time the
// form is submitted and sends the answers to the workflow's webhook.
export const generateGoogleFormScript = (
  webhookUrl: string,
) => `function onFormSubmit(e) {
  var formResponse = e.response;
  var itemResponses = formResponse.getItemResponses();

  // Build the answers as { "Question title": answer }
  var responses = {};
  for (var i = 0; i < itemResponses.length; i++) {
    var itemResponse = itemResponses[i];
    responses[itemResponse.getItem().getTitle()] = itemResponse.getResponse();
  }

  // Prepare the webhook payload
  var payload = {
    formId: e.source.getId(),
    formTitle: e.source.getTitle(),
    responseId: formResponse.getId(),
    timestamp: formResponse.getTimestamp(),
    respondentEmail: formResponse.getRespondentEmail(),
    responses: responses
  };

  // Send it to the workflow
  var options = {
    'method': 'post',
    'contentType': 'application/json',
    'payload': JSON.stringify(payload),
    'muteHttpExceptions': true,
    // Skips ngrok's browser warning page when testing through ngrok
    'headers': { 'ngrok-skip-browser-warning': 'true' }
  };

  var WEBHOOK_URL = ${JSON.stringify(webhookUrl)};

  try {
    var response = UrlFetchApp.fetch(WEBHOOK_URL, options);
    console.log('Webhook responded with status ' + response.getResponseCode());
  } catch (error) {
    console.error('Webhook failed:', error);
  }
}`;
