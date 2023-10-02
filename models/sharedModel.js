const db = require("../dbConnection");

module.exports = {
  myStaffs: (user, callback) => {
    // console.log(user)
    db.query(
      `SELECT r.id as vyeoId, s.id as userId, email, user_level, last_login, 
         s.name as name, phone_no, r.name as role_name 
         FROM staffs s
         LEFT JOIN roles r ON r.id = s.user_level
         LEFT JOIN vyeo v ON v.id = r.vyeoId
         WHERE S.user_status = 1 AND v.id = ${user.section_id}
         `,
      (error, staffs) => {
        if (error) {
          console.log(error);
        }
        // console.log(staffs.length)
        callback(staffs);
      }
    );
  },
};
