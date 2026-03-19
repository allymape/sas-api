const MORE_TEMPLATES = [
  {
    template_key: "barua_usajili_binafsi",
    name: "Barua - Usajili (Binafsi)",
    application_category_id: 4,
    letter_type: "binafsi",
    title_template: "USAJILI WA {{school.full_name}}",
    body_template: [
      "Tafadhali rejea somo la barua hii.",
      "2. Ninafurahi kukufahamisha kuwa {{school.noun}} {{sw_this school.school_category_id}} imesajiliwa na kupewa namba ya usajili <b>{{registration_number}}</b> tarehe <b>{{fmt_date registration_date}}</b>.",
      "3. Unatakiwa kuzingatia Sheria, Kanuni, Taratibu na Miongozo ya Wizara ya Elimu, Sayansi na Teknolojia.",
      "4. Usajili huu ni kwa mujibu wa <b>Sheria ya Elimu, Sura 353</b>.",
      "5. Ninakutakia utekelezaji mwema.",
    ].join("\n\n"),
  },
  {
    template_key: "barua_usajili_serikali",
    name: "Barua - Usajili (Serikali/Halmashauri)",
    application_category_id: 4,
    letter_type: "serikali",
    title_template:
      "USAJILI WA {{school.full_name}} KATIKA HALMASHAURI YA {{ngazi_wilaya ngazi_ya_wilaya}} {{district}}",
    body_template: [
      "Tafadhali rejea somo la barua hii.",
      "2. Ninafurahi kukufahamisha kuwa {{school.noun}} {{sw_this school.school_category_id}} imesajiliwa tarehe <b>{{fmt_date approved_at}}</b> na kupewa namba ya usajili <b>{{registration_number}}</b>.",
      "<table/>",
      "3. Unatakiwa kuzingatia Sheria, Kanuni, Taratibu na Miongozo ya Wizara ya Elimu, Sayansi na Teknolojia.",
      "4. Ninakutakia utekelezaji mwema.",
    ].join("\n\n"),
  },
  {
    template_key: "barua_ongeza_mikondo",
    name: "Barua - Kibali cha Kuongeza Mikondo",
    application_category_id: 5,
    letter_type: null,
    title_template: "KIBALI CHA KUONGEZA MIKONDO ({{stream}}) KWA {{school.full_name}}",
    body_template: [
      "Tafadhali rejea somo la barua hii.",
      "2. Napenda kukufahamisha kuwa ombi lako la kuongeza mikondo <b>{{stream}}</b> katika {{school.type_only}} <b>{{school_name}}</b> limekubaliwa tarehe <b>{{fmt_date approved_at}}</b>.",
      "3. Hata hivyo unatakiwa kuendelea kuboresha miundombinu ya {{school.noun}} pamoja na kuajiri walimu wenye sifa na kununua vitabu vya kutosha.",
      "4. Ninakutakia utekelezaji mwema.",
    ].join("\n\n"),
  },
  {
    template_key: "barua_badili_usajili",
    name: "Barua - Kibali cha Kubadili Usajili",
    application_category_id: 6,
    letter_type: null,
    title_template: "KIBALI CHA KUBADILI USAJILI WA {{school.full_name}}",
    body_template: [
      "Tafadhali rejea somo la barua hii.",
      "2. Napenda kukujulisha kuwa Wizara imeridhia maombi yako ya kubadili usajili wa <b>{{old_category}}</b> kuwa <b>{{category}}</b> katika {{school.full_name}}.",
      "3. <b>Hivyo unatakiwa kuzifahamisha mamlaka nyingine za kielimu kuhusu mabadiliko haya.</b>",
      "4. Ninakutakia utekelezaji mwema.",
    ].join("\n\n"),
  },
  {
    template_key: "barua_badili_mmiliki",
    name: "Barua - Kibali cha Kubadili Mmiliki",
    application_category_id: 7,
    letter_type: null,
    title_template: "KIBALI CHA KUBADILI MMILIKI WA {{school.full_name}}",
    body_template: [
      "Tafadhali rejea somo la barua hii.",
      "2. Wizara inapenda kukujulisha kuwa maombi ya kubadili mmiliki wa {{school.full_name}} yamekubaliwa kuanzia tarehe ya barua hii.",
      "3. {{school.noun}} {{sw_this school.school_category_id}} itaendelea kutumia namba ile ile ya usajili <b>{{registration_number}}</b>. Mmiliki mpya ni <b>{{owner_name}}</b> na mmiliki wa zamani ni <b>{{old_owner_name}}</b>.",
      "4. Ninakutakia utekelezaji mwema.",
    ].join("\n\n"),
  },
  {
    template_key: "barua_badili_meneja",
    name: "Barua - Kibali cha Kubadili Meneja",
    application_category_id: 8,
    letter_type: null,
    title_template: "KIBALI CHA KUBADILI MENEJA WA {{school.full_name}}",
    body_template: [
      "Tafadhali rejea somo la barua hii.",
      "2. Wizara imepokea ombi lako la kubadili Meneja wa {{school.full_name}}.",
      "3. Ninafurahi kukujulisha kuwa ombi lako limekubaliwa. Uthibitisho wa meneja wa zamani <b>{{old_manager_name}}</b> umefutwa na kumthibitisha meneja mpya <b>{{manager_name}}</b> kuanzia tarehe <b>{{fmt_date approved_at}}</b>.",
      "4. Ninakutakia utekelezaji mwema.",
    ].join("\n\n"),
  },
  {
    template_key: "barua_badili_jina",
    name: "Barua - Kibali cha Kubadili Jina",
    application_category_id: 9,
    letter_type: null,
    title_template: "KIBALI CHA KUBADILI JINA LA {{old_school_name}} KUWA {{school_name}}",
    body_template: [
      "Tafadhali rejea somo la barua hii.",
      "2. Wizara imepokea maombi yako ya mabadiliko ya jina la <b>{{old_school_name}}</b> kuwa <b>{{school_name}}</b>.",
      "3. Ninafurahi kukufahamisha kuwa maombi ya mabadiliko ya jina la {{school.noun}} yamekubaliwa. Kuanzia tarehe ya barua hii, {{school.noun}} {{sw_this school.school_category_id}} itatambulika kwa jina la <b>{{school_name}}</b>.",
      "4. Ninakutakia utekelezaji mwema.",
    ].join("\n\n"),
  },
  {
    template_key: "barua_hamisha_shule",
    name: "Barua - Kibali cha Kuhamisha Shule",
    application_category_id: 10,
    letter_type: null,
    title_template: "KIBALI CHA KUHAMISHA {{school.full_name}}",
    body_template: [
      "Tafadhali rejea somo la barua hii.",
      "2. Wizara imepokea maombi ya kibali cha kuhamisha {{school.full_name}} kutoka <b>{{t_ward}}</b> kwenda <b>{{ward}}</b>.",
      "3. Kibali cha kuhamisha kimetolewa kuanzia tarehe ya barua hii. Namba ya usajili itaendelea kutumika kama ilivyo.",
      "4. Ninakutakia utekelezaji mwema.",
    ].join("\n\n"),
  },
  {
    template_key: "barua_futa_usajili",
    name: "Barua - Kufuta Usajili",
    application_category_id: 11,
    letter_type: null,
    title_template: "KUFUTA USAJILI WA {{school.full_name}}",
    body_template: [
      "Tafadhali rejea somo la barua hii.",
      "2. Wizara imepokea ombi la kufuta usajili wa {{school.full_name}}.",
      "3. Kwa mujibu wa <b>Sheria ya Elimu, Sura 353</b>, usajili wa {{school.full_name}} umefutwa kuanzia tarehe ya barua hii.",
      "4. Ninakutakia utekelezaji mwema.",
    ].join("\n\n"),
  },
  {
    template_key: "barua_ongeza_tahasusi",
    name: "Barua - Kibali cha Kuongeza Tahasusi",
    application_category_id: 12,
    letter_type: null,
    title_template: "KIBALI CHA KUONGEZA TAHASUSI KATIKA {{school.full_name}}",
    body_template: [
      "Tafadhali rejea somo la barua hii.",
      "2. Nafurahi kukujulisha kuwa Wizara imekubali kutoa kibali cha kuanzisha tahasusi <b>{{combinations}}</b> mkondo mmoja (01) kwa kila tahasusi kwa {{gender_type}} pekee. Kibali kimetolewa tarehe <b>{{fmt_date approved_at}}</b>.",
      "3. Ninakutakia utekelezaji mwema.",
    ].join("\n\n"),
  },
  {
    template_key: "barua_dahalia",
    name: "Barua - Kibali cha Dahalia",
    application_category_id: 13,
    letter_type: null,
    title_template: "KIBALI CHA KUTOA HUDUMA YA DAHALIA KATIKA {{school.full_name}}",
    body_template: [
      "Tafadhali rejea somo la barua hii.",
      "2. Napenda kukujulisha kuwa maombi yako ya kibali cha kutoa huduma ya Dahalia katika {{school.full_name}} yamekubaliwa. Kibali kimetolewa tarehe <b>{{fmt_date approved_at}}</b> kulaza wanafunzi <b>{{number_of_students}}</b>.",
      "3. Serikali haitahusika na gharama za uendeshaji wa dahalia.",
      "4. Ninakutakia utekelezaji mwema.",
    ].join("\n\n"),
  },
  {
    template_key: "barua_bweni",
    name: "Barua - Kibali cha Bweni",
    application_category_id: 14,
    letter_type: null,
    title_template: "KIBALI CHA KUTOA HUDUMA YA BWENI KATIKA {{school.full_name}}",
    body_template: [
      "Tafadhali rejea somo la barua hii.",
      "2. Napenda kukujulisha kuwa maombi yako ya kibali cha kutoa huduma ya bweni katika {{school.full_name}} yamekubaliwa.",
      "3. Kibali kimetolewa tarehe <b>{{fmt_date approved_at}}</b> kulaza wanafunzi <b>{{number_of_students}} {{gender_type}}</b>.",
      "4. Ninakutakia utekelezaji mwema.",
    ].join("\n\n"),
  },
];

