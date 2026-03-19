const DEFAULT_TEMPLATES = [
  {
    template_key: "barua_kuanzisha",
    name: "Barua - Kibali cha Kuanzisha",
    application_category_id: 1,
    letter_type: null,
    title_template: "KIBALI CHA KUANZISHA {{school.full_name}}",
    body_template: [
      "Tafadhali rejea somo la barua hii.",
      "2. Ninafurahi kukufahamisha kuwa kibali cha kuanzisha {{school.type_only}} <b>{{school_name}}</b> katika Kata ya <b>{{ward}}</b> Halmashauri ya {{ngazi_wilaya ngazi_ya_wilaya}} <b>{{district}}</b> Mkoa wa <b>{{region}}</b> kimetolewa.",
      "3. Kibali hiki kimetolewa kwa mujibu wa <b>Sheria ya Elimu Sura ya 353</b>, kwa masharti kuwa utazingatia mwongozo wa Wizara wa kuanzisha na kusajili shule.",
      "4. <b>Uthibitisho huu siyo kibali cha kusajili Wanafunzi/Wanachuo.</b>",
      "5. Ninakutakia utekelezaji mwema.",
    ].join("\n\n"),
  },
  {
    template_key: "barua_umiliki_mmiliki",
    name: "Barua - Uthibitisho wa Mmiliki",
    application_category_id: 2,
    letter_type: "mmiliki",
    title_template: "UTHIBITISHO WA MMILIKI WA {{school.full_name}}",
    body_template: [
      "Tafadhali rejea somo la barua hii.",
      "2. Ninafurahi kukufahamisha kuwa uthibitisho umetolewa kwa <b>{{owner_name}}</b> kuwa mmiliki wa {{school.type_only}} <b>{{school_name}}</b>.",
      "3. Uthibitisho huu umetolewa tarehe <b>{{fmt_date approved_at}}</b> kwa mujibu wa <b>Sheria ya Elimu, Sura 353</b>. Mmiliki anatakiwa kuzingatia Sheria, Kanuni, Taratibu na Miongozo ya Wizara ya Elimu, Sayansi na Teknolojia.",
      "4. Uthibitisho huu siyo kibali cha kusajili Wanafunzi/Wanachuo.",
      "5. Ninakutakia utekelezaji mwema.",
    ].join("\n\n"),
  },
  {
    template_key: "barua_umiliki_meneja",
    name: "Barua - Uthibitisho wa Meneja",
    application_category_id: 2,
    letter_type: "meneja",
    title_template: "UTHIBITISHO WA MENEJA WA {{school.full_name}}",
    body_template: [
      "Tafadhali rejea somo la barua hii.",
      "2. Ninafurahi kukufahamisha kuwa uthibitisho umetolewa kwa <b>{{manager_name}}</b> kuwa meneja wa {{school.type_only}} <b>{{school_name}}</b>.",
      "3. Uthibitisho huu umetolewa tarehe <b>{{fmt_date approved_at}}</b> kwa mujibu wa <b>Sheria ya Elimu, Sura 353</b>. Meneja anatakiwa kuzingatia Sheria, Kanuni, Taratibu na Miongozo ya Wizara ya Elimu, Sayansi na Teknolojia.",
      "4. Uthibitisho huu siyo kibali cha kusajili Wanafunzi/Wanachuo.",
      "5. Ninakutakia utekelezaji mwema.",
    ].join("\n\n"),
  },
];

const asNullable = (value) => {
  const text = String(value ?? "").trim();
  return text.length ? text : null;
};

module.exports = {
  up: async (connection) => {
    for (const tpl of DEFAULT_TEMPLATES) {
      const [rows] = await connection.query(
        `SELECT id FROM letter_templates WHERE template_key = ? LIMIT 1`,
        [tpl.template_key]
      );
      let templateId = Array.isArray(rows) && rows.length > 0 ? rows[0].id : null;

      if (!templateId) {
        const [result] = await connection.query(
          `INSERT INTO letter_templates (template_key, name, application_category_id, letter_type, is_active)
           VALUES (?, ?, ?, ?, 1)`,
          [
            tpl.template_key,
            tpl.name,
            tpl.application_category_id,
            asNullable(tpl.letter_type),
          ]
        );
        templateId = result.insertId;
      }

      const [versionRows] = await connection.query(
        `SELECT 1 FROM letter_template_versions WHERE letter_template_id = ? AND version = 1 LIMIT 1`,
        [templateId]
      );
      const alreadySeeded = Array.isArray(versionRows) && versionRows.length > 0;
      if (alreadySeeded) continue;

      await connection.query(
        `INSERT INTO letter_template_versions (letter_template_id, version, title_template, body_template)
         VALUES (?, 1, ?, ?)`,
        [templateId, tpl.title_template, tpl.body_template]
      );
    }
  },
};
