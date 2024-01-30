
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
const salutation = () => `<br/><p>Regards,</p><p>School Accreditation System</p>`
const copyright = () => `${salutation()}<br/><br/><br/>
<footer class="text-muted" align="center" style="font-family:Avenir,Helvetica,sans-serif;box-sizing:border-box;margin:0 auto;padding:0;text-align:center;width:570px">
<p style="font-family:Avenir,Helvetica,sans-serif;box-sizing:border-box;line-height:1.5em;margin-top:0;color:#aeaeae;font-size:12px;text-align:center">&copy;Wizara ya Elimu, Sayansi na Teknolojia, Haki zote zimehifadhiwa.</p>
</footer>`;

const notifyUserOnComment = (
  jina_anayetumiwa,
  aina_ya_ombi,
  jina_aliyetuma,
  link,
  tracking_number
) => `<p>Hi ${jina_anayetumiwa},</p><br/>
    <div>Umetumiwa ombi la <b>${aina_ya_ombi}</b> kutoka kwa <b>${jina_aliyetuma}</b> lenye namba <b>${tracking_number}</b> kwa ajili ya kulifanyia kazi.</div>
    <p>Tembelea kiunga hiki ili uweze kufanyia kazi <a href='${link}' target='_blank'>${link}</a></p>
    ${copyright()}
                                `;
module.exports = {resetPassword , notifyUserOnComment}