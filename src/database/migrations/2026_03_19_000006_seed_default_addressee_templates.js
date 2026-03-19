const DEFAULT_ADDRESSEES = [
  {
    template_key: "addressee_binafsi",
    name: "Binafsi (Mwombaji)",
    address_kind: "binafsi",
    addressee_template: [
      "{{address_title}},",
      "{{address_name}},",
      "S.L.P {{address_box}},",
      "{{address_region}}.",
    ].join("\n"),
  },
  {
    template_key: "addressee_taasisi",
    name: "Taasisi (Mwombaji)",
    address_kind: "taasisi",
    addressee_template: [
      "{{address_title}},",
      "{{address_name}},",
      "S.L.P {{address_box}},",
      "{{address_region}}.",
    ].join("\n"),
  },
];

module.exports = {
  up: async (connection) => {
    for (const tpl of DEFAULT_ADDRESSEES) {
      const [rows] = await connection.query(
        `SELECT id FROM letter_addressee_templates WHERE template_key = ? LIMIT 1`,
        [tpl.template_key],
      );
      const exists = Array.isArray(rows) && rows.length > 0;
      if (exists) continue;

      await connection.query(
        `INSERT INTO letter_addressee_templates (template_key, name, address_kind, addressee_template, is_active)
         VALUES (?, ?, ?, ?, 1)`,
        [tpl.template_key, tpl.name, tpl.address_kind, tpl.addressee_template],
      );
    }
  },
};

