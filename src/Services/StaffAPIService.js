// src/Services/StaffService.js
const { Staff, Role, Vyeo } = require("../Models");

const getStaffWithRole = async (staffId) => {
  const staff = await Staff.findOne({
    where: { id: staffId, user_status: 1 },
    include: [
      {
        model: Role,
        as: "role",
        attributes: ["id", "name", "vyeoId"],
        required: false,
        include: [
          {
            model: Vyeo,
            as: "vyeo",
            attributes: ["id", "rank_name", "rank_level"],
            required: false,
          },
        ],
      },
    ],
  });

  return staff;
};

module.exports = { getStaffWithRole };
