
const resetPassword = (name, link) => `<p>Hi ${name},</p><br/>
                                <div>Forgot your password?</div>
                                <div>We received a request to reset the password for your account.</div>
                                <p>To reset your password, click on the link below:</p>
                                <p><a style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif,'Apple Color Emoji','Segoe UI Emoji','Segoe UI Symbol';box-sizing:border-box;border-radius:3px;color:#fff;display:inline-block;text-decoration:none;background-color:#3490dc;border-top:10px solid #3490dc;border-right:18px solid #3490dc;border-bottom:10px solid #3490dc;border-left:18px solid #3490dc" href='${link}' target='_blank'>Reset Password</a></p>
                                <p>This password reset link will expire in 60 minutes. If you did not request a password reset, no further action is required.</p>
                                <hr />
                                <p>If you’re having trouble clicking the "Reset Password" button, copy and paste the URL below into your web browser: </p>
                                <p><a href='${link}' target='_blank'>${link}</a></p>
                                ${copyright()}
                                `;
const salutation = () => `<br/><p>Kutoka</p><p>Mfumo wa Uanzishaji na Usajili wa Shule</p>`
const copyright = () => `${salutation()}<br/><br/><br/>
<footer class="text-muted email-footer" align="center" style="font-family:Avenir,Helvetica,sans-serif;box-sizing:border-box;margin:0 auto;padding:0;text-align:center;width:570px">
<p style="font-family:Avenir,Helvetica,sans-serif;box-sizing:border-box;line-height:1.5em;margin-top:0;color:#aeaeae;font-size:12px;text-align:center">&copy;Wizara ya Elimu, Sayansi na Teknolojia, Haki zote zimehifadhiwa.</p>
</footer>`;

const notifyStaffOnComment = (
  jina_anayetumiwa,
  aina_ya_ombi,
  jina_aliyetuma,
  link,
  tracking_number
) => `<p>Hi ${jina_anayetumiwa},</p><br/>
    <div>Umetumiwa ombi la <b>${aina_ya_ombi}</b> kutoka kwa <b>${jina_aliyetuma}</b> lenye namba <b>${tracking_number}</b> kwa ajili ya kulifanyia kazi.</div>
    <p>Tembelea kiunga hiki ili uweze kufanyia kazi <a href='${link}' target='_blank'>${link}</a></p>
    ${copyright()}`;

const notifyMwombajiOnComment = (
  jina_anayetumiwa,
  aina_ya_ombi,
  link,
  tracking_number,
  status
) =>
  `${template(
    jina_anayetumiwa,
    `<div>Napenda kukufahamisha kuwa, ombi lako la <b>${aina_ya_ombi}</b> lenye namba <b style="color:blue;">${tracking_number}</b> <i><strong>${status}</i></strong></div>`,
    link
  )}`;

function template(username , content , link){
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Notification</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
      font-size: 14px;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      padding: 20px;
      border-radius: 8px;
    }
    .email-header {
      text-align: center;
      padding: 20px 0;
    }
    .email-header img {
      width: 100%;
      max-width: 600px;
      height: auto;
    }
    .email-body {
      padding: 20px;
      color: #333;
      line-height: 1.6;
    }
    .email-footer {
      text-align: center;
      padding: 20px;
      font-size: 14px;
      color: #888;
    }
    .title {
      color : black
    }
    .btn {
      display: inline-block;
      border-radius: 5px;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <!-- Email Header -->
    <div class="email-header">
      <h1 class="title">Wizara ya Elimu, Sayansi na Teknolojia</h1>
    </div>
    <!-- Email Body -->
    <div class="email-body">
      <h3>Habari ${username},</h3>
      ${content}
      <p>
       <a href="${link}" class="btn"> Tafadhali bonyeza kiunga hiki kutembelea mfumo wa Uanzishaji na Usajili wa Shule ili kuweza kupata taarifa zaidi.</a>
      </p>
      <p>
        Asante kwa ushirikiano wako, Kwa msaada zaidi usisite kuwasiliana nasi.
      </p>
      <p>
        ${copyright()}
      </p>
    </div>
    </body>
</html>`;
}

module.exports = {resetPassword , notifyStaffOnComment , notifyMwombajiOnComment}