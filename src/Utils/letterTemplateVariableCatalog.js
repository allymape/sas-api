const VARIABLE_CATALOG = [
  {
    key: "school_name",
    label: "Jina la shule/chuo",
    example: "MWAKALELI SECONDARY SCHOOL",
  },
  {
    key: "old_school_name",
    label: "Jina la zamani (kama lipo)",
    example: "OLD NAME SCHOOL",
  },
  {
    key: "category",
    label: "Aina ya shule (mf. Sekondari/Msingi/Awali/Chuo cha Ualimu)",
    example: "Sekondari",
  },
  {
    key: "approved_at",
    label: "Tarehe ya kuidhinishwa (raw)",
    example: "2026-03-18 10:30:00",
  },
  {
    key: "folio",
    label: "Folio ya ombi",
    example: "1234",
  },
  {
    key: "file_number",
    label: "File number ya shule",
    example: "EDU/SEC/001",
  },
  {
    key: "region",
    label: "Mkoa wa shule",
    example: "DODOMA",
  },
  {
    key: "district",
    label: "Halmashauri/Wilaya",
    example: "DODOMA JIJI",
  },
  {
    key: "ward",
    label: "Kata",
    example: "MTUMBA",
  },
  {
    key: "registration_number",
    label: "Namba ya usajili",
    example: "S.1234",
  },
  {
    key: "registration_date",
    label: "Tarehe ya usajili (raw)",
    example: "2026-03-01",
  },
  {
    key: "owner_name",
    label: "Jina la mmiliki (kama lipo)",
    example: "JOHN DOE",
  },
  {
    key: "manager_name",
    label: "Jina la meneja (kama lipo)",
    example: "JANE DOE",
  },
  {
    key: "address_title",
    label: "Title ya anwani (mf. Ndugu/Mkurugenzi)",
    example: "Mkurugenzi",
  },
  {
    key: "address_name",
    label: "Jina la anwani (mwombaji)",
    example: "KAMPUNI XYZ",
  },
  {
    key: "address_box",
    label: "S.L.P",
    example: "10",
  },
  {
    key: "address_region",
    label: "Mkoa wa anwani (box location)",
    example: "DODOMA",
  },
  {
    key: "zone_name",
    label: "Kanda/Zone",
    example: "KANDA YA KATI",
  },
  {
    key: "ngazi_ya_wilaya",
    label: "Ngazi ya halmashauri (Wilaya/Mji/Manispaa/Jiji)",
    example: "Jiji",
  },
  {
    key: "masharti",
    label: "Masharti (kama yapo; inaweza kuwa HTML)",
    example: "<p>Masharti...</p>",
  },
  {
    key: "school.noun",
    label: "Neno kuu (shule/chuo)",
    example: "shule",
  },
  {
    key: "school.of",
    label: "Kiunganishi (ya/cha) kulingana na shule/chuo",
    example: "ya",
  },
  {
    key: "school.this",
    label: "Kiashiria (hii/hiki)",
    example: "hii",
  },
  {
    key: "school.type_only",
    label: "Aina ya taasisi (mf. 'shule ya sekondari' / 'chuo cha ualimu')",
    example: "shule ya sekondari",
  },
  {
    key: "school.full_name",
    label: "Aina + jina (mf. 'shule ya sekondari ABC')",
    example: "shule ya sekondari ABC",
  },
  {
    key: "helpers.sw_of",
    label: "Helper: {{sw_of school.school_category_id}} -> ya/cha",
    example: "{{sw_of school.school_category_id}}",
  },
  {
    key: "helpers.fmt_date",
    label: "Helper: {{fmt_date approved_at}} -> DD/MM/YYYY",
    example: "{{fmt_date approved_at}}",
  },
  {
    key: "helpers.ngazi_wilaya",
    label: "Helper: {{ngazi_wilaya ngazi_ya_wilaya}} -> Wilaya ya/Mji wa/Manispaa ya/Jiji la",
    example: "{{ngazi_wilaya ngazi_ya_wilaya}}",
  },
];

const TEMPLATE_NOTES = [
  "Syntax: {{variable}} (escaped) au {{{variable}}} (raw).",
  "Paragraphs zitenganishwe kwa mstari tupu (blank line).",
  "Unaweza kutumia <b>...</b> na <u>...</u> kwa formatting ya PDF.",
  "Helpers zilizopo: sw_of, sw_noun, sw_this, ngazi_wilaya, fmt_date.",
];

module.exports = {
  VARIABLE_CATALOG,
  TEMPLATE_NOTES,
};
