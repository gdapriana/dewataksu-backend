type schma = "destination" | "user" | "category" | "tag" | "tradition" | "story" | "like" | "comment";
const activityLog = (schema: schma, data?: string) => {
  return {
    schema,
    data,
  };
};

export default activityLog;
