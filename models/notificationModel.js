const ApplicationAPIService = require("../src/Services/ApplicationAPIService");

module.exports = {
  //******** GET ALL MY NOTIFICATIONS *******************************
  getNotifications: (user, callback) => {
    (async () => {
      try {
        const reqLike = {
          user,
          query: {
            work_tab: "pending",
            page: 1,
            per_page: 200,
          },
        };
        const result = await ApplicationAPIService.fetchMyApplications(reqLike);
        const rows = Array.isArray(result?.data) ? result.data : [];

        const payload = rows.map((row) => ({
          tracking_number: row?.tracking_number || "",
          task: row?.application_category?.app_name || "",
          registry_type_id: row?.establishing_school?.registry_type?.id || null,
          application_category_id: row?.application_category_id || null,
          school_name: row?.establishing_school?.school_name || "",
          created_at: row?.created_at || null,
          comments: "",
          staff_name: "",
          title: "",
        }));

        callback(payload, payload.length);
      } catch (error) {
        console.log("getNotifications error", error);
        callback([], 0);
      }
    })();
  },
};
