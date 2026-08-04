/**
 * Shared conversion helpers giữa CoinUnit (đơn vị BE trả về) và Coin (đơn vị UI).
 *
 * Quy ước: 100 CoinUnit = 1 Coin.
 *
 * BE trả `price` của chapter và các field liên quan theo CoinUnit để tránh
 * mất phần thập phân (vd: 520 CoinUnit = 5,2 Coin). Các UI text phải hiển thị
 * theo Coin và dùng helper này để chuyển đổi, tránh chia 100 rải rác trong từng
 * component.
 */

export const COIN_UNIT_PER_COIN = 100;

const COIN_FORMATTER = new Intl.NumberFormat('vi-VN', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/**
 * Chuyển CoinUnit sang Coin.
 *
 * @example
 *   coinUnitsToCoin(200); // 2
 *   coinUnitsToCoin(520); // 5.2
 */
export function coinUnitsToCoin(coinUnits: number | null | undefined): number {
  if (!Number.isFinite(coinUnits)) return 0;
  const safe = coinUnits ?? 0;
  return safe / COIN_UNIT_PER_COIN;
}

/**
 * Format CoinUnit thành chuỗi tiếng Việt theo đơn vị Coin.
 *
 * @example
 *   formatCoinUnits(200);   // "2"
 *   formatCoinUnits(520);   // "5,2"
 *   formatCoinUnits(undefined); // "0"
 */
export function formatCoinUnits(value: number | null | undefined): string {
  const coin = coinUnitsToCoin(value);
  return COIN_FORMATTER.format(coin);
}