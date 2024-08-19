const axios = require('axios')
const moment = require('moment-timezone')

async function sendSlackNotification(webhook, message) {
    try {
        await axios.post(webhook, { text: message })
        console.log('Slack notification sent successfully')
    } catch (error) {
        console.error('Error sending Slack notification:', error)
        throw error
    }
}

async function sendPRCommentNotification({ webhook, context }) {
    const event = context.payload
    let prNumber, commentUrl, commentBody, commenter, prTitle, prUrl

    if (context.eventName === 'pull_request_review_comment') {
        prNumber = event.pull_request.number
        commentUrl = event.comment.html_url
        commentBody = event.comment.body
        commenter = event.comment.user.login
        prTitle = event.pull_request.title
        prUrl = event.pull_request.html_url
    } else {
        prNumber = event.issue.number
        commentUrl = event.comment.html_url
        commentBody = event.comment.body
        commenter = event.comment.user.login
        prTitle = event.issue.title
        prUrl = event.issue.pull_request.html_url
    }

    const message = `
:speech_balloon: New comment on PR #${prNumber}
*PR Title:* ${prTitle}
*Commenter:* ${commenter}
*Comment:* ${commentBody.length > 100 ? commentBody.substring(0, 97) + '...' : commentBody}
*PR URL:* ${prUrl}
*Comment URL:* ${commentUrl}
  `

    await sendSlackNotification(webhook, message)
}

global.sendPRCommentNotification = sendPRCommentNotification