const axios = require('axios')
const moment = require('moment-timezone')

async function sendSlackNotification(webhook, message) {
    try {
        await axios.post(webhook, message)
        console.log('Slack notification sent successfully')
    } catch (error) {
        console.error('Error sending Slack notification:', error)
        throw error
    }
}

async function sendPRCommentNotification({ webhook, context }) {
    const event = context.payload

    const prNumber = event.issue.number
    const commentUrl = event.comment.html_url
    const commentBody = event.comment.body
    const commenter = event.comment.user.login
    const prTitle = event.issue.title
    const prUrl = event.issue.pull_request.html_url

    const message = {
        blocks: [
            {
                type: "header",
                text: {
                    type: "plain_text",
                    text: `:speech_balloon: New Comment on PR #${prNumber}`,
                    emoji: true
                }
            },
            {
                type: "section",
                fields: [
                    {
                        type: "mrkdwn",
                        text: `*PR Title:*\n${prTitle}`
                    },
                    {
                        type: "mrkdwn",
                        text: `*Commenter:*\n${commenter}`
                    }
                ]
            },
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: `*Comment:*\n${commentBody.length > 200 ? commentBody.substring(0, 197) + '...' : commentBody}`
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
                        text: `<${prUrl}|View PR> • <${commentUrl}|View Comment>`
                    }
                ]
            }
        ]
    }

    await sendSlackNotification(webhook, message)
}

global.sendPRCommentNotification = sendPRCommentNotification