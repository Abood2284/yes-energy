import {
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

export const d_load_forecast = sqliteTable("d_load_forecast", {
  id: integer("id").primaryKey().notNull(),
  date: text("date").notNull(), // Assuming date as text in 'YYYYMMDD' format
  time: text("time").notNull(), // Assuming time as text in 'HH:MM' format
  load_fcst: text("load_fcst").notNull(),
  revision: text("revision") // Assuming revision is a text field (date and time combined)
});

export const j_load_forecast = sqliteTable("j_load_forecast", {
  id: integer("id").primaryKey().notNull(),
  date: text("text").notNull(), // Assuming date as text in 'YYYYMMDD' format
  time: text("time").notNull(), // Assuming time as text in 'HH:MM' format
  load_fcst: text("load_fcst").notNull(),
  revision: text("revision") // Assuming revision is a text field (date and time combined)
});

export const load_act = sqliteTable("load_act", {
  id: integer("id").primaryKey().notNull(),
  date: text("text").notNull(), // Assuming date as text in 'YYYYMMDD' format
  time: text("time").notNull(), // Assuming time as text in 'HH:MM' format
  load_act: text("load_act").notNull(), // Changed from load_fcst to load_act
});

// Type definitions for better type inference
export type DLoadForecast = typeof d_load_forecast.$inferSelect;
export type JLoadForecast = typeof j_load_forecast.$inferSelect;
export type LoadAct = typeof load_act.$inferSelect;