export const flags = {
  chl:        process.env.NEXT_PUBLIC_FLAG_CHL === "1",
  altimetry:  process.env.NEXT_PUBLIC_FLAG_ALTIMETRY === "1",
  ais:        process.env.NEXT_PUBLIC_FLAG_AIS === "1",
  reports:    process.env.NEXT_PUBLIC_FLAG_REPORTS === "1",
  tomorrow:   process.env.NEXT_PUBLIC_FLAG_TOMORROW === "1",
  // New unified reports system - default false in prod, true in staging
  reportsContract: process.env.NEXT_PUBLIC_FLAG_REPORTS_CONTRACT === "true",
};


