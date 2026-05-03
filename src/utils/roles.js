export const ROLE_LABELS = {
  city_president: "City President",
  city_vice_president: "City Vice President",
  city_secretary: "City Secretary",
  city_finance_manager: "City Finance Manager",
  zone_president: "Zone President",
  zone_vice_president: "Zone Vice President",
  zone_secretary: "Zone Secretary",
  zone_finance_manager: "Zone Finance Manager",
  unit_president: "Unit President",
  unit_vice_president: "Unit Vice President",
  unit_secretary: "Unit Secretary",
  unit_finance_manager: "Unit Finance Manager",
  social_media_manager: "Social Media Manager"
};

export function roleLabel(role) {
  return ROLE_LABELS[role] || role;
}

export function roleLevel(role) {
  if (role?.startsWith("city_")) return "city";
  if (role?.startsWith("zone_")) return "zone";
  return "unit";
}

export function canManageZones(role) {
  return role === "city_president" || role === "city_vice_president";
}

export function canManageUnits(role) {
  return canManageZones(role) || role === "zone_president";
}

export function canWriteFinance(role) {
  return [
    "city_president",
    "city_finance_manager",
    "zone_president",
    "zone_finance_manager",
    "unit_president",
    "unit_finance_manager"
  ].includes(role);
}
