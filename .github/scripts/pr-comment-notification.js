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
    let prNumber, commentUrl, commentBody, commenter, prTitle, prUrl, isReview, reviewState

    if (context.eventName === 'pull_request_review_comment') {
        prNumber = event.pull_request.number
        commentUrl = event.comment.html_url
        commentBody = event.comment.body
        commenter = event.comment.user.login
        prTitle = event.pull_request.title
        prUrl = event.pull_request.html_url
        isReview = true
        reviewState = event.pull_request.review.state
    } else if (context.eventName === 'pull_request_review') {
        prNumber = event.pull_request.number
        commentUrl = event.review.html_url
        commentBody = event.review.body
        commenter = event.review.user.login
        prTitle = event.pull_request.title
        prUrl = event.pull_request.html_url
        isReview = true
        reviewState = event.review.state
    } else {
        prNumber = event.issue.number
        commentUrl = event.comment.html_url
        commentBody = event.comment.body
        commenter = event.comment.user.login
        prTitle = event.issue.title
        prUrl = event.issue.pull_request.html_url
        isReview = false
    }

    const reviewStateEmoji = {
        approved: ':white_check_mark:',
        changes_requested: ':x:',
        commented: ':speech_balloon:',
    }

    const headerText = isReview
        ? `${reviewStateEmoji[reviewState] || ':speech_balloon:'} New Review on PR #${prNumber}`
        : `:speech_balloon: New Comment on PR #${prNumber}`

    const message = {
        blocks: [
            {
                type: "header",
                text: {
                    type: "plain_text",
                    text: headerText,
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
                        text: `*${isReview ? 'Reviewer' : 'Commenter'}:*\n${commenter}`
                    }
                ]
            }
        ]
    }

    if (isReview && reviewState) {
        message.blocks.push({
            type: "section",
            text: {
                type: "mrkdwn",
                text: `*Review State:* ${reviewState.replace('_', ' ').charAt(0).toUpperCase() + reviewState.slice(1)}`
            }
        })
    }

    if (commentBody) {
        message.blocks.push({
            type: "section",
            text: {
                type: "mrkdwn",
                text: `*${isReview ? 'Review Comment' : 'Comment'}:*\n${commentBody.length > 200 ? commentBody.substring(0, 197) + '...' : commentBody}`
            }
        })
    }

    message.blocks.push(
        {
            type: "divider"
        },
        {
            type: "context",
            elements: [
                {
                    type: "mrkdwn",
                    text: `<${prUrl}|View PR> • <${commentUrl}|View ${isReview ? 'Review' : 'Comment'}>`
                }
            ]
        }
    )

    await sendSlackNotification(webhook, message)
}

global.sendPRCommentNotification = sendPRCommentNotification