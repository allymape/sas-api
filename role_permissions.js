const rolesPermissions = {
  "Super Admin": {
    // Dashboard
    "Dashboard|Dashibodi": "v",
    // Mpangilio
    "Users|Watumiaji": "v,c,u,d",
    "Roles|Jukumu": "v,c,u,d",
    "Permissions|Ruhusa": "v,c,u,d",
    "Combinations|Michepuo": "v,c,u,d",
    "Bias|Tahasusi": "v,c,u,d",
    "Designations|Vyeo": "v,c,u,d",
    "Fees|Ada za Malipo": "v,c,u,d",
    "Attachment|Viambatisho": "v,c,u,d",
    "Wards|Kata": "v,c,u,d",
    "Streets|Mitaa": "v,c,u,d",
    "Districts|Wilaya": "v,c,u,d",
    "Regions|Mikoa": "v,c,u,d",
    "Zone|Kanda": "v,c,u,d",
    "Applicants|Waombaji": "v,c,u,d",
    // Maombi
    "Initiate Schools|Kuanzisha Shule": "v,c,u",
    "School Owners| Wamiliki wa Shule": "v,c,u",
    "School Registration Private| Kusajili Shule Binafsi": "v,c,u",
    "School Registration Serikali| Kusajili Shule Serikali": "v,c,u",
    // Report
    // Audit Trail
    "Audit|Kaguzi": "v,c,u,d",
  },
  Admin: {
    "Users|Watumiaji": "v,c,u,d",
    Roles: "v",
  },
};
const translations = {
  en: {
    v: "view",
    c: "create",
    u: "update",
    d: "delete",
    r: "restore",
  },
  sw: {
    v: "ona",
    c: "tengeneza",
    u: "badili",
    d: "futa",
    r: "rudisha",
  },
};

module.exports = {rolesPermissions , translations}