const asNullable = (value) => {
  const text = String(value ?? "").trim();
  return text.length ? text : null;
};

module.exports = {
  up: async (connection) => {
    for (const tpl of MORE_TEMPLATES) {
      const [rows] = await connection.query(
        `SELECT id FROM letter_templates WHERE template_key = ? LIMIT 1`,
        [tpl.template_key],
      );
      let templateId = Array.isArray(rows) && rows.length > 0 ? rows[0].id : null;

      if (!templateId) {
        const [result] = await connection.query(
          `INSERT INTO letter_templates (template_key, name, application_category_id, letter_type, is_active)
           VALUES (?, ?, ?, ?, 1)`,
          [tpl.template_key, tpl.name, tpl.application_category_id, asNullable(tpl.letter_type)],
        );
        templateId = result.insertId;
      }

      const [versionRows] = await connection.query(
        `SELECT 1 FROM letter_template_versions WHERE letter_template_id = ? AND version = 1 LIMIT 1`,
        [templateId],
      );
      const alreadySeeded = Array.isArray(versionRows) && versionRows.length > 0;
      if (alreadySeeded) continue;

      await connection.query(
        `INSERT INTO letter_template_versions (letter_template_id, version, title_template, body_template)
         VALUES (?, 1, ?, ?)`,
        [templateId, tpl.title_template, tpl.body_template],
      );
    }
  },
};

