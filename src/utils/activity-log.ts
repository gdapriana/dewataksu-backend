type schma = "destination" | "gallery" | "user" | "category" | "tag" | "tradition" | "story" | "like" | "comment" | "bookmark";
const activityLog = (schema: schma, data?: string) => {
  return {
    schema,
    data,
  };
};

export default activityLog;
