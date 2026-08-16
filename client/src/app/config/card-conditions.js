// Valores internos producidos por la sincronización de precios de TCGPlayer.
// Las etiquetas son las que se muestran al usuario en español.
export const CARD_CONDITION_OPTIONS = [
  { value: "normal", label: "Normal" },
  { value: "holofoil", label: "Holofoil" },
  { value: "reverseHolofoil", label: "Holofoil inverso" },
  { value: "unlimited", label: "Edición ilimitada" },
  { value: "1stEdition", label: "Primera edición" },
  { value: "unlimitedHolofoil", label: "Holofoil de edición ilimitada" },
  { value: "1stEditionHolofoil", label: "Holofoil de primera edición" },
];

const conditionLabels = new Map(
  CARD_CONDITION_OPTIONS.map(({ value, label }) => [value, label]),
);

const legacyConditionLabels = new Map([
  ["Mint", "Perfecta"],
  ["Near Mint", "Casi nueva"],
  ["Lightly Played", "Ligeramente jugada"],
  ["Moderately Played", "Moderadamente jugada"],
  ["Heavily Played", "Muy jugada"],
  ["Damaged", "Dañada"],
]);

export function getConditionLabel(value) {
  return conditionLabels.get(value) || legacyConditionLabels.get(value) || value || "Sin especificar";
}
