const axios = require('axios');

const sendSlackNotification = async () => {
  const {
    SLACK_WEBHOOK_URL, PR_TITLE, PR_URL, PR_NUMBER, REPO_NAME,
    EVENT_TYPE, COMMENTER, COMMENT_BODY, COMMENT_URL
  } = process.env;

  let message;

  if (EVENT_TYPE === 'pr') {
    message = {
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "👋 새로운 PR이 생겼어요! 다들 확인 부탁드릴게요!",
            emoji: true
          }
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*저장소:*\n${REPO_NAME}`
            },
            {
              type: "mrkdwn",
              text: `*PR 번호:*\n#${PR_NUMBER}`
            }
          ]
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*제목:*\n${PR_TITLE}`
          }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*URL:*\n${PR_URL}`
          }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*리뷰어:* @here`
          }
        },
        {
          type: "divider"
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: ":pray: 리뷰 부탁드립니다!"
            }
          ]
        }
      ]
    };
  } else if (EVENT_TYPE === 'comment') {
    message = {
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: `:speech_balloon: 새로운 코멘트가 작성되었어요! - PR #${PR_NUMBER}`,
            emoji: true
          }
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*PR Title:*\n${PR_TITLE}`
            },
            {
              type: "mrkdwn",
              text: `*누가 적었게요~*\n${COMMENTER}`
            }
          ]
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*내용:*\n${COMMENT_BODY.length > 200 ? COMMENT_BODY.substring(0, 197) + '...' : COMMENT_BODY}`
          }
        },
        {
          type: "divider"
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: `<${PR_URL}|View PR> • <${COMMENT_URL}|View Comment>`
            }
          ]
        }
      ]
    };
  }

  try {
    await axios.post(SLACK_WEBHOOK_URL, message);
    console.log('Slack notification sent successfully');
  } catch (error) {
    console.error('Error sending Slack notification:', error);
    process.exit(1);
  }
};

sendSlackNotification();