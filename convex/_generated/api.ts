/* eslint-disable */
/**
 * Generated API Action types.
 */
import { anyApi } from "convex/server";

export const api: any = anyApi;

api.users = {
  store: "users:store",
  getByToken: "users:getByToken",
  updateRole: "users:updateRole",
};
api.news = {
  list: "news:list",
  create: "news:create",
  remove: "news:remove",
};
api.discussions = {
  list: "discussions:list",
  send: "discussions:send",
};
api.applications = {
  list: "applications:list",
  getPendingByUser: "applications:getPendingByUser",
  create: "applications:create",
  updateStatus: "applications:updateStatus",
};
api.anime = {
  list: "anime:list",
  listAll: "anime:listAll",
};
api.health = {
  ping: "health:ping",
};

export const internal: any = {};

