// src/Services/StaffService.js
const { Staff, Role  } = require("../Models");

const getStaffWithRole = async (staffId) => {
  const staff = await Staff.findOne({
    where: { id: staffId, user_status: 1 },
    include: [
      {
        model: Role,
        as: "role",
        attributes: ["name", "vyeoId"],
      },
    ],
  });

  return staff;
};

module.exports = { getStaffWithRole };
