const axios = require('axios');
const moment = require('moment-timezone');

async function isWorkingDay(date, timezone) {
  const formattedDate = date.format('YYYY-MM-DD');
  try {
    const response = await axios.get(
      `https://date.nager.at/api/v3/publicholidays/${date.year()}/KR`
    );
    const holidays = response.data.map((holiday) => holiday.date);
    return !holidays.includes(formattedDate) && ![0, 6].includes(date.day());
  } catch (error) {
    console.error('Error fetching holiday data:', error);
    return ![0, 6].includes(date.day()); // Fallback to just weekend check
  }
}

async function sendSlackNotification({
  webhook,
  context,
  reviewers,
  customMessage
}) {
  const timezone = process.env.TIMEZONE || 'Asia/Seoul';
  const workHoursStart = parseInt(process.env.WORK_HOURS_START || '9');
  const workHoursEnd = parseInt(process.env.WORK_HOURS_END || '18');

  const now = moment().tz(timezone);
  const isWorkingHours =
    now.hour() >= workHoursStart && now.hour() < workHoursEnd;

  if (!(await isWorkingDay(now, timezone)) || !isWorkingHours) {
    console.log(
      'Not sending notification outside of working hours or on non-working days'
    );
    return;
  }

  const prNumber = context.payload.pull_request
    ? context.payload.pull_request.number
    : context.payload.inputs.pr_number;
  const prTitle = context.payload.pull_request
    ? context.payload.pull_request.title
    : '제목을 지정하지 않았습니다.';
  const prUrl = context.payload.pull_request
    ? context.payload.pull_request.html_url
    : `https://github.com/${context.repo.owner}/${context.repo.repo}/pull/${prNumber}`;
  const repo = context.repo.repo;

  const reviewerMentions = reviewers
    .map((reviewer) => `<@${reviewer}>`)
    .join(', ');

  let message = `
${customMessage ? customMessage + '\n\n' : ''}
PR 알림 :rocket:
*저장소:* ${repo}
*PR 번호:* #${prNumber}
*제목:* ${prTitle}
*URL:* ${prUrl}
*리뷰어:* ${reviewerMentions}

리뷰 부탁드립니다! :pray:
  `;

  try {
    await axios.post(webhook, { text: message });
    console.log('Slack notification sent successfully');
  } catch (error) {
    console.error('Error sending Slack notification:', error);
    throw error;
  }
}

global.sendSlackNotification = sendSlackNotification;
