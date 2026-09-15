// Pastel tab colors, one per month, echoing the color-coded tabs on a
// physical disc-bound planner (mint for late summer, coral for fall, etc).
export const MONTH_COLORS = [
  '#cdeee0', // Jan - soft mint
  '#cfe8f3', // Feb - powder blue
  '#dbe3fb', // Mar - periwinkle
  '#e6d9f7', // Apr - lavender
  '#f6d9ee', // May - orchid pink
  '#fadbe0', // Jun - blush
  '#fbe0cf', // Jul - peach
  '#fde8c2', // Aug - butter
  '#c9ead1', // Sep - seafoam
  '#f9c8bd', // Oct - coral
  '#f6cede', // Nov - rose
  '#d6d7f5', // Dec - soft violet
]

export function monthColor(monthIndex: number): string {
  return MONTH_COLORS[((monthIndex % 12) + 12) % 12]
}
