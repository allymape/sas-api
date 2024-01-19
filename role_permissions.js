const rolesPermissions = {
  "Super Admin": {
    // Dashboard
    "Dashboard|Dashibodi": "v",
    // Mpangilio
    "Track Application|Fuatilia Ombi": "v",
    "Users|Watumiaji": "v,c,u,d",
    "Schools|Shule": "v,u",
    "Roles|Jukumu": "v,c,u,d",
    "Permissions|Ruhusa": "v,c,u,d",
    "Combinations|Michepuo": "v,c,u,d",
    "Biases|Tahasusi": "v,c,u,d",
    "Ranks|Ngazi": "v,c,u,d",
    "Hierarchies|Uongozi": "v,c,u,d",
    "Designations|Vyeo": "v,c,u,d",
    "Fees|Ada za Malipo": "v,c,u,d",
    "Attachments|Viambatisho": "v,c,u,d",
    "Wards|Kata": "v,c,u,d",
    "Streets|Mitaa": "v,c,u,d",
    "Districts|Wilaya": "v,c,u,d",
    "Regions|Mikoa": "v,c,u,d",
    "Zones|Kanda": "v,c,u,d",
    "Salaries|Mishahara": "v,c",
    "Applicants|Waombaji": "v,c,u,d",
    "Algorithm|Namba za Usajili": "v,c,u,d",
    "Workflow|Mpangilio wa utendaji kazi": "v,c,u,d",
    // Maombi
    "Initiate Schools|Kuanzisha Shule": "v,c,u",
    "School Owners and Managers|Wamiliki na Meneja wa Shule": "v,c,u",
    "School Registration Private|Kusajili Shule Binafsi": "v,c,u",
    "School Registration Government|Kusajili Shule Serikali": "v,c,u",
    "Change of Streams|Kuongeza Mikondo": "v,c,u",
    "Change School Name|Kubadili jina la shule ": "v,c,u",
    "Change of Bias|Kuongeza Tahasusi ": "v,c,u",
    "Addition of Domitory|Kuongeza Bweni ": "v,c,u",
    "Change of Hostel|Kuongeza Dahalia ": "v,c,u",
    "Change Registration Type|Kubadili Aina ya Usajili ": "v,c,u",
    "Change School Location|Kuhamisha Shule ": "v,c,u",
    "Change of School Owner|Kubadili Mmiliki wa Shule": "v,c,u",
    "Change of School Manager|Kubadili Meneja wa Shule ": "v,c,u",
    "Deregistration of Schools|Kufuta Usajili wa Shule ": "v,c,u",
    // Report
    "Established Schools Report|Ripoti ya Shule zilizoanzishwa": "v",
    "Registered School Report|Ripoti ya Usajili wa Shule": "v",
    "School Owners Report|Ripoti ya Uthibitisho wa Umiliki": "v",
    "School Managers Report|Ripoti ya Uthibitisho wa Umeneja": "v",
    "Change School Name Report|Ripoti ya Kubadili Jina la Shule": "v",
    "Change School Registration Type |Ripoti ya Kubadili Aina ya Usajili": "v",
    "Addition Of Domitory Report|Ripoti ya Kibali cha Kuongeza Bweni": "v",
    "Addition of Hostel Report|Ripoti Kibali cha Kuongeza Daharia": "v",
    "Change School Owners Report|Ripoti ya Kubadili Umiliki": "v",
    "Change School Managers Report|Ripoti ya Kubadili Umeneja": "v",
    "Change School Location Report|Ripoti ya Uhamisho wa Shule": "v",
    "Deregistration Report|Ripoti ya Kufuta Usajili": "v",
    "Addition of Streams Report|Ripoti ya Kuongeza Mikondo": "v",
    "Addition of Bias Report|Ripoti ya Kuongeza Tahasusi": "v",
    // Audit Trail
    "Audit|Kaguzi": "v,c,u,d",
  },
  Admin: {
    "Users|Watumiaji": "v,c,u,d",
    "Roles|Jukumu": "v,c",
  },
  User: {
    "Comments|Maoni" : "v,c"
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
