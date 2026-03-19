const HTML_ESCAPE_MAP = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  "\"": "&quot;",
  "'": "&#39;",
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/[&<>"']/g, (ch) => HTML_ESCAPE_MAP[ch] || ch);

const getPathValue = (context, path) => {
  const raw = String(path || "").trim();
  if (!raw) return "";
  if (raw === ".") return context;

  const parts = raw.split(".").filter(Boolean);
  let current = context;
  for (const part of parts) {
    if (current === null || current === undefined) return "";
    current = current[part];
  }
  return current === null || current === undefined ? "" : current;
};

const splitTokens = (expr = "") =>
  String(expr || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

const createSwahiliHelpers = () => {
  const schoolMetaFromCategory = (schoolCategoryId) => {
    const id = Number(schoolCategoryId);
    const isSchool = [1, 2, 3].includes(id);
    return {
      noun: isSchool ? "shule" : "chuo",
      of: isSchool ? "ya" : "cha",
      this: isSchool ? "hii" : "hiki",
      // verb prefix is useful for future templates (ime/kime etc.)
      verb_prefix: isSchool ? "i" : "ki",
    };
  };

  return {
    // {{sw_of school.school_category_id}} -> ya/cha
    sw_of: (schoolCategoryId) => schoolMetaFromCategory(schoolCategoryId).of,
    // {{sw_noun school.school_category_id}} -> shule/chuo
    sw_noun: (schoolCategoryId) => schoolMetaFromCategory(schoolCategoryId).noun,
    // {{sw_this school.school_category_id}} -> hii/hiki
    sw_this: (schoolCategoryId) => schoolMetaFromCategory(schoolCategoryId).this,
    ngazi_wilaya: (ngazi) => {
      const value = String(ngazi || "").trim();
      if (value === "Wilaya") return "Wilaya ya";
      if (value === "Mji") return "Mji wa";
      if (value === "Manispaa") return "Manispaa ya";
      if (value === "Jiji") return "Jiji la";
      return value || "";
    },
    fmt_date: (value) => {
      if (!value) return "";
      const date = value instanceof Date ? value : new Date(value);
      if (Number.isNaN(date.getTime())) return String(value);
      const dd = String(date.getDate()).padStart(2, "0");
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      const yyyy = String(date.getFullYear());
      return `${dd}/${mm}/${yyyy}`;
    },
  };
};

const renderExpression = (expression, context, helpers, raw = false) => {
  const tokens = splitTokens(expression);
  if (!tokens.length) return "";

  const [first, ...rest] = tokens;
  if (helpers && typeof helpers[first] === "function") {
    const args = rest.map((arg) => getPathValue(context, arg));
    const value = helpers[first](...args);
    return raw ? String(value ?? "") : escapeHtml(value);
  }

  const value = getPathValue(context, first);
  return raw ? String(value ?? "") : escapeHtml(value);
};

const renderTemplateString = (template, context, helpers) => {
  const input = String(template || "");

  // Triple braces first (raw)
  const withRaw = input.replace(/\{\{\{\s*([^}]+?)\s*\}\}\}/g, (_, expr) =>
    renderExpression(expr, context, helpers, true)
  );

  // Double braces (escaped)
  return withRaw.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, expr) =>
    renderExpression(expr, context, helpers, false)
  );
};

const splitParagraphs = (body = "") => {
  const text = String(body || "").replace(/\r\n/g, "\n");
  return text
    .split(/\n\s*\n/g)
    .map((p) => p.trim())
    .filter(Boolean);
};

const splitLines = (value = "") =>
  String(value || "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

const buildDefaultContext = (data = {}, letterType = null) => {
  const schoolCategoryId = Number(data?.school_category_id || 0) || null;
  const isSchool = [1, 2, 3].includes(Number(schoolCategoryId));
  const categoryLabel = String(data?.category || "").trim();
  const categoryLower = categoryLabel ? categoryLabel.toLowerCase() : "";

  const school = {
    school_category_id: schoolCategoryId,
    name: data?.school_name || "",
    old_name: data?.old_school_name || "",
    noun: isSchool ? "shule" : "chuo",
    of: isSchool ? "ya" : "cha",
    this: isSchool ? "hii" : "hiki",
    type_only: isSchool
      ? `shule ya ${categoryLower || "..."}`.trim()
      : "chuo cha ualimu",
  };
  school.full_name = `${school.type_only} ${school.name}`.trim();

  return {
    ...data,
    type: letterType,
    school,
  };
};

const renderLetterTemplate = ({
  titleTemplate,
  bodyTemplate,
  referenceTemplate = null,
  dateTemplate = null,
  addresseeTemplate = null,
  data,
  letterType = null,
}) => {
  const helpers = createSwahiliHelpers();
  const context = buildDefaultContext(data, letterType);

  const title = renderTemplateString(titleTemplate, context, helpers).trim();
  const body = renderTemplateString(bodyTemplate, context, helpers);
  const paragraphs = splitParagraphs(body);

  const reference = referenceTemplate
    ? renderTemplateString(referenceTemplate, context, helpers).trim()
    : null;
  const date = dateTemplate ? renderTemplateString(dateTemplate, context, helpers).trim() : null;
  const addressee = addresseeTemplate
    ? splitLines(renderTemplateString(addresseeTemplate, context, helpers))
    : null;

  return { title, paragraphs, reference, date, addressee };
};

module.exports = {
  renderLetterTemplate,
};
