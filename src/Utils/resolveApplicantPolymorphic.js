const PERSONAL_TYPES = new Set([
  "app\\models\\personal_info",
  "personal_info",
  "person_info",
]);

const INSTITUTE_TYPES = new Set([
  "app\\models\\institute_info",
  "institute_info",
]);

const setValue = (applicant, key, value) => {
  if (!applicant) return;
  if (typeof applicant.setDataValue === "function") {
    applicant.setDataValue(key, value);
    return;
  }
  applicant[key] = value;
};

async function resolveApplicantPolymorphic(applicants, loaders = {}) {
  if (!applicants) return applicants;

  const list = Array.isArray(applicants) ? applicants : [applicants];
  const loadPersonalInfo = loaders.loadPersonalInfo || (async () => null);
  const loadInstituteInfo = loaders.loadInstituteInfo || (async () => null);

  for (const applicant of list) {
    if (!applicant?.applicantable_type) continue;

    const type = String(applicant.applicantable_type || "").trim().toLowerCase();
    const applicantableId = Number.parseInt(applicant.applicantable_id, 10);
    const hasApplicantableId = Number.isFinite(applicantableId) && applicantableId > 0;

    if (PERSONAL_TYPES.has(type)) {
      setValue(applicant, "institute_info", null);
      if (!applicant.personal_info && hasApplicantableId) {
        const personalInfo = await loadPersonalInfo(applicantableId);
        setValue(applicant, "personal_info", personalInfo || null);
      }
      continue;
    }

    if (INSTITUTE_TYPES.has(type)) {
      setValue(applicant, "personal_info", null);
      if (!applicant.institute_info && hasApplicantableId) {
        const instituteInfo = await loadInstituteInfo(applicantableId);
        setValue(applicant, "institute_info", instituteInfo || null);
      }
    }
  }

  return applicants;
}

module.exports = resolveApplicantPolymorphic;
